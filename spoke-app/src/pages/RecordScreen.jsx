// RecordScreen.jsx
// Two input modes: record via mic OR upload an audio file
// On submit: passes audio Blob up to App.jsx via onSubmit(blob)

import { useState, useRef, useEffect } from 'react';

const MAX_DURATION = 600; // 10 minutes in seconds
const ACCEPTED_AUDIO = '.mp3,.m4a,.wav,.webm,.ogg,.aac,.flac';

export default function RecordScreen({ onSubmit }) {
  const [mode, setMode] = useState('record'); // 'record' | 'upload'
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'stopped'
  const [micError, setMicError] = useState(null); // null | 'permission' | 'notfound' | 'unknown'
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' }).then((result) => {
      if (result.state === 'denied') setMicError('permission');
    });
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // ─── Record mode ───────────────────────────────────────────────────────────

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setStatus('recording');
      elapsedRef.current = 0;
      setElapsed(0);

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= MAX_DURATION) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('permission');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicError('notfound');
      } else {
        setMicError('unknown');
      }
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setStatus('stopped');
  };

  const handleSubmitRecording = () => {
    if (audioBlob) onSubmit(audioBlob);
  };

  const handleResetRecording = () => {
    setStatus('idle');
    elapsedRef.current = 0;
    setElapsed(0);
    setAudioBlob(null);
    setMicError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  // ─── Upload mode ───────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
  };

  const handleSubmitUpload = () => {
    if (uploadedFile) onSubmit(uploadedFile);
  };

  const handleResetUpload = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-md text-center">

        {/* Header */}
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Spoke</h1>
        <p className="text-[#f5f5f0]/50 mb-10 text-lg">Speak your insight. We'll format it.</p>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-10 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => { setMode('record'); handleResetRecording(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'record' ? 'bg-white/15 text-[#f5f5f0]' : 'text-[#f5f5f0]/40 hover:text-[#f5f5f0]/70'
            }`}
          >
            🎙 Record
          </button>
          <button
            onClick={() => { setMode('upload'); handleResetUpload(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'upload' ? 'bg-white/15 text-[#f5f5f0]' : 'text-[#f5f5f0]/40 hover:text-[#f5f5f0]/70'
            }`}
          >
            ↑ Upload file
          </button>
        </div>

        {/* ── RECORD MODE ── */}
        {mode === 'record' && (
          <>
            {/* Timer */}
            <div className="text-6xl font-mono mb-10 tabular-nums tracking-tight">
              {formatTime(elapsed)}
            </div>

            {/* Mic error state */}
            {micError && status === 'idle' && (
              <div className="mb-6 text-sm text-[#f5f5f0]/60 bg-white/5 rounded-xl px-4 py-3 text-left space-y-1">
                {micError === 'permission' ? (
                  <>
                    <p className="font-medium text-[#f5f5f0]/80">Microphone access blocked.</p>
                    <p>Your browser has this site's mic permission set to Denied. Click the lock icon in your address bar → Site settings → Microphone → Allow, then reload.</p>
                  </>
                ) : micError === 'notfound' ? (
                  <>
                    <p className="font-medium text-[#f5f5f0]/80">No microphone found.</p>
                    <p>No audio input device detected. Plug in a mic or switch to{' '}
                      <button onClick={() => setMode('upload')} className="text-[#ff6b35] underline">Upload file</button>.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[#f5f5f0]/80">Mic unavailable.</p>
                    <p>Could not access microphone. Try{' '}
                      <button onClick={() => setMode('upload')} className="text-[#ff6b35] underline">Upload file</button>{' '}
                      instead.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* idle */}
            {status === 'idle' && (
              <button
                onClick={startRecording}
                className="w-48 h-48 rounded-full bg-[#ff6b35] hover:bg-[#e55d2b] active:scale-95 transition-all text-white font-semibold text-xl shadow-2xl"
              >
                Start Recording
              </button>
            )}

            {/* recording */}
            {status === 'recording' && (
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={stopRecording}
                  className="w-48 h-48 rounded-full bg-[#ff6b35] flex items-center justify-center shadow-2xl animate-pulse"
                  aria-label="Stop recording"
                >
                  <div className="w-10 h-10 bg-white rounded-sm" />
                </button>
                <p className="text-[#f5f5f0]/50 text-sm">Tap to stop</p>
              </div>
            )}

            {/* stopped */}
            {status === 'stopped' && audioUrl && (
              <div className="flex flex-col items-center gap-5 w-full">
                <audio src={audioUrl} controls className="w-full rounded-lg" />
                <button
                  onClick={handleSubmitRecording}
                  className="w-full py-4 bg-[#ff6b35] hover:bg-[#e55d2b] active:scale-95 transition-all rounded-2xl text-white font-semibold text-lg shadow-lg"
                >
                  Format this →
                </button>
                <button
                  onClick={handleResetRecording}
                  className="text-[#f5f5f0]/40 hover:text-[#f5f5f0]/70 text-sm transition-colors"
                >
                  Record again
                </button>
              </div>
            )}
          </>
        )}

        {/* ── UPLOAD MODE ── */}
        {mode === 'upload' && (
          <div className="flex flex-col items-center gap-5 w-full">
            {!uploadedFile ? (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-white/20 hover:border-[#ff6b35]/60 rounded-2xl text-[#f5f5f0]/50 hover:text-[#f5f5f0]/80 transition-all flex flex-col items-center gap-3"
                >
                  <span className="text-4xl">🎵</span>
                  <span className="font-medium">Choose audio file</span>
                  <span className="text-xs">MP3, M4A, WAV, AAC, FLAC</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_AUDIO}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-[#f5f5f0]/30 text-xs">
                  Record in Voice Memos or QuickTime, then upload here
                </p>
              </>
            ) : (
              <>
                <div className="w-full bg-white/5 rounded-2xl px-5 py-4 text-left">
                  <p className="font-medium text-sm truncate">{uploadedFile.name}</p>
                  <p className="text-[#f5f5f0]/40 text-xs mt-1">{formatFileSize(uploadedFile.size)}</p>
                </div>
                <button
                  onClick={handleSubmitUpload}
                  className="w-full py-4 bg-[#ff6b35] hover:bg-[#e55d2b] active:scale-95 transition-all rounded-2xl text-white font-semibold text-lg shadow-lg"
                >
                  Format this →
                </button>
                <button
                  onClick={handleResetUpload}
                  className="text-[#f5f5f0]/40 hover:text-[#f5f5f0]/70 text-sm transition-colors"
                >
                  Choose a different file
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

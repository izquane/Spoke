// SetupScreen.jsx
// One-time onboarding: writing intent + voice examples.
// Also used as an edit modal from RecordScreen (isEdit=true).
//
// Props:
//   onComplete: () => void   — called when setup is saved
//   isEdit: bool             — when true, shows "Save changes" and skips nav language

import { useState, useRef } from 'react';
import { extractVoiceFromImages } from '../lib/api';

const INTENT_PRESETS = [
  {
    key: 'insight',
    label: 'Insight / Reflection',
    description: 'Writing that makes the reader see something about themselves',
  },
  {
    key: 'education',
    label: 'Education',
    description: 'Writing that teaches something clearly and simply',
  },
  {
    key: 'storytelling',
    label: 'Storytelling',
    description: 'Writing that pulls the reader into an experience',
  },
  {
    key: 'motivation',
    label: 'Motivation',
    description: 'Writing that moves someone to act',
  },
  {
    key: 'custom',
    label: 'Custom',
    description: 'Describe your own intent',
  },
];

export default function SetupScreen({ onComplete, isEdit = false }) {
  const [step, setStep] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState(() => {
    if (!isEdit) return null;
    const saved = localStorage.getItem('spoke_writing_intent') || '';
    const match = INTENT_PRESETS.find((p) => p.key !== 'custom' && p.label === saved);
    return match ? match.key : saved ? 'custom' : null;
  });
  const [customIntent, setCustomIntent] = useState(() => {
    if (!isEdit) return '';
    const saved = localStorage.getItem('spoke_writing_intent') || '';
    const match = INTENT_PRESETS.find((p) => p.key !== 'custom' && p.label === saved);
    return match ? '' : saved;
  });
  const [voiceExamples, setVoiceExamples] = useState(() => {
    return isEdit ? (localStorage.getItem('spoke_voice_examples') || '') : '';
  });
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const imageInputRef = useRef(null);

  const intentValue =
    selectedPreset === 'custom'
      ? customIntent.trim()
      : INTENT_PRESETS.find((p) => p.key === selectedPreset)?.label || '';

  const canProceedStep1 = selectedPreset && (selectedPreset !== 'custom' || customIntent.trim());
  const canSave = voiceExamples.trim().length > 0;

  const handleSave = () => {
    localStorage.setItem('spoke_writing_intent', intentValue);
    localStorage.setItem('spoke_voice_examples', voiceExamples.trim());
    onComplete();
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setExtractError('Please select image files (JPG, PNG).');
      return;
    }
    if (validFiles.length > 10) {
      setExtractError('Upload up to 10 screenshots at a time.');
      return;
    }

    setExtracting(true);
    setExtractError(null);
    setUploadedCount(validFiles.length);

    try {
      const { text } = await extractVoiceFromImages(validFiles);
      setVoiceExamples((prev) => {
        const existing = prev.trim();
        return existing ? `${existing}\n\n${text}` : text;
      });
    } catch (err) {
      setExtractError(err.message || 'Could not extract text. Try pasting manually.');
    } finally {
      setExtracting(false);
      // Reset input so same files can be re-uploaded if needed
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-10">
      <div className="w-full max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            {isEdit ? 'Your voice profile' : 'Set up your voice'}
          </h1>
          {!isEdit && (
            <p className="text-[#f5f5f0]/50 text-sm">
              Takes 2 minutes. Spoke uses this to write in your voice.
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors ${
                n <= step ? 'bg-[#ff6b35]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* ── Step 1: Writing intent ── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-1">What do you want your writing to do?</h2>
            <p className="text-[#f5f5f0]/40 text-sm mb-6">Pick the one that fits best.</p>

            <div className="space-y-2">
              {INTENT_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setSelectedPreset(preset.key)}
                  className={`w-full text-left px-4 py-4 rounded-xl border transition-colors ${
                    selectedPreset === preset.key
                      ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <p className="font-medium text-sm">{preset.label}</p>
                  {preset.key !== 'custom' && (
                    <p className="text-xs text-[#f5f5f0]/40 mt-0.5">{preset.description}</p>
                  )}
                </button>
              ))}
            </div>

            {selectedPreset === 'custom' && (
              <textarea
                value={customIntent}
                onChange={(e) => setCustomIntent(e.target.value)}
                placeholder="Describe what you want your writing to do..."
                rows={3}
                className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f5f5f0]/80 placeholder-[#f5f5f0]/20 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
                autoFocus
              />
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full mt-6 py-3.5 bg-[#ff6b35] hover:bg-[#e55d2b] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* ── Step 2: Voice examples ── */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="text-[#f5f5f0]/30 hover:text-[#f5f5f0]/60 text-sm mb-6 transition-colors"
            >
              ← Back
            </button>

            <h2 className="text-lg font-semibold mb-1">
              Add examples of your writing.
            </h2>
            <p className="text-[#f5f5f0]/40 text-sm mb-6">
              3–5 pieces is enough. Upload screenshots or paste text directly.
            </p>

            {/* Upload button */}
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={extracting}
              className="w-full py-4 mb-3 border border-dashed border-white/20 hover:border-[#ff6b35]/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {extracting ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#ff6b35]/40 border-t-[#ff6b35] rounded-full animate-spin" />
                  <span className="text-[#f5f5f0]/60">
                    Reading {uploadedCount} screenshot{uploadedCount !== 1 ? 's' : ''}...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base">📷</span>
                  <span className="text-[#f5f5f0]/60">Upload screenshots</span>
                </>
              )}
            </button>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {extractError && (
              <p className="text-red-400 text-xs mb-3">{extractError}</p>
            )}

            {voiceExamples && (
              <p className="text-[#f5f5f0]/30 text-xs mb-2">
                Extracted — review or edit, then save.
              </p>
            )}

            <textarea
              value={voiceExamples}
              onChange={(e) => setVoiceExamples(e.target.value)}
              placeholder="Or paste your writing here..."
              rows={10}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f5f5f0]/80 placeholder-[#f5f5f0]/20 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
            />

            <button
              onClick={handleSave}
              disabled={!canSave || extracting}
              className="w-full mt-4 py-3.5 bg-[#ff6b35] hover:bg-[#e55d2b] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors"
            >
              {isEdit ? 'Save changes' : 'Save and start →'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

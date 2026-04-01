// App.jsx — Screen state machine
// Screens: 'record' | 'loading' | 'output'
// Flow: RecordScreen → (submit audio) → LoadingScreen → (API returns) → OutputScreen

import { useState } from 'react';
import RecordScreen from './pages/RecordScreen';
import LoadingScreen from './pages/LoadingScreen';
import OutputScreen from './pages/OutputScreen';
import { submitRecording } from './lib/api';

export default function App() {
  const [screen, setScreen] = useState('record');
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);

  // Called by RecordScreen when user hits "Format this →"
  const handleSubmit = async (audioBlob) => {
    setScreen('loading');
    setError(null);

    try {
      const data = await submitRecording(audioBlob);
      setOutput(data);
      setScreen('output');
    } catch (err) {
      console.error('Error processing recording:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setScreen('record');
    }
  };

  // Called by OutputScreen when user hits "+ New recording"
  const handleReset = () => {
    setOutput(null);
    setError(null);
    setScreen('record');
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#f5f5f0]">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/40 text-red-300 px-6 py-3 rounded-xl text-sm z-50">
          {error}
        </div>
      )}

      {screen === 'record' && <RecordScreen onSubmit={handleSubmit} />}
      {screen === 'loading' && <LoadingScreen />}
      {screen === 'output' && output && (
        <OutputScreen output={output} onReset={handleReset} />
      )}
    </div>
  );
}

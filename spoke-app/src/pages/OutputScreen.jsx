// OutputScreen.jsx
// Displays the essay and 3 moment variations from a recording.
// Single page, stacked — no tabs, no framework overlay.
//
// Props:
//   output: { transcript, perspective, formats: { essay, moments } }
//   onReset: () => void
//   onReformat: (transcript, perspective) => Promise<void>

import { useState } from 'react';
import CopyButton from '../components/CopyButton';

export default function OutputScreen({ output, onReset, onReformat }) {
  const { essay, moments = [] } = output.formats;
  const [isReformatting, setIsReformatting] = useState(false);

  const handlePerspectiveToggle = async (newPerspective) => {
    if (isReformatting || newPerspective === output.perspective) return;
    setIsReformatting(true);
    try {
      await onReformat(output.transcript, newPerspective);
    } finally {
      setIsReformatting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-10">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your writing</h1>

          {/* Perspective toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => handlePerspectiveToggle('first')}
              disabled={isReformatting}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                output.perspective === 'first'
                  ? 'bg-white/15 text-[#f5f5f0]'
                  : 'text-[#f5f5f0]/40 hover:text-[#f5f5f0]/70'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Personal
            </button>
            <button
              onClick={() => handlePerspectiveToggle('observational')}
              disabled={isReformatting}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                output.perspective === 'observational'
                  ? 'bg-white/15 text-[#f5f5f0]'
                  : 'text-[#f5f5f0]/40 hover:text-[#f5f5f0]/70'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Universal
            </button>
          </div>
        </div>

        {/* Reformatting overlay */}
        {isReformatting && (
          <div className="flex items-center gap-3 mb-6 text-sm text-[#f5f5f0]/50">
            <span className="w-4 h-4 border-2 border-[#ff6b35]/40 border-t-[#ff6b35] rounded-full animate-spin flex-shrink-0" />
            Rewriting in {output.perspective === 'first' ? 'observational' : 'first person'} voice...
          </div>
        )}

        {/* Essay */}
        <section className={`mb-10 transition-opacity ${isReformatting ? 'opacity-30' : 'opacity-100'}`}>
          <p className="text-xs text-[#f5f5f0]/30 uppercase tracking-widest font-medium mb-4">Essay</p>
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="whitespace-pre-wrap leading-relaxed text-[#f5f5f0]/90 text-sm">
              {essay}
            </div>
            <div className="mt-4">
              <CopyButton text={essay} />
            </div>
          </div>
        </section>

        {/* Moments */}
        <section className={`mb-10 transition-opacity ${isReformatting ? 'opacity-30' : 'opacity-100'}`}>
          <p className="text-xs text-[#f5f5f0]/30 uppercase tracking-widest font-medium mb-4">Moments</p>
          <div className="space-y-4">
            {moments.map((moment, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6">
                <p className="text-xs text-[#f5f5f0]/30 mb-3 font-mono">Option {i + 1}</p>
                <div className="whitespace-pre-wrap leading-relaxed text-[#f5f5f0]/90 text-sm">
                  {moment}
                </div>
                <div className="mt-4">
                  <CopyButton text={moment} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New recording */}
        <button
          onClick={onReset}
          disabled={isReformatting}
          className="w-full py-4 border border-white/15 hover:border-white/35 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors font-medium"
        >
          + New recording
        </button>

      </div>
    </div>
  );
}

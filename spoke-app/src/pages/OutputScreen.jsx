// OutputScreen.jsx
// Displays formatted outputs. Optionally apply a framework for a second Claude pass.
// Props:
//   output: { recording_id, transcript, formats: { tweet, thread, longform, caption } }
//   onReset: () => void

import { useState } from 'react';
import CopyButton from '../components/CopyButton';
import { applyFramework } from '../lib/api';

const TABS = [
  { key: 'tweet', label: 'Tweet' },
  { key: 'thread', label: 'Thread' },
  { key: 'longform', label: 'Long-form' },
  { key: 'caption', label: 'Caption' },
];

const JK_MOLINA_FRAMEWORK = `# The Static Framework

## BEFORE YOU WRITE
1. Who? — Specific person, what's their real problem?
2. What's the unreasonable idea? — What's true they don't know? What contradicts what they think?
3. How do you prove it? — One specific example, details that make it real.
4. What's the value? — Insight (how to think)? Value (what to do)? Both?

## STRUCTURE
OPENING: Specific truth they recognize. No setup, no preamble. Hook in 1-2 sentences.
INSIGHT: The unreasonable idea. Why it's true. Make it land.
PROOF: One detailed example. Shows why the insight is true. They recognize themselves in it.
VALUE: What they can do/think differently. Specific and actionable. Connected to the insight.
CLOSE: The bigger frame. What becomes possible. One clear ask.

## THE THREE THINGS
Every piece must have:
1. INSIGHT = Something they didn't think of before
2. VALUE = Something they can use or think with
3. RESPECT = Assumes they're smart, respects their time

## FORMAT SPECIFICS (SOCIAL POST)
- Opening: The hook (specific truth)
- Insight: The reframe
- Proof: One example or observation
- Value: What to do differently
- Close: One ask
- Length: 2-4 short paragraphs

## EDITING CHECKLIST
- One clear idea (not five)
- Opening is immediate (no throat-clearing)
- One specific example (not generic)
- Sounds like me thinking, not performing
- Every sentence necessary
- Is it true?`;

export default function OutputScreen({ output, onReset }) {
  const [activeTab, setActiveTab] = useState('tweet');
  const [formats, setFormats] = useState(output.formats);
  const [frameworkOpen, setFrameworkOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customFramework, setCustomFramework] = useState('');
  const [applying, setApplying] = useState(false);
  const [frameworkError, setFrameworkError] = useState(null);
  const [frameworkApplied, setFrameworkApplied] = useState(false);

  const tweets = Array.isArray(formats.tweet) ? formats.tweet : [formats.tweet];

  const handleApplyFramework = async () => {
    const frameworkText = selectedPreset === 'jk' ? JK_MOLINA_FRAMEWORK : customFramework;
    if (!frameworkText.trim()) return;

    setApplying(true);
    setFrameworkError(null);
    try {
      const result = await applyFramework(output.transcript, frameworkText);
      setFormats(result.formats);
      setFrameworkApplied(true);
      setFrameworkOpen(false);
    } catch (err) {
      setFrameworkError(err.message || 'Something went wrong. Try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleResetToOriginal = () => {
    setFormats(output.formats);
    setFrameworkApplied(false);
    setSelectedPreset(null);
    setCustomFramework('');
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-10">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            Your formats
            {frameworkApplied && (
              <span className="ml-2 text-sm font-normal text-[#ff6b35]">· framework applied</span>
            )}
          </h1>
          {frameworkApplied && (
            <button
              onClick={handleResetToOriginal}
              className="text-xs text-[#f5f5f0]/40 hover:text-[#f5f5f0]/70 transition-colors"
            >
              Reset to original
            </button>
          )}
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-[#ff6b35] text-white'
                  : 'text-[#f5f5f0]/60 hover:text-[#f5f5f0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div className="bg-white/5 rounded-2xl p-6 min-h-[280px]">

          {/* Tweet tab */}
          {activeTab === 'tweet' && (
            <div className="space-y-4">
              {tweets.map((t, i) => (
                <div key={i} className="pb-4 border-b border-white/10 last:border-0">
                  <p className="text-xs text-[#f5f5f0]/30 mb-1 font-mono">Option {i + 1}</p>
                  <p className="leading-relaxed">{t}</p>
                  <p className="text-[#f5f5f0]/30 text-xs mt-2">{t.length} / 280 chars</p>
                  <CopyButton text={t} />
                </div>
              ))}
            </div>
          )}

          {/* Thread tab */}
          {activeTab === 'thread' && (
            <div>
              {formats.thread.map((tweet, i) => (
                <div key={i} className="mb-4 pb-4 border-b border-white/10 last:border-0">
                  <p className="text-xs text-[#f5f5f0]/30 mb-1 font-mono">
                    {i + 1}/{formats.thread.length}
                  </p>
                  <p className="leading-relaxed">{tweet}</p>
                </div>
              ))}
              <CopyButton text={formats.thread.join('\n\n')} label="Copy full thread" />
            </div>
          )}

          {/* Long-form tab */}
          {activeTab === 'longform' && (
            <div>
              <div className="whitespace-pre-wrap leading-relaxed text-[#f5f5f0]/90 text-sm">
                {formats.longform}
              </div>
              <CopyButton text={formats.longform} />
            </div>
          )}

          {/* Caption tab */}
          {activeTab === 'caption' && (
            <div>
              <div className="whitespace-pre-wrap leading-relaxed text-[#f5f5f0]/90">
                {formats.caption}
              </div>
              <CopyButton text={formats.caption} />
            </div>
          )}
        </div>

        {/* Framework section */}
        <div className="mt-4">
          {!frameworkOpen ? (
            <button
              onClick={() => setFrameworkOpen(true)}
              className="w-full py-3 border border-white/10 hover:border-[#ff6b35]/50 rounded-2xl text-[#f5f5f0]/50 hover:text-[#f5f5f0]/80 text-sm transition-colors"
            >
              Apply a framework →
            </button>
          ) : (
            <div className="bg-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Choose a framework</p>
                <button
                  onClick={() => setFrameworkOpen(false)}
                  className="text-[#f5f5f0]/30 hover:text-[#f5f5f0]/60 text-xs"
                >
                  Cancel
                </button>
              </div>

              {/* Preset */}
              <button
                onClick={() => setSelectedPreset(selectedPreset === 'jk' ? null : 'jk')}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${
                  selectedPreset === 'jk'
                    ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#f5f5f0]'
                    : 'border-white/10 text-[#f5f5f0]/60 hover:border-white/25'
                }`}
              >
                <p className="font-medium">JK Molina — The Static Framework</p>
                <p className="text-xs mt-0.5 opacity-60">Insight + proof + value. Built for authority content.</p>
              </button>

              {/* Custom */}
              <div>
                <p className="text-xs text-[#f5f5f0]/40 mb-2">Or paste your own framework</p>
                <textarea
                  value={customFramework}
                  onChange={(e) => { setCustomFramework(e.target.value); setSelectedPreset(null); }}
                  placeholder="Paste your framework rules here..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f5f5f0]/80 placeholder-[#f5f5f0]/20 focus:outline-none focus:border-[#ff6b35]/50 resize-none"
                />
              </div>

              {frameworkError && (
                <p className="text-red-400 text-xs">{frameworkError}</p>
              )}

              <button
                onClick={handleApplyFramework}
                disabled={applying || (!selectedPreset && !customFramework.trim())}
                className="w-full py-3 bg-[#ff6b35] hover:bg-[#e55d2b] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors"
              >
                {applying ? 'Applying...' : 'Apply framework'}
              </button>
            </div>
          )}
        </div>

        {/* New recording */}
        <button
          onClick={onReset}
          className="w-full mt-4 py-4 border border-white/15 hover:border-white/35 rounded-2xl text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors font-medium"
        >
          + New recording
        </button>

      </div>
    </div>
  );
}

// CopyButton.jsx
// Copies `text` to clipboard on click.
// Shows "✓ Copied!" for 2 seconds, then resets.
// Props:
//   text: string — content to copy
//   label: string — button label (default: "Copy")

import { useState } from 'react';

export default function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard API
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`mt-5 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
        copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-white/10 text-[#f5f5f0] hover:bg-white/20 border border-white/10'
      }`}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}

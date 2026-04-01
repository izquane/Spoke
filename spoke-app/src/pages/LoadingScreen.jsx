// LoadingScreen.jsx
// Shown while audio is being transcribed and formatted.
// No props needed — purely visual.

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">

      {/* Bouncing dots */}
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-[#ff6b35] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="text-[#f5f5f0]/80 text-lg font-medium">Transcribing your recording...</p>
        <p className="text-[#f5f5f0]/40 text-sm mt-2">Usually takes 15–30 seconds</p>
      </div>
    </div>
  );
}

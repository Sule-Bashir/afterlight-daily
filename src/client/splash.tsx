import './index.css';

import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#080b12] px-5 py-10 text-white">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-4xl text-amber-300">
        ✳
      </div>

      <p className="mb-3 text-xs font-bold tracking-[0.35em] text-amber-300">
        DAILY MEMORY CHALLENGE
      </p>

      <h1 className="text-center text-5xl font-extrabold tracking-tight">
        AFTERLIGHT
      </h1>

      <p className="mt-4 text-center text-lg font-medium text-gray-300">
        Memory fades. Patterns remain.
      </p>

      <p className="mt-3 max-w-sm text-center text-sm leading-6 text-gray-400">
        Six lights will appear. Memorize their positions, then rebuild the
        pattern before time runs out.
      </p>

      <div className="mt-9 w-full max-w-xs rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }, (_, index) => (
            <div
              key={index}
              className={`aspect-square rounded-lg border ${
                [1, 4, 6, 9, 11, 14].includes(index)
                  ? 'border-amber-300/60 bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.35)]'
                  : 'border-white/10 bg-white/[0.04]'
              }`}
            />
          ))}
        </div>

        <p className="mt-4 text-center text-xs tracking-widest text-gray-400">
          ONE DAY. ONE PATTERN.
        </p>
      </div>

      <button
        className="mt-8 flex min-h-12 w-full max-w-xs items-center justify-center gap-3 rounded-full bg-amber-300 px-6 py-3 font-bold text-[#111318] transition-colors hover:bg-amber-200"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Enter AFTERLIGHT <span>→</span>
      </button>

      <p className="mt-5 text-xs text-gray-500">
        Welcome, {context.username ?? 'player'}
      </p>

      <p className="mt-8 text-[10px] tracking-[0.25em] text-gray-600">
        AFTERLIGHT © 2026
      </p>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);

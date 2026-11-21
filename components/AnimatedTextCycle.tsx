'use client'

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface AnimatedTextCycleProps {
  words: string[];
  interval?: number;
  className?: string;
}

// SSR-safe layout effect: measure before paint on the client, no-op on the server.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Cycles through `words`, cross-fading each one in place.
 *
 * Driven entirely by CSS transitions (no AnimatePresence / exit callbacks), so
 * the cycle can never stall waiting for an animation-finished event — which is
 * what froze it on some mobile browsers. Every word stays mounted, stacked in
 * one grid cell; the container's width eases to the active word's measured
 * width so surrounding inline text slides rather than jumps.
 */
export default function AnimatedTextCycle({
  words,
  interval = 5000,
  className = "",
}: AnimatedTextCycleProps) {
  const [tick, setTick] = useState(0);
  const currentIndex = tick % words.length;
  const prevIndex = tick > 0 ? (tick - 1) % words.length : null;
  const [widths, setWidths] = useState<number[] | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Measure every word on its own line, never wrapped. Re-measure when the
  // web font finishes loading or the text size changes at a breakpoint.
  useIsoLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () =>
      setWidths(
        Array.from(el.children).map((c) => Math.ceil(c.getBoundingClientRect().width))
      );
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [words]);

  useEffect(() => {
    if (words.length < 2) return;
    const timer = setInterval(() => setTick((t) => t + 1), interval);
    return () => clearInterval(timer);
  }, [interval, words.length]);

  const width = widths?.[currentIndex];

  return (
    <span className="relative flex">
      {/* Off-screen measurer: one non-wrapping line per word. */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex flex-col items-start whitespace-nowrap"
      >
        {words.map((word, i) => (
          <span key={i} className={`font-bold ${className}`}>
            {word}
          </span>
        ))}
      </span>

      <span
        className="inline-grid grid-cols-[100%] justify-items-center transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={width ? { width } : undefined}
      >
        {words.map((word, i) => {
          const isActive = i === currentIndex;
          const isLeaving = i === prevIndex;
          return (
            <span
              key={i}
              aria-hidden={!isActive}
              className={`col-start-1 row-start-1 whitespace-nowrap font-bold ${className} transition-[opacity,transform,filter] motion-reduce:transition-none ${
                isActive
                  ? "translate-y-0 opacity-100 blur-0 duration-500 delay-150 ease-out"
                  : isLeaving
                    ? "translate-y-[0.9em] opacity-0 blur-[4px] duration-300 ease-in"
                    : "-translate-y-[0.9em] opacity-0 blur-[4px] duration-0"
              }`}
            >
              {word}
            </span>
          );
        })}
      </span>
    </span>
  );
}

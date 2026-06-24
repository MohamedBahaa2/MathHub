"use client";

// Deterministic positions — no Math.random() to avoid SSR hydration mismatch.
const SYMBOLS = [
  // Large hero symbols
  { content: "π",    x: 3,  y: 6,  size: 9,  opacity: 0.13, anim: "math-float-a", dur: 7,  delay: 0,   rot: -12, color: "primary" },
  { content: "Σ",    x: 88, y: 10, size: 11, opacity: 0.11, anim: "math-float-b", dur: 9,  delay: 1.5, rot: 8,   color: "secondary" },
  { content: "∫",    x: 76, y: 58, size: 13, opacity: 0.10, anim: "math-float-a", dur: 11, delay: 0.5, rot: 5,   color: "secondary" },
  { content: "∞",    x: 44, y: 20, size: 8,  opacity: 0.12, anim: "math-float-c", dur: 8,  delay: 3,   rot: 0,   color: "primary" },
  { content: "√‾",   x: 16, y: 72, size: 7,  opacity: 0.12, anim: "math-float-b", dur: 9,  delay: 4,   rot: -6,  color: "primary" },
  { content: "Δ",    x: 61, y: 84, size: 8,  opacity: 0.11, anim: "math-float-a", dur: 8,  delay: 5.5, rot: 15,  color: "secondary" },
  // Medium symbols
  { content: "θ",    x: 10, y: 44, size: 6,  opacity: 0.13, anim: "math-float-c", dur: 10, delay: 2,   rot: -10, color: "primary" },
  { content: "λ",    x: 85, y: 36, size: 6,  opacity: 0.11, anim: "math-float-a", dur: 7,  delay: 6.5, rot: 8,   color: "secondary" },
  { content: "±",    x: 31, y: 89, size: 6,  opacity: 0.12, anim: "math-float-b", dur: 8,  delay: 1,   rot: -5,  color: "primary" },
  { content: "∂",    x: 70, y: 15, size: 6,  opacity: 0.11, anim: "math-float-c", dur: 9,  delay: 4.5, rot: 12,  color: "secondary" },
  { content: "∇",    x: 93, y: 74, size: 7,  opacity: 0.10, anim: "math-float-a", dur: 10, delay: 2.5, rot: 6,   color: "primary" },
  { content: "ℕ",    x: 36, y: 4,  size: 6,  opacity: 0.11, anim: "math-float-b", dur: 7,  delay: 5,   rot: -14, color: "secondary" },
  { content: "x²",   x: 80, y: 88, size: 7,  opacity: 0.12, anim: "math-float-c", dur: 8,  delay: 0.5, rot: 10,  color: "primary" },
  { content: "e",    x: 24, y: 30, size: 8,  opacity: 0.10, anim: "math-float-a", dur: 11, delay: 3.5, rot: -18, color: "secondary" },
  { content: "∈",    x: 56, y: 40, size: 5,  opacity: 0.12, anim: "math-float-b", dur: 8,  delay: 8,   rot: 3,   color: "primary" },
  { content: "α",    x: 40, y: 54, size: 5,  opacity: 0.11, anim: "math-float-c", dur: 9,  delay: 6,   rot: -7,  color: "secondary" },
  { content: "≈",    x: 6,  y: 60, size: 6,  opacity: 0.12, anim: "math-float-a", dur: 8,  delay: 2.8, rot: 0,   color: "primary" },
  { content: "f(x)", x: 52, y: 70, size: 5,  opacity: 0.11, anim: "math-float-b", dur: 7,  delay: 7.5, rot: -8,  color: "secondary" },
  // Material Symbols icons
  { content: "calculate", x: 21, y: 13, size: 6,  opacity: 0.10, anim: "math-float-c", dur: 9,  delay: 3,   rot: 8,   color: "primary",   isIcon: true },
  { content: "functions",  x: 66, y: 30, size: 7,  opacity: 0.09, anim: "math-float-a", dur: 11, delay: 6,   rot: -12, color: "secondary", isIcon: true },
  { content: "123",        x: 47, y: 80, size: 5,  opacity: 0.10, anim: "math-float-b", dur: 8,  delay: 1,   rot: 5,   color: "primary",   isIcon: true },
  { content: "percent",    x: 86, y: 52, size: 6,  opacity: 0.09, anim: "math-float-c", dur: 9,  delay: 4,   rot: -6,  color: "secondary", isIcon: true },
];

const ANIM_MAP = {
  "math-float-a": "math-float-a",
  "math-float-b": "math-float-b",
  "math-float-c": "math-float-c",
};

export default function MathBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {SYMBOLS.map((s, i) => {
        const style = {
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          fontSize: `${s.size}rem`,
          opacity: s.opacity,
          animation: `${ANIM_MAP[s.anim]} ${s.dur}s cubic-bezier(0.37, 0, 0.63, 1) ${s.delay}s infinite`,
          transform: `rotate(${s.rot}deg)`,
          color: s.color === "primary" ? "var(--color-primary)" : "var(--color-secondary)",
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          willChange: "transform",
        };

        if (s.isIcon) {
          return (
            <span
              key={i}
              className="material-symbols-outlined"
              style={{ ...style, fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              {s.content}
            </span>
          );
        }

        return (
          <span
            key={i}
            style={{ ...style, fontFamily: "var(--font-headline), Georgia, serif" }}
          >
            {s.content}
          </span>
        );
      })}
    </div>
  );
}

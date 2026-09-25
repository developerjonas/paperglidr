/**
 * Decorative coloured traces behind the hero. Drawn on a fixed 1280-wide
 * frame whose y=465 line sits on the vertical centre of the parent (the CTA
 * row), so the horizontal traces run through the buttons. Edges fade out.
 */
const TRACES = [
  // left side
  { d: "M20 0V112Q20 130 38 130H252Q270 130 270 148V308", color: "#a855f7" },
  { d: "M0 310H102Q120 310 120 328V447Q120 465 138 465H270", color: "#14b8a6" },
  { d: "M0 558H102Q120 558 120 540V483Q120 465 138 465", color: "#14b8a6" },
  { d: "M270 465V540Q270 558 252 558H191Q173 558 173 576V640", color: "#2563eb" },
  // right side
  { d: "M1245 0V290Q1245 308 1227 308H1007", color: "#f59e0b" },
  { d: "M1197 0V112Q1197 130 1179 130H1024Q1006 130 1006 148V300", color: "#64748b" },
  { d: "M1079 0V447Q1079 465 1061 465H1007", color: "#ec4899" },
  { d: "M1280 130H1176Q1156 130 1156 150V445Q1156 465 1136 465H1007", color: "#2563eb" },
  { d: "M1280 558H1176Q1156 558 1156 538V485Q1156 465 1136 465", color: "#ef4444" },
  // the connector through the buttons
  { d: "M270 465H1007", color: "#2563eb" },
] as const;

const DOTS = [
  { cx: 270, cy: 308, color: "#a855f7" },
  { cx: 270, cy: 465, color: "#14b8a6" },
  { cx: 1007, cy: 308, color: "#f59e0b" },
  { cx: 1007, cy: 465, color: "#ec4899" },
] as const;

export function CircuitLines() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1280 700"
      width="1280"
      height="700"
      className="pointer-events-none absolute left-1/2 top-[calc(50%-465px)] hidden max-w-none -translate-x-1/2 lg:block"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent), linear-gradient(to bottom, black 80%, transparent)",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent), linear-gradient(to bottom, black 80%, transparent)",
      }}
    >
      {TRACES.map(({ d, color }) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeOpacity="0.75"
        />
      ))}
      {DOTS.map(({ cx, cy, color }) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill={color} />
      ))}
    </svg>
  );
}

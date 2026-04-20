const rowY = {
  OFF: 8,
  SB: 36,
  D: 64,
  ON: 92,
};


function buildPath(segments) {
  const ordered = [...(segments || [])]
    .filter((segment) => segment.end_hour > segment.start_hour)
    .sort((a, b) => a.start_hour - b.start_hour);

  if (!ordered.length) return "";

  let previousY = rowY[ordered[0].row] || rowY.OFF;
  let path = "";

  ordered.forEach((segment, index) => {
    const startX = (segment.start_hour / 24) * 100;
    const endX = (segment.end_hour / 24) * 100;
    const y = rowY[segment.row] || rowY.OFF;

    if (index === 0) {
      path += `M ${startX} ${y}`;
    } else {
      path += ` L ${startX} ${previousY} L ${startX} ${y}`;
    }
    path += ` L ${endX} ${y}`;
    previousY = y;
  });

  return path;
}


export default function LogGrid({ log }) {
  const path = buildPath(log?.graph_segments || []);
  const hourLabels = ["M", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "N", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "M"];

  return (
    <div className="relative py-8" data-testid="log-grid">
      <div className="absolute left-0 top-8 bottom-8 flex flex-col justify-between font-label text-xs text-on-surface-variant w-16 text-right pr-4">
        <span>OFF</span>
        <span>SB</span>
        <span>D</span>
        <span>ON</span>
      </div>
      <div className="ml-16 border-l border-b border-surface-container relative h-48 bg-surface-container-lowest">
        <div className="absolute -bottom-6 left-0 right-0 flex justify-between font-label text-xs text-on-surface-variant px-1">
          {hourLabels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-25">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="w-full border-t border-surface-dim" />
          ))}
        </div>
        <div className="absolute inset-0 grid grid-cols-24 pointer-events-none opacity-20">
          {Array.from({ length: 25 }).map((_, index) => (
            <div key={index} className="h-full border-l border-surface-dim" />
          ))}
        </div>
        <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          {path && (
            <path
              d={path}
              fill="none"
              stroke="#003686"
              strokeLinejoin="miter"
              strokeLinecap="square"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

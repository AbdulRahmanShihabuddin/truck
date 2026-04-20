import { useState } from "react";


function normalizePoints(points) {
  if (!points?.length) {
    return [
      { label: "Origin", x: 20, y: 80 },
      { label: "Pickup", x: 50, y: 50 },
      { label: "Destination", x: 80, y: 20 },
    ];
  }

  const lats = points.map((point) => Number(point.latitude));
  const lons = points.map((point) => Number(point.longitude));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const latRange = maxLat - minLat || 1;
  const lonRange = maxLon - minLon || 1;

  return points.map((point) => ({
    ...point,
    x: 15 + ((Number(point.longitude) - minLon) / lonRange) * 70,
    y: 85 - ((Number(point.latitude) - minLat) / latRange) * 70,
  }));
}


export default function RouteMap({ route, schedule }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const points = normalizePoints(route?.map_points);
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const stopCount = schedule?.filter((segment) => segment.status !== "driving").length || 0;
  const zoomIn = () => setZoom((value) => Math.min(1.8, Number((value + 0.2).toFixed(1))));
  const zoomOut = () => setZoom((value) => Math.max(0.8, Number((value - 0.2).toFixed(1))));
  const recenter = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <section className="flex-1 relative bg-surface-container-high min-h-[620px] md:min-h-0 overflow-hidden" data-testid="route-map">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60 grayscale"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDzbTlB1edrvK9IUdBACnVHsIAXvstFxfm_l5kSzJA60RL8gxlrtxIZCCErVNgeu-s90yjI-QUcGAaYGw0kxOc344sKprZQ92EbBKlRgXVIcceAzIg_p44vMyU-ieabIPz0OmIVjLZkbZMU-0vX-Rpe1BQ_VHft4ujB77zRQ0d71dFCaeVrLHihqh5Uy01Aptv1124CnyvW3REtgRCfvPTCC6mTDdM0KuG_Wd_aw86XHWeQSzuSpkjsw8H_cL6kmltfDkJwwuUuXoQn')",
        }}
      />
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div className="bg-surface-container-lowest/90 backdrop-blur-md px-6 py-3 rounded-full ghost-border pointer-events-auto flex flex-wrap gap-6 items-center shadow-[0_8px_32px_rgba(25,27,34,0.06)]">
          <div className="flex flex-col">
            <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Distance</span>
            <span className="font-body font-medium text-on-surface">{Math.round(route?.total_distance_miles || 0).toLocaleString()} mi</span>
          </div>
          <div className="w-px h-8 bg-surface-variant" />
          <div className="flex flex-col">
            <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Stops</span>
            <span className="font-body font-medium text-on-surface">{stopCount}</span>
          </div>
          <div className="w-px h-8 bg-surface-variant" />
          <div className="flex flex-col">
            <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">HOS Status</span>
            <span className="font-body font-medium text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Compliant
            </span>
          </div>
        </div>
        <div className="hidden md:flex flex-col gap-2 pointer-events-auto">
          {[
            ["add", "Zoom in", zoomIn],
            ["remove", "Zoom out", zoomOut],
            ["my_location", "Recenter", recenter],
          ].map(([icon, label, action], index) => (
            <button
              key={icon}
              className={`w-10 h-10 bg-surface-container-lowest/90 backdrop-blur-md rounded-full flex items-center justify-center ghost-border text-on-surface hover:bg-surface-container-lowest shadow-[0_8px_32px_rgba(25,27,34,0.06)] transition-colors ${index === 2 ? "mt-4" : ""}`}
              aria-label={label}
              onClick={action}
            >
              <span className="material-symbols-outlined">{icon}</span>
            </button>
          ))}
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom}) translate(${(100 - 100 * zoom) / (2 * zoom)} ${(100 - 100 * zoom) / (2 * zoom)})`}>
          <polyline points={polyline} fill="none" stroke="#003686" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" opacity="0.85" />
          {points.map((point, index) => {
            const isLast = index === points.length - 1;
            return (
              <g key={`${point.label}-${index}`}>
                <circle cx={point.x} cy={point.y} r={isLast ? 2.6 : 2.1} fill={isLast ? "#ffffff" : "#003686"} stroke={isLast ? "#6d5e00" : "#ffffff"} strokeWidth="0.8" />
                <text x={point.x} y={point.y - 4} textAnchor="middle" fill="#191b22" fontSize="2.8" fontFamily="Public Sans">
                  {index === 0 ? "Start" : isLast ? "Drop" : "Pickup"}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute bottom-6 right-6 bg-surface-container-lowest/90 backdrop-blur-md rounded-full ghost-border px-4 py-2 font-label text-xs text-on-surface-variant">
        Zoom {Math.round(zoom * 100)}%
      </div>
    </section>
  );
}

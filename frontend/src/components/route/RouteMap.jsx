import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";


const DEFAULT_STYLE = {
  version: 8,
  sources: {
    "osm-raster": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-raster",
      type: "raster",
      source: "osm-raster",
    },
  ],
};

const MAP_STYLE = import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_STYLE;
const ROUTE_API_BASE =
  import.meta.env.VITE_ROUTE_API_BASE ||
  "https://router.project-osrm.org/route/v1/driving";

function normalizeCoordinates(points) {
  if (!points?.length) return [];
  return points
    .map((point) => [Number(point.longitude), Number(point.latitude)])
    .filter((pair) => Number.isFinite(pair[0]) && Number.isFinite(pair[1]));
}

function createGeoJsonLine(coordinates) {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates,
    },
    properties: {},
  };
}

function createGeoJsonPoints(points) {
  return {
    type: "FeatureCollection",
    features: points.map((point, index) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [Number(point.longitude), Number(point.latitude)],
      },
      properties: {
        label: index === 0 ? "Start" : index === points.length - 1 ? "Drop" : "Pickup",
      },
    })),
  };
}

function boundsFromCoords(coords) {
  if (!coords.length) return null;
  const lons = coords.map((pair) => pair[0]);
  const lats = coords.map((pair) => pair[1]);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}


export default function RouteMap({ route, schedule }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeSourceId = "trip-route";
  const stopsSourceId = "trip-stops";
  const stopCount = schedule?.filter((segment) => segment.status !== "driving").length || 0;
  const points = route?.map_points || [];
  const coordinates = useMemo(() => normalizeCoordinates(points), [points]);
  const [routeState, setRouteState] = useState({ loading: false, error: "" });
  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const recenter = () => {
    const bounds = boundsFromCoords(coordinates);
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: 80, duration: 600 });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [-96.5, 38.5],
      zoom: 3,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coordinates.length) return;
    let cancelled = false;
    const run = async () => {
      setRouteState({ loading: true, error: "" });
      const coordinatePath = coordinates.map((pair) => pair.join(",")).join(";");
      try {
        const response = await fetch(
          `${ROUTE_API_BASE}/${coordinatePath}?overview=full&geometries=geojson`,
          { credentials: "omit" },
        );
        if (!response.ok) throw new Error("Unable to fetch route.");
        const data = await response.json();
        if (!data?.routes?.[0]?.geometry?.coordinates) {
          throw new Error("Route data unavailable.");
        }
        if (cancelled) return;

        const routeFeature = createGeoJsonLine(data.routes[0].geometry.coordinates);
        const stopFeature = createGeoJsonPoints(points);

        const ensureSources = () => {
          if (!map.getSource(routeSourceId)) {
            map.addSource(routeSourceId, { type: "geojson", data: routeFeature });
            map.addLayer({
              id: "route-line",
              type: "line",
              source: routeSourceId,
              paint: {
                "line-color": "#003686",
                "line-width": 4,
                "line-opacity": 0.85,
              },
            });
          } else {
            map.getSource(routeSourceId).setData(routeFeature);
          }

          if (!map.getSource(stopsSourceId)) {
            map.addSource(stopsSourceId, { type: "geojson", data: stopFeature });
            map.addLayer({
              id: "route-stops",
              type: "circle",
              source: stopsSourceId,
              paint: {
                "circle-radius": ["case", ["==", ["get", "label"], "Drop"], 6, 5],
                "circle-color": [
                  "case",
                  ["==", ["get", "label"], "Pickup"],
                  "#6d5e00",
                  ["==", ["get", "label"], "Drop"],
                  "#ffffff",
                  "#003686",
                ],
                "circle-stroke-color": "#6d5e00",
                "circle-stroke-width": 1.5,
              },
            });
          } else {
            map.getSource(stopsSourceId).setData(stopFeature);
          }
        };

        if (!map.isStyleLoaded()) {
          map.once("load", ensureSources);
        } else {
          ensureSources();
        }

        const bounds = boundsFromCoords(data.routes[0].geometry.coordinates);
        if (bounds) {
          map.fitBounds(bounds, { padding: 90, duration: 800 });
        }
        setRouteState({ loading: false, error: "" });
      } catch (error) {
        if (!cancelled) {
          setRouteState({
            loading: false,
            error: error.message || "Unable to load route.",
          });
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [ROUTE_API_BASE, coordinates, points]);

  return (
    <section className="flex-1 relative bg-surface-container-high min-h-[620px] md:min-h-0 overflow-hidden" data-testid="route-map">
      <div ref={mapContainerRef} className="absolute inset-0" />
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div className="bg-surface-container-lowest/90 backdrop-blur-md px-6 py-3 rounded-full ghost-border pointer-events-auto flex flex-wrap gap-6 items-center shadow-[0_8px_32px_rgb(var(--color-shadow)_/_0.3)]">
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
              className={`w-10 h-10 bg-surface-container-lowest/90 backdrop-blur-md rounded-full flex items-center justify-center ghost-border text-on-surface hover:bg-surface-container-lowest shadow-[0_8px_32px_rgb(var(--color-shadow)_/_0.3)] transition-colors ${index === 2 ? "mt-4" : ""}`}
              aria-label={label}
              onClick={action}
            >
              <span className="material-symbols-outlined">{icon}</span>
            </button>
          ))}
        </div>
      </div>
      {routeState.loading && (
        <div className="absolute bottom-6 right-6 bg-surface-container-lowest/90 backdrop-blur-md rounded-full ghost-border px-4 py-2 font-label text-xs text-on-surface-variant">
          Fetching route...
        </div>
      )}
      {routeState.error && (
        <div className="absolute bottom-6 right-6 bg-error-container text-on-error-container rounded-full ghost-border px-4 py-2 font-label text-xs">
          {routeState.error}
        </div>
      )}
    </section>
  );
}

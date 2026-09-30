import type { Cluster, DistrictGeometry } from "../../shared/domain";

type Props = {
  district: { name: string; state: string; lat: number; lon: number };
  geometry?: DistrictGeometry;
  clusters: Cluster[];
  caption: string;
  ariaLabel: string;
};

const width = 720;
const height = 410;
const padding = 42;

function rings(geometry?: DistrictGeometry) {
  if (!geometry) return [];
  return geometry.type === "Polygon"
    ? geometry.coordinates
    : geometry.coordinates.flat();
}

export function DistrictMap({
  district,
  geometry,
  clusters,
  caption,
  ariaLabel,
}: Props) {
  const boundaryRings = rings(geometry);
  const boundaryPoints = boundaryRings.flat();
  const mapPoints = boundaryPoints.length
    ? boundaryPoints
    : clusters.length
      ? clusters.map(
          (cluster) => [cluster.lon, cluster.lat] as [number, number],
        )
      : [[district.lon, district.lat]];
  const latitudes = mapPoints.map(([, latitude]) => latitude);
  const latitudeCenter = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const longitudeScale = Math.cos((latitudeCenter * Math.PI) / 180);
  const projectedPoints = mapPoints.map(([longitude, latitude]) => [
    longitude * longitudeScale,
    latitude,
  ]);
  const longitudes = projectedPoints.map(([longitude]) => longitude);
  const longitudeMin = longitudes.length
    ? Math.min(...longitudes)
    : (district.lon - 0.25) * longitudeScale;
  const longitudeMax = longitudes.length
    ? Math.max(...longitudes)
    : (district.lon + 0.25) * longitudeScale;
  const latitudeMin = latitudes.length
    ? Math.min(...latitudes)
    : district.lat - 0.2;
  const latitudeMax = latitudes.length
    ? Math.max(...latitudes)
    : district.lat + 0.2;
  const longitudeSpan = Math.max(
    longitudeMax - longitudeMin,
    0.08 * longitudeScale,
  );
  const latitudeSpan = Math.max(latitudeMax - latitudeMin, 0.08);
  const scale = Math.min(
    (width - 2 * padding) / longitudeSpan,
    (height - 2 * padding) / latitudeSpan,
  );
  const mapWidth = longitudeSpan * scale;
  const mapHeight = latitudeSpan * scale;
  const offsetX = (width - mapWidth) / 2;
  const offsetY = (height - mapHeight) / 2;
  const project = ([longitude, latitude]: [number, number]) => [
    offsetX + (longitude * longitudeScale - longitudeMin) * scale,
    height - offsetY - (latitude - latitudeMin) * scale,
  ];
  const path = boundaryRings
    .map(
      (ring) =>
        ring
          .map((point, index) => {
            const [x, y] = project(point);
            return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ") + " Z",
    )
    .join(" ");

  return (
    <div className="district-map" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <pattern
            id="geo-grid"
            width="72"
            height="72"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 72 0 L 0 0 0 72" fill="none" />
          </pattern>
        </defs>
        <rect className="geo-grid" width={width} height={height} />
        {path ? (
          <path className="district-boundary" d={path} fillRule="evenodd" />
        ) : (
          <rect
            className="district-boundary fallback-boundary"
            x="80"
            y="55"
            width="560"
            height="300"
            rx="90"
          />
        )}
        {clusters.map((cluster) => {
          const [x, y] = project([cluster.lon, cluster.lat]);
          return (
            <g
              className={`geo-marker ${cluster.status}`}
              key={cluster.id}
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
            >
              <title>{`${cluster.name}: ${cluster.count}`}</title>
              <circle className="marker-halo" r="25" />
              <circle className="marker-core" r="15" />
              <text textAnchor="middle" dominantBaseline="central">
                {cluster.count}
              </text>
            </g>
          );
        })}
        <g className="north-marker" transform="translate(675 45)">
          <path d="M0 15 L8 -8 L16 15 L8 10 Z" />
          <text x="8" y="30" textAnchor="middle">
            N
          </text>
        </g>
      </svg>
      <div className="map-label">
        {district.name}
        <small>{district.state}</small>
      </div>
      <span className="map-caption">{caption}</span>
    </div>
  );
}

// Haversine distance in metres between two lat/lng points
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6_371_000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fmtDistance(m) {
  if (m == null || isNaN(m)) return '--';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function fmtTime(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const TASK_META = {
  physical:  { label: 'Physical',  tag: 'PHY', color: 'bg-red-500/10    text-red-400    border border-red-500/40'    },
  cognitive: { label: 'Cognitive', tag: 'COG', color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/40' },
  social:    { label: 'Social',    tag: 'SOC', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/40' },
  creative:  { label: 'Creative',  tag: 'CRE', color: 'bg-pink-500/10   text-pink-400   border border-pink-500/40'   },
};

export const DIFF_META = {
  easy:   { label: 'Easy',   color: 'text-emerald-400 bg-emerald-500/10', stars: 1 },
  medium: { label: 'Medium', color: 'text-amber-400   bg-amber-500/10',   stars: 2 },
  hard:   { label: 'Hard',   color: 'text-red-400     bg-red-500/10',     stars: 3 },
};

export const MARKER_COLOR = {
  physical:  '#ef4444',
  cognitive: '#6366f1',
  social:    '#eab308',
  creative:  '#ec4899',
};

export const UNLOCK_DISTANCE = 20; // metres

import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MARKER_COLOR } from '../utils.js';

const TYPE_OPTIONS = ['physical', 'cognitive', 'social', 'creative'];
const DIFF_OPTIONS = ['easy', 'medium', 'hard'];
const TYPE_LABELS  = { physical: 'Physical', cognitive: 'Cognitive', social: 'Social', creative: 'Creative' };

function createCpIcon(orderNum, taskType, selected = false) {
  const color = selected ? '#00e5ff' : (MARKER_COLOR[taskType] || '#64748b');
  return L.divIcon({
    className: '',
    iconSize: [36, 44], iconAnchor: [18, 44],
    html: `<div style="position:relative;width:36px;height:44px;">
      <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg"
           style="width:100%;height:100%;filter:drop-shadow(0 0 5px ${color}aa)">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z"
          fill="${color}" stroke="#fff" stroke-width="${selected ? 2.5 : 1.5}"/>
        <text x="18" y="22" text-anchor="middle" font-size="12" font-weight="bold"
          font-family="Orbitron,Arial,sans-serif" fill="#fff">${orderNum}</text>
      </svg></div>`,
  });
}

function FlyController({ target }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (target && target !== prev.current) {
      prev.current = target;
      map.flyTo([target.lat, target.lng], 17, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

// flyTo: { lat, lng, _key } — _key changes each time to force re-fly
export default function MapPicker({ checkpoints, onAdd, flyTo }) {
  const [pending, setPending]       = useState(null);
  const [taskType, setTaskType]     = useState('physical');
  const [difficulty, setDifficulty] = useState('medium');
  const [label, setLabel]           = useState('');
  const [adding, setAdding]         = useState(false);
  const [flyTarget, setFlyTarget]   = useState(null);

  // Fly map to teacher's GPS location (no popup — they click to place)
  useEffect(() => {
    if (!flyTo) return;
    setFlyTarget({ lat: flyTo.lat, lng: flyTo.lng });
  }, [flyTo?._key]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = useCallback((latlng) => {
    setPending(latlng);
    setLabel('');
  }, []);

  async function handleAdd() {
    if (!pending) return;
    setAdding(true);
    try {
      await onAdd({
        lat: pending.lat,
        lng: pending.lng,
        task_type: taskType,
        difficulty,
        label: label.trim() || undefined,
        order_num: checkpoints.length + 1,
      });
      setPending(null);
      setLabel('');
    } finally { setAdding(false); }
  }

  const pathCoords = [...checkpoints]
    .sort((a, b) => a.order_num - b.order_num)
    .map(cp => [cp.lat, cp.lng]);

  const centre = checkpoints.length > 0
    ? [checkpoints[0].lat, checkpoints[0].lng]
    : [51.505, -0.09];

  return (
    <div className="relative h-full w-full">
      <MapContainer center={centre} zoom={15} style={{ height: '100%', width: '100%' }} className="cursor-crosshair">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <ClickHandler onMapClick={handleMapClick} />
        <FlyController target={flyTarget} />

        {pathCoords.length > 1 && (
          <Polyline
            positions={pathCoords}
            pathOptions={{ color: '#00e5ff', weight: 2.5, dashArray: '8 6', opacity: 0.7 }}
          />
        )}
        {checkpoints.map(cp => (
          <Marker key={cp.id} position={[cp.lat, cp.lng]} icon={createCpIcon(cp.order_num, cp.task_type)} />
        ))}
        {pending && (
          <Marker
            position={[pending.lat, pending.lng]}
            icon={createCpIcon(checkpoints.length + 1, taskType, true)}
            opacity={0.9}
          />
        )}
      </MapContainer>

      {/* Tip when empty */}
      {!pending && checkpoints.length === 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0c0c1e]/90 border border-[#1a1a40]
                        rounded-xl px-4 py-2 text-xs text-[#4a5580] font-mono pointer-events-none z-10 whitespace-nowrap">
          Search in the panel, or click anywhere on the map
        </div>
      )}

      {/* Add checkpoint popup */}
      {pending && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-80 max-w-[calc(100vw-16px)]
                        bg-[#0c0c1e] border border-[#00e5ff] rounded-2xl p-4"
             style={{ boxShadow: '0 0 20px rgba(0,229,255,0.25)' }}>
          <div className="text-xs font-mono text-[#00e5ff] uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Checkpoint #{checkpoints.length + 1}</span>
            <span className="text-[#4a5580] text-[10px]">{pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}</span>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder={`Checkpoint ${checkpoints.length + 1}`}
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-[#06060f] border border-[#1a1a40] rounded-lg px-3 py-2 text-sm
                         text-[#c8d6f0] placeholder-[#4a5580] focus:outline-none focus:border-[#00e5ff] font-mono"
            />
            <div className="flex gap-2">
              <select value={taskType} onChange={e => setTaskType(e.target.value)}
                className="flex-1 bg-[#06060f] border border-[#1a1a40] text-[#c8d6f0] rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#00e5ff]">
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                className="w-28 bg-[#06060f] border border-[#1a1a40] text-[#c8d6f0] rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[#00e5ff]">
                {DIFF_OPTIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setPending(null); setLabel(''); }}
                className="flex-1 border border-[#1a1a40] text-[#4a5580] rounded-lg py-2 text-xs hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors font-mono">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={adding}
                className="flex-1 bg-[#00e5ff] text-[#06060f] font-bold rounded-lg py-2 text-xs hover:opacity-90 disabled:opacity-50 transition-opacity font-mono uppercase tracking-wide">
                {adding ? 'Adding...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

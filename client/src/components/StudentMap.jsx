import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MARKER_COLOR, UNLOCK_DISTANCE } from '../utils.js';

const userIcon = L.divIcon({
  className: '',
  iconSize: [20, 20], iconAnchor: [10, 10],
  html: `<div class="user-dot"></div>`,
});

function createCpIcon(orderNum, taskType, status) {
  const color =
    status === 'completed' ? '#00ff85' :
    status === 'current'   ? (MARKER_COLOR[taskType] || '#00e5ff') :
    '#94a3b8';

  const glow = status === 'future'
    ? 'none'
    : `drop-shadow(0 0 5px ${color}99)`;

  const opacity = status === 'future' ? 0.45 : 1;

  return L.divIcon({
    className: '',
    iconSize: [36, 44], iconAnchor: [18, 44],
    html: `<div style="opacity:${opacity};width:36px;height:44px;">
      <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg"
           style="width:100%;height:100%;filter:${glow}">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z"
          fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <text x="18" y="22" text-anchor="middle" font-size="12" font-weight="bold"
          font-family="Orbitron,Arial,sans-serif" fill="#fff">
          ${status === 'completed' ? 'OK' : orderNum}
        </text>
      </svg></div>`,
  });
}

function AutoCenter({ userPos, currentCp }) {
  const map  = useMap();
  const prev = useRef(null);

  useEffect(() => {
    const key = userPos
      ? `${userPos.lat.toFixed(4)},${userPos.lng.toFixed(4)}`
      : String(currentCp?.id);

    if (key !== prev.current) {
      prev.current = key;
      if (userPos) {
        map.setView([userPos.lat, userPos.lng], map.getZoom(), { animate: true });
      } else if (currentCp) {
        map.setView([currentCp.lat, currentCp.lng], 16, { animate: true });
      }
    }
  });

  return null;
}

export default function StudentMap({ userPos, checkpoints, currentCp }) {
  const centre = userPos
    ? [userPos.lat, userPos.lng]
    : currentCp ? [currentCp.lat, currentCp.lng] : [40.7851, -73.9683];

  const cpIndex = checkpoints.findIndex(cp => cp.id === currentCp?.id);

  function getStatus(cp, i) {
    if (i < cpIndex) return 'completed';
    if (cp.id === currentCp?.id) return 'current';
    return 'future';
  }

  return (
    <MapContainer center={centre} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      {/* Voyager — clean, readable labels, great outdoors */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      <AutoCenter userPos={userPos} currentCp={currentCp} />

      {/* User location */}
      {userPos && (
        <>
          <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
          <Circle
            center={[userPos.lat, userPos.lng]}
            radius={UNLOCK_DISTANCE}
            pathOptions={{ color: '#00e5ff', fillColor: '#00e5ff', fillOpacity: 0.05, weight: 1, dashArray: '4 4' }}
          />
        </>
      )}

      {/* Checkpoints */}
      {checkpoints.map((cp, i) => (
        <Marker
          key={cp.id}
          position={[cp.lat, cp.lng]}
          icon={createCpIcon(cp.order_num, cp.task_type, getStatus(cp, i))}
        />
      ))}

      {/* Unlock radius around current target */}
      {currentCp && (
        <Circle
          center={[currentCp.lat, currentCp.lng]}
          radius={UNLOCK_DISTANCE}
          pathOptions={{ color: '#00ff85', fillColor: '#00ff85', fillOpacity: 0.08, weight: 1.5, dashArray: '6 4' }}
        />
      )}
    </MapContainer>
  );
}

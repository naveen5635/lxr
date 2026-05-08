import { useRef, useEffect, useState } from 'react';
import { fmtDistance } from '../utils.js';

function calcBearing(from, to) {
  const toRad = d => d * Math.PI / 180;
  const lat1 = toRad(from.lat), lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export default function ARView({ userPos, currentCp, distance, canUnlock, onUnlock, onClose, taskLoading }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const animRef    = useRef(null);
  const headingRef = useRef(null); // use ref not state to avoid re-render in draw loop

  const [cameraError,  setCameraError]  = useState('');
  const [hasCompass,   setHasCompass]   = useState(false);
  const [iosNeedsPerm, setIosNeedsPerm] = useState(
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  );

  // ── Camera ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError('Camera access denied. Please allow camera in browser settings.');
      }
    }
    start();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Compass ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function onOrientation(e) {
      let h = null;
      if (e.webkitCompassHeading != null) {
        h = e.webkitCompassHeading; // iOS — already absolute north
      } else if (e.alpha != null) {
        h = (360 - e.alpha + 360) % 360; // Android
      }
      if (h !== null) { headingRef.current = h; setHasCompass(true); }
    }

    if (!iosNeedsPerm) {
      window.addEventListener('deviceorientationabsolute', onOrientation, true);
      window.addEventListener('deviceorientation', onOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation, true);
      window.removeEventListener('deviceorientation', onOrientation, true);
    };
  }, [iosNeedsPerm]);

  async function requestIosCompass() {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm === 'granted') {
        setIosNeedsPerm(false);
        function onOrientation(e) {
          if (e.webkitCompassHeading != null) { headingRef.current = e.webkitCompassHeading; setHasCompass(true); }
        }
        window.addEventListener('deviceorientation', onOrientation, true);
      }
    } catch { /* denied */ }
  }

  // ── Canvas draw loop ──────────────────────────────────────────────────────
  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(draw); return; }

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w)  canvas.width  = w;
      if (canvas.height !== h) canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.42; // slightly above center
      const size = Math.min(w, h) * 0.2;

      const tgtBearing = (userPos && currentCp) ? calcBearing(userPos, currentCp) : null;
      const heading    = headingRef.current;
      const relAngle   = (tgtBearing !== null && heading !== null)
        ? (tgtBearing - heading + 360) % 360
        : null;

      const neonColor = canUnlock ? '#00ff85' : '#00e5ff';
      const neonRgb   = canUnlock ? '0,255,133' : '0,229,255';

      if (relAngle !== null) {
        // ── Directional arrow ──────────────────────────────────────────
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(relAngle * Math.PI / 180);

        // outer glow ring
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.1, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(${neonRgb},0.15)`;
        ctx.lineWidth = size * 0.35;
        ctx.stroke();

        // arrow
        ctx.shadowColor  = neonColor;
        ctx.shadowBlur   = 28;
        ctx.fillStyle    = `rgba(${neonRgb},0.92)`;
        ctx.strokeStyle  = neonColor;
        ctx.lineWidth    = 2;
        ctx.beginPath();
        ctx.moveTo(0, -size);                    // tip
        ctx.lineTo(size * 0.42, size * 0.35);    // bottom-right
        ctx.lineTo(0, size * 0.05);              // inner notch
        ctx.lineTo(-size * 0.42, size * 0.35);   // bottom-left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      } else {
        // ── No compass — pulsing ring ────────────────────────────────────
        const t    = Date.now() / 800;
        const pulseScale = 1 + Math.sin(t) * 0.12;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur  = 20;
        ctx.strokeStyle = 'rgba(0,229,255,0.7)';
        ctx.lineWidth   = 3;
        ctx.setLineDash([14, 9]);
        ctx.beginPath();
        ctx.arc(0, 0, size * pulseScale, 0, 2 * Math.PI);
        ctx.stroke();

        // question mark hint
        ctx.setLineDash([]);
        ctx.font      = `bold ${Math.round(size * 0.7)}px monospace`;
        ctx.fillStyle = 'rgba(0,229,255,0.6)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);
        ctx.restore();
      }

      // ── Distance bubble ────────────────────────────────────────────────
      if (distance != null) {
        const label = fmtDistance(distance);
        const fSize = Math.round(w * 0.065);
        ctx.font = `900 ${fSize}px Orbitron, monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        const tw  = ctx.measureText(label).width;
        const bx  = cx - tw / 2 - 18;
        const by  = cy + size * 1.55;
        const bw  = tw + 36;
        const bh  = fSize + 18;

        // pill background
        ctx.fillStyle = 'rgba(6,6,15,0.72)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bx, by, bw, bh, 12);
        } else {
          ctx.rect(bx, by, bw, bh);
        }
        ctx.fill();

        ctx.fillStyle   = neonColor;
        ctx.shadowColor = neonColor;
        ctx.shadowBlur  = 16;
        ctx.fillText(label, cx, by + bh - 9);
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos, currentCp, distance, canUnlock]);

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">

      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* AR canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 px-4 py-4 flex items-start justify-between"
           style={{ background: 'linear-gradient(to bottom, rgba(6,6,15,0.75) 0%, transparent 100%)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-orbitron font-black text-cyber-cyan text-xs tracking-widest">AR MODE</span>
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          </div>
          {currentCp && (
            <div className="font-orbitron text-white text-sm font-bold">{currentCp.label}</div>
          )}
          {!hasCompass && !iosNeedsPerm && (
            <div className="text-cyber-yellow text-xs font-mono-cyber mt-1">No compass — direction unavailable</div>
          )}
        </div>
        <button onClick={onClose}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-bold"
          style={{ background: 'rgba(6,6,15,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}>
          ×
        </button>
      </div>

      {/* Camera error overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyber-bg/95 p-8 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-cyber-pink mb-4">
            <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <p className="text-cyber-pink font-mono-cyber text-sm mb-6">{cameraError}</p>
          <button onClick={onClose} className="cyber-btn-cyan px-8 h-12 font-orbitron text-sm tracking-widest">
            Go Back
          </button>
        </div>
      )}

      {/* iOS compass permission */}
      {iosNeedsPerm && !cameraError && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-cyber-card/95 border border-cyber-border rounded-2xl p-6 text-center">
          <p className="text-cyber-text text-sm font-mono-cyber mb-4">
            Allow device orientation access so the AR arrow can point toward the checkpoint.
          </p>
          <button onClick={requestIosCompass}
            className="cyber-btn-cyan w-full h-12 font-orbitron text-sm tracking-widest uppercase">
            Enable Compass
          </button>
        </div>
      )}

      {/* In-range target ring (HTML layer) */}
      {canUnlock && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 rounded-full border-4 border-cyber-green animate-pulse"
               style={{ boxShadow: '0 0 40px rgba(0,255,133,0.4), inset 0 0 40px rgba(0,255,133,0.1)' }} />
        </div>
      )}

      {/* Bottom action bar */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-6"
           style={{ background: 'linear-gradient(to top, rgba(6,6,15,0.85) 0%, transparent 100%)' }}>
        {canUnlock ? (
          <button
            onClick={onUnlock}
            disabled={taskLoading}
            className="w-full h-16 font-orbitron font-black tracking-widest uppercase rounded-2xl text-lg disabled:opacity-60"
            style={{ background: 'rgba(0,255,133,0.15)', border: '2px solid #00ff85', color: '#00ff85', boxShadow: '0 0 24px rgba(0,255,133,0.35)' }}
          >
            {taskLoading ? 'Loading objective...' : 'Unlock Objective'}
          </button>
        ) : (
          <p className="text-center text-white/50 text-sm font-mono-cyber">
            {userPos ? 'Walk toward the checkpoint' : 'Waiting for GPS signal...'}
          </p>
        )}
      </div>
    </div>
  );
}

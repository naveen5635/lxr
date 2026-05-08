import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRDisplay({ joinCode }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-3">Mission Code</p>
        <div className="flex items-center gap-3">
          <span className="font-mono-cyber text-5xl tracking-[0.3em] neon-text-cyan">{joinCode}</span>
          <button
            onClick={copyCode}
            className="cyber-btn-cyan px-3 py-2 rounded-lg text-sm"
            title="Copy code"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {copied && <p className="text-xs neon-text-green font-mono-cyber mt-1">Copied to clipboard</p>}
      </div>

      <div className="p-4 bg-white rounded-2xl" style={{ boxShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
        <QRCodeSVG value={joinCode} size={180} bgColor="#ffffff" fgColor="#06060f" level="M" includeMargin={false} />
      </div>

      <div className="text-center font-mono-cyber text-xs text-cyber-muted space-y-1">
        <p>Students open the app, tap <span className="text-cyber-pink font-bold">Operative</span></p>
        <p>then enter the mission code above</p>
      </div>
    </div>
  );
}

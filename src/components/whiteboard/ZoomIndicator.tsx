/* ── Zoom indicator (bottom-right) ────────────────────────────────── */

interface ZoomIndicatorProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  presentMode: boolean;
}

export function ZoomIndicator({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  presentMode,
}: ZoomIndicatorProps) {
  if (presentMode) return null;

  const pct = Math.round(scale * 100);

  return (
    <div className="wb-zoom">
      <button className="wb-zoom-btn" onClick={onZoomOut} title="Zoom out">
        −
      </button>
      <button className="wb-zoom-pct" onClick={onReset} title="Reset to 100%">
        {pct}%
      </button>
      <button className="wb-zoom-btn" onClick={onZoomIn} title="Zoom in">
        +
      </button>
    </div>
  );
}

/* ── Context menu (right-click) ───────────────────────────────────── */

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  hasSelection: boolean;
  hasGroup: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onBringToFront,
  onSendToBack,
  onGroup,
  onUngroup,
  onDuplicate,
  onDelete,
  hasSelection,
  hasGroup,
}: ContextMenuProps) {
  if (!hasSelection) return null;

  return (
    <>
      <div className="wb-ctx-overlay" onClick={onClose} />
      <div className="wb-ctx-menu" style={{ left: x, top: y }}>
        <button className="wb-ctx-item" onClick={() => { onBringToFront(); onClose(); }}>
          ↑ Bring to Front
        </button>
        <button className="wb-ctx-item" onClick={() => { onSendToBack(); onClose(); }}>
          ↓ Send to Back
        </button>
        <div className="wb-ctx-divider" />
        <button className="wb-ctx-item" onClick={() => { onGroup(); onClose(); }}>
          ▣ Group
        </button>
        {hasGroup && (
          <button className="wb-ctx-item" onClick={() => { onUngroup(); onClose(); }}>
            ▢ Ungroup
          </button>
        )}
        <div className="wb-ctx-divider" />
        <button className="wb-ctx-item" onClick={() => { onDuplicate(); onClose(); }}>
          ⊕ Duplicate
        </button>
        <button className="wb-ctx-item wb-ctx-delete" onClick={() => { onDelete(); onClose(); }}>
          ✕ Delete
        </button>
      </div>
    </>
  );
}

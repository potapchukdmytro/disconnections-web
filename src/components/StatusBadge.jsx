import './StatusBadge.css';

export default function StatusBadge({ color = '#3498db', label }) {
  return (
    <span
      className="status-badge"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
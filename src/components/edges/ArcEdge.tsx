import { BaseEdge, EdgeProps } from "@xyflow/react";

// ArcEdge: draws a clockwise circular-like dashed arc between nodes placed on a circle
// It uses circle tangents at the endpoints to ensure consistent clockwise flow.
export default function ArcEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const cx = (data as any)?.centerX ?? (sourceX + targetX) / 2;
  const cy = (data as any)?.centerY ?? (sourceY + targetY) / 2;

  // Get vectors from center to endpoints
  const rsx = sourceX - cx;
  const rsy = sourceY - cy;
  const rtx = targetX - cx;
  const rty = targetY - cy;

  const rsl = Math.hypot(rsx, rsy) || 1;
  const rtl = Math.hypot(rtx, rty) || 1;

  // Normalize
  const rsnx = rsx / rsl;
  const rsny = rsy / rsl;
  const rtnx = rtx / rtl;
  const rtny = rty / rtl;

  // For screen coordinates (y down), rotate CCW to move clockwise along the circle
  // CCW rotation of (x, y) -> (-y, x)
  const tsx = -rsny; // source tangent x
  const tsy = rsnx;  // source tangent y
  const ttx = -rtny; // target tangent x
  const tty = rtnx;  // target tangent y

  // Use a k factor suitable for ~60° circular arc; adjustable via data.k or data.curvature
  const k = (typeof (data as any)?.k === 'number'
    ? (data as any).k
    : typeof (data as any)?.curvature === 'number'
      ? (data as any).curvature
      : 0.4);

  const c1x = sourceX + tsx * k * rsl;
  const c1y = sourceY + tsy * k * rsl;
  const c2x = targetX - ttx * k * rtl; // approach target along its clockwise tangent
  const c2y = targetY - tty * k * rtl;

  const path = `M ${sourceX} ${sourceY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${targetX} ${targetY}`;

  return (
    <BaseEdge
      path={path}
      markerEnd={markerEnd}
      style={{ strokeDasharray: '8 4', ...style }}
    />
  );
}

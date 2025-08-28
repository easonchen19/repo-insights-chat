import { BaseEdge, EdgeProps } from "@xyflow/react";

// A curved edge that bows away from the provided center point to keep the flow clockwise
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
  const curvature = typeof (data as any)?.curvature === "number" ? (data as any).curvature : 0.6;

  // Midpoint between source and target
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;

  // Vector from center to midpoint (points outward from the circle center)
  let vx = mx - cx;
  let vy = my - cy;
  const vlen = Math.hypot(vx, vy) || 1;
  vx /= vlen;
  vy /= vlen;

  // Offset control points along this outward vector
  const segLen = Math.hypot(targetX - sourceX, targetY - sourceY);
  const offset = segLen * curvature;

  const c1x = sourceX + vx * offset;
  const c1y = sourceY + vy * offset;
  const c2x = targetX + vx * offset;
  const c2y = targetY + vy * offset;

  const path = `M ${sourceX} ${sourceY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${targetX} ${targetY}`;

  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}

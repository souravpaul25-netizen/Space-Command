import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { LUNAR_CRATERS, ROVER_WAYPOINTS } from '../../simulation/config';
import type { RoverState, RouteRiskProfile } from '../../simulation/types';

interface LunarTerrainCanvasProps {
  rover: RoverState;
  selectedWaypointId: string;
  routeProfile: RouteRiskProfile;
  onSelectWaypoint: (id: string) => void;
}

const MAP_RANGE_KM = 10; // -10km to +10km

export function LunarTerrainCanvas({
  rover,
  selectedWaypointId,
  routeProfile,
  onSelectWaypoint,
}: LunarTerrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [canvasRevision, setCanvasRevision] = useState(0);

  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originPanX: 0,
    originPanY: 0,
  });

  const kmToPx = (km: number, size: number) => ((km + MAP_RANGE_KM) / (MAP_RANGE_KM * 2)) * size;
  const pxToKm = (px: number, size: number, panAxis: number) => {
    const worldPx = (px - size / 2 - panAxis) / zoom + size / 2;
    return (worldPx / size) * (MAP_RANGE_KM * 2) - MAP_RANGE_KM;
  };

  // Trigger clean redraw on viewport rotation / resize
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setCanvasRevision((r) => r + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. Deep Lunar Regolith Terrain Base
    ctx.fillStyle = '#090E1A';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // Subtle elevation contour rings
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1 / zoom;
    for (let r = 1; r <= 5; r++) {
      ctx.beginPath();
      ctx.ellipse(
        width * 0.52,
        height * 0.48,
        (r / 5) * width * 0.48,
        (r / 5) * height * 0.44,
        0.2,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // 2. Coordinate Grid (2 km intervals)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
    ctx.lineWidth = 1 / zoom;
    for (let km = -8; km <= 8; km += 2) {
      const gx = kmToPx(km, width);
      const gy = kmToPx(km, height);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    // 3. Communications Range Ring around Base (0,0)
    const baseX = kmToPx(0, width);
    const baseY = kmToPx(0, height);
    const commRadiusPx = (rover.commRangeKm / (MAP_RANGE_KM * 2)) * Math.min(width, height);
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.beginPath();
    ctx.arc(baseX, baseY, commRadiusPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4. Crater Obstacles & Permanently Shadowed Regions (PSR)
    for (const crater of LUNAR_CRATERS) {
      const cx = kmToPx(crater.x, width);
      const cy = kmToPx(crater.y, height);
      const cr = (crater.radiusKm / (MAP_RANGE_KM * 2)) * Math.min(width, height);

      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = crater.permanentlyShadowed ? '#04070E' : '#111827';
      ctx.fill();
      ctx.strokeStyle = crater.permanentlyShadowed
        ? 'rgba(56, 189, 248, 0.35)'
        : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = `${Math.max(8, 10 / Math.sqrt(zoom))}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(crater.permanentlyShadowed ? 'PSR CRATER' : 'CRATER', cx, cy + 3);
    }

    // 5. Planned Route Preview
    const targetWp = ROVER_WAYPOINTS.find((w) => w.id === selectedWaypointId);
    if (targetWp) {
      const tx = kmToPx(targetWp.x, width);
      const ty = kmToPx(targetWp.y, height);
      ctx.save();
      if (routeProfile === 'direct') {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      } else {
        const midX = (baseX + tx) / 2 + (ty - baseY) * 0.24;
        const midY = (baseY + ty) / 2 - (tx - baseX) * 0.24;
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([4 / zoom, 3 / zoom]);
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(midX, midY, tx, ty);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Exploration Waypoints
    const compactText = width < 380;
    const markerScale = 1 / Math.sqrt(zoom);
    for (const wp of ROVER_WAYPOINTS) {
      const wx = kmToPx(wp.x, width);
      const wy = kmToPx(wp.y, height);
      const isSelected = wp.id === selectedWaypointId;
      const isVisited = rover.visitedWaypointIds.includes(wp.id);

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(wx, wy, 12 * markerScale, 0, Math.PI * 2);
        ctx.strokeStyle = '#22D3EE';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(wx, wy, (compactText ? 7.5 : 6.5) * markerScale, 0, Math.PI * 2);
      ctx.fillStyle = isVisited
        ? '#10B981'
        : wp.hasPotentialWaterIce
        ? '#38BDF8'
        : '#CBD5E1';
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#67E8F9' : '#CBD5E1';
      ctx.font = `500 ${Math.max(8.5, (compactText ? 9.5 : 11) * markerScale)}px "DM Sans", sans-serif`;
      ctx.textAlign = wp.x > 4 ? 'right' : 'left';
      const labelOffsetX = wp.x > 4 ? -10 * markerScale : 10 * markerScale;
      ctx.fillText(wp.name, wx + labelOffsetX, wy + 4 * markerScale);
    }

    // 7. Habitat Base at (0,0)
    ctx.fillStyle = '#06B6D4';
    ctx.strokeStyle = '#ECFEFF';
    ctx.lineWidth = 1.5 / zoom;
    ctx.beginPath();
    ctx.rect(
      baseX - 7 * markerScale,
      baseY - 7 * markerScale,
      14 * markerScale,
      14 * markerScale
    );
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E2E8F0';
    ctx.font = `600 ${Math.max(8.5, (compactText ? 9.5 : 11) * markerScale)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('OUTPOST BASE', baseX, baseY - 12 * markerScale);

    // 8. Live Rover Position
    const rx = kmToPx(rover.x, width);
    const ry = kmToPx(rover.y, height);
    ctx.beginPath();
    ctx.arc(rx, ry, 7 * markerScale, 0, Math.PI * 2);
    ctx.fillStyle = rover.status === 'stranded' ? '#EF4444' : '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    ctx.fillStyle = '#FDE68A';
    ctx.font = `600 ${Math.max(8, 10 * markerScale)}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('ROVER', rx + 10 * markerScale, ry - 6 * markerScale);

    ctx.restore();
  }, [rover, selectedWaypointId, routeProfile, zoom, pan]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, canvasRevision]);

  const selectNearestWaypoint = (clientX: number, clientY: number, isTouch: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const clickKmX = pxToKm(cx, rect.width, pan.x);
    const clickKmY = pxToKm(cy, rect.height, pan.y);

    let closestId: string | null = null;
    let minDist = (isTouch ? 2.2 : 1.5) / zoom;
    for (const wp of ROVER_WAYPOINTS) {
      const dist = Math.hypot(wp.x - clickKmX, wp.y - clickKmY);
      if (dist < minDist) {
        minDist = dist;
        closestId = wp.id;
      }
    }
    if (closestId) {
      onSelectWaypoint(closestId);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originPanX: pan.x,
      originPanY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (dragRef.current.active && zoom > 1) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) > 5) {
        dragRef.current.moved = true;
        const maxPanX = (rect.width * (zoom - 1)) / 2;
        const maxPanY = (rect.height * (zoom - 1)) / 2;
        setPan({
          x: Math.max(-maxPanX, Math.min(maxPanX, dragRef.current.originPanX + dx)),
          y: Math.max(-maxPanY, Math.min(maxPanY, dragRef.current.originPanY + dy)),
        });
      }
    }

    const x = Number(pxToKm(e.clientX - rect.left, rect.width, pan.x).toFixed(1));
    const y = Number(pxToKm(e.clientY - rect.top, rect.height, pan.y).toFixed(1));
    setHoverCoords({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    if (!wasMoved) {
      selectNearestWaypoint(e.clientX, e.clientY, e.pointerType === 'touch');
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(1, Math.min(2.5, Number((prev + delta).toFixed(2))));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative rounded-lg sm:rounded-md border border-slate-800 bg-[#070B14] overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
        onPointerLeave={() => {
          dragRef.current.active = false;
          setHoverCoords(null);
        }}
        className={`w-full h-[265px] sm:h-[340px] landscape:h-[235px] sm:landscape:h-[275px] lg:h-[420px] lg:landscape:h-[420px] block select-none ${
          zoom > 1 ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-crosshair'
        }`}
      />

      {/* Coordinate HUD (Non-blocking corner pill) */}
      <div className="absolute top-2 left-2 px-2 py-1 rounded border border-slate-800 bg-[#0A0F1D]/90 text-[10px] sm:text-[11px] font-mono tabular-nums text-slate-300 pointer-events-none">
        {hoverCoords
          ? `X:${hoverCoords.x >= 0 ? '+' : ''}${hoverCoords.x} Y:${hoverCoords.y >= 0 ? '+' : ''}${hoverCoords.y} km`
          : `Rover (${rover.x.toFixed(1)}, ${rover.y.toFixed(1)}) km`}
      </div>

      {/* Zoom & Reset View Controls (Compact corner toolbar) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0A0F1D]/90 p-0.5 sm:p-1">
        <button
          type="button"
          onClick={() => handleZoom(0.5)}
          disabled={zoom >= 2.5}
          aria-label="Zoom in terrain map"
          className="min-w-[38px] min-h-[38px] sm:min-w-[30px] sm:min-h-[30px] inline-flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-40 cursor-pointer"
        >
          <ZoomIn className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.5)}
          disabled={zoom <= 1}
          aria-label="Zoom out terrain map"
          className="min-w-[38px] min-h-[38px] sm:min-w-[30px] sm:min-h-[30px] inline-flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-40 cursor-pointer"
        >
          <ZoomOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
        {zoom > 1 && (
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset terrain map zoom"
            className="min-w-[38px] min-h-[38px] sm:min-w-[30px] sm:min-h-[30px] inline-flex items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-cyan-300 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="px-2.5 sm:px-4 py-2 border-t border-slate-800 bg-[#0B1120] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-cyan-400 inline-block" /> Base
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 inline-block" /> Rover
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-sky-400 inline-block" /> Ice
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 inline-block" /> Surveyed
        </span>
        <span className="ml-auto font-mono text-[10px] sm:text-[11px] text-slate-500">
          {zoom > 1 ? `${zoom}x · Drag pan` : 'Tap marker'}
        </span>
      </div>
    </div>
  );
}

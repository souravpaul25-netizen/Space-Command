import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ConfirmActionModal } from '../../components/ConfirmActionModal';
import { InfoTooltip } from '../../components/InfoTooltip';
import { StatusIndicator } from '../../components/StatusIndicator';
import { TelemetryMetric } from '../../components/TelemetryMetric';
import type { HandbookSectionId } from '../../data/handbookContent';
import { ROVER_WAYPOINTS, SCIENTIFIC_ASSUMPTIONS } from '../../simulation/config';
import {
  calculateRoverMissionPlan,
  segmentIntersectsCrater,
} from '../../simulation/resources';
import type { RouteRiskProfile, SimulationState } from '../../simulation/types';
import { LunarTerrainCanvas } from './LunarTerrainCanvas';

interface RoverModuleProps {
  state: SimulationState;
  onDispatch: (waypointId: string, route: RouteRiskProfile) => void;
  onCollectSample: () => void;
  onReturnToBase: () => void;
  onToggleCharging: () => void;
  onRepairMobility: () => void;
  onOpenHandbook?: (section: HandbookSectionId) => void;
}

export function RoverModule({
  state,
  onDispatch,
  onCollectSample,
  onReturnToBase,
  onToggleCharging,
  onRepairMobility,
  onOpenHandbook,
}: RoverModuleProps) {
  const [selectedWpId, setSelectedWpId] = useState<string>(
    state.rover.targetWaypointId ?? ROVER_WAYPOINTS[0].id
  );
  const [routeProfile, setRouteProfile] = useState<RouteRiskProfile>('safe');
  const [showLogMobile, setShowLogMobile] = useState(false);
  const [confirmAbortOpen, setConfirmAbortOpen] = useState(false);

  const rover = state.rover;
  const selectedWp =
    ROVER_WAYPOINTS.find((w) => w.id === selectedWpId) ?? ROVER_WAYPOINTS[0];
  const plan = calculateRoverMissionPlan(selectedWp.id, routeProfile, 0, 0);
  const cratersOnDirect = segmentIntersectsCrater(0, 0, selectedWp.x, selectedWp.y);

  const distFromBaseKm = Math.hypot(rover.x, rover.y);
  const inCommRange = distFromBaseKm <= rover.commRangeKm;
  const hasReturnReserve =
    plan !== null && rover.batteryKwh >= plan.estimatedTotalRoundTripKwh * 0.92;

  const roverLevel =
    rover.status === 'stranded'
      ? 'critical'
      : rover.mobilityHealthPct < 60 || rover.batteryKwh < 10
      ? 'warning'
      : 'nominal';

  const roverBattPct = (rover.batteryKwh / Math.max(1, rover.batteryMaxKwh)) * 100;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-slate-100">
            05. Lunar Rover & Exploration
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 max-w-2xl">
            Plan traverses across lunar craters, manage return battery margins, collect core
            samples, and map water-ice prospects.
          </p>
        </div>
        <StatusIndicator
          level={roverLevel}
          label={
            rover.status === 'docked'
              ? 'Docked at Base'
              : rover.status === 'en-route-outbound'
              ? `Outbound (${rover.legProgressHours}/${rover.legTotalHours}h)`
              : rover.status === 'exploring'
              ? 'Exploring Site'
              : rover.status === 'en-route-return'
              ? `Returning (${rover.legProgressHours}/${rover.legTotalHours}h)`
              : 'Stranded (0 kWh)'
          }
        />
      </div>

      {/* KPI Row (2x2 on smartphone) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <TelemetryMetric
          label="Rover Battery"
          value={rover.batteryKwh.toFixed(1)}
          unit="kWh"
          progressPct={roverBattPct}
          delta={`Max ${rover.batteryMaxKwh} kWh · Dock ${rover.chargingEnabled ? 'On' : 'Off'}`}
          statusLevel={rover.batteryKwh < 10 ? 'warning' : 'nominal'}
          statusLabel={`${Math.round(roverBattPct)}%`}
        />
        <TelemetryMetric
          label="Mobility & Comms"
          value={rover.mobilityHealthPct.toFixed(0)}
          unit="%"
          progressPct={rover.mobilityHealthPct}
          delta={`Range ${distFromBaseKm.toFixed(1)} / ${rover.commRangeKm} km`}
          statusLevel={rover.mobilityHealthPct < 60 ? 'warning' : 'nominal'}
          statusLabel={inCommRange ? 'Linked' : 'Weak'}
        />
        <TelemetryMetric
          label="Sites Surveyed"
          value={`${rover.visitedWaypointIds.length}/${ROVER_WAYPOINTS.length}`}
          unit="sites"
          progressPct={(rover.visitedWaypointIds.length / ROVER_WAYPOINTS.length) * 100}
          delta={`${rover.samplesCollected} samples collected`}
          statusLevel="info"
          statusLabel="Survey"
        />
        <TelemetryMetric
          label="Ice Prospects"
          value={String(rover.discoveredIceSites.length)}
          unit="sites"
          delta="Prospecting only (needs ISRU plant)"
          statusLevel="info"
          statusLabel="Prospecting"
        />
      </div>

      {/* Interactive 2D Terrain Map + Mission Planner (Supports Portrait & Landscape Split) */}
      <div className="grid grid-cols-1 landscape:grid-cols-12 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        <div className="landscape:col-span-7 lg:col-span-7 min-w-0 space-y-3 sm:space-y-4">
          <LunarTerrainCanvas
            rover={rover}
            selectedWaypointId={selectedWpId}
            routeProfile={routeProfile}
            onSelectWaypoint={setSelectedWpId}
          />

          {/* Quick Touch Waypoint Selector Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {ROVER_WAYPOINTS.map((wp) => {
              const selected = wp.id === selectedWpId;
              const visited = rover.visitedWaypointIds.includes(wp.id);
              return (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setSelectedWpId(wp.id)}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors ${
                    selected
                      ? 'border-cyan-400 bg-cyan-950/35 text-cyan-200'
                      : 'border-slate-800 bg-[#0D1322] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      visited
                        ? 'bg-emerald-400'
                        : wp.hasPotentialWaterIce
                        ? 'bg-sky-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>{wp.name}</span>
                </button>
              );
            })}
          </div>

          {/* ISRU Discovery & Educational Note (Collapsible on < md) */}
          <div className="p-3.5 sm:p-4 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-200">
                ISRU Resource & Discovery Log
              </h3>
              <button
                type="button"
                onClick={() => setShowLogMobile((v) => !v)}
                className="md:hidden min-h-[34px] px-2 text-[11px] text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showLogMobile ? 'Hide' : 'Details'}</span>
                {showLogMobile ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className={`${showLogMobile ? 'block' : 'hidden'} md:block`}>
              {rover.discoveredIceSites.length === 0 && rover.discoveredRegolithSites.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No resource deposits surveyed yet. Dispatch the rover to permanently shadowed crater
                  margins (e.g., PSR Frost Prospect Alpha) to confirm hydrogen/water-ice signatures.
                </p>
              ) : (
                <div className="text-xs text-slate-300 space-y-1">
                  {rover.discoveredIceSites.length > 0 && (
                    <p>
                      Water-Ice Signatures Confirmed:{' '}
                      <span className="text-cyan-300 font-medium">
                        {rover.discoveredIceSites.join(', ')}
                      </span>
                    </p>
                  )}
                  {rover.discoveredRegolithSites.length > 0 && (
                    <p>
                      Regolith / Mineral Sites:{' '}
                      <span className="text-emerald-300 font-medium">
                        {rover.discoveredRegolithSites.join(', ')}
                      </span>
                    </p>
                  )}
                  <p className="text-slate-400 pt-1">
                    Note: {SCIENTIFIC_ASSUMPTIONS.rover.nasaReference}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Route Planner & Rover Command Panel */}
        <div className="landscape:col-span-5 lg:col-span-5 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-4">
          <div>
            <h3 className="inline-flex items-center gap-1 text-sm font-semibold text-slate-200">
              <span>Route Planning & Sortie Dispatch</span>
              <InfoTooltip
                title="Return Reserve & ISRU Rules"
                explanation="Safe Detours avoid crater rims and lower wheel wear. Rovers must retain ≥92% of round-trip energy before launch. Water-ice discoveries are scientific prospects only."
                handbookSection="ch7-rover"
                onOpenHandbook={onOpenHandbook}
              />
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a target destination and check battery return margin before launch.
            </p>
          </div>

          {/* Waypoint Selector */}
          <div>
            <label
              htmlFor="waypoint-select"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Target Destination
            </label>
            <select
              id="waypoint-select"
              value={selectedWpId}
              onChange={(e) => setSelectedWpId(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-xs rounded-lg sm:rounded border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              {ROVER_WAYPOINTS.map((wp) => (
                <option key={wp.id} value={wp.id}>
                  {wp.name} ({wp.hasPotentialWaterIce ? 'Ice Prospect' : 'Geology/Comms'})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{selectedWp.description}</p>
          </div>

          {/* Route Profile Selector */}
          <div>
            <span className="block text-xs font-medium text-slate-300 mb-1.5">
              Traverse Route Strategy
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRouteProfile('safe')}
                className={`min-h-[50px] p-2.5 text-left rounded-lg sm:rounded border text-xs cursor-pointer active:scale-[0.98] ${
                  routeProfile === 'safe'
                    ? 'border-cyan-400 bg-cyan-950/25 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300'
                }`}
              >
                <span className="font-medium block">Safe Detour</span>
                <span className="text-[11px] text-slate-400">Low wheel wear</span>
              </button>
              <button
                type="button"
                onClick={() => setRouteProfile('direct')}
                className={`min-h-[50px] p-2.5 text-left rounded-lg sm:rounded border text-xs cursor-pointer active:scale-[0.98] ${
                  routeProfile === 'direct'
                    ? 'border-amber-400 bg-amber-950/25 text-amber-200'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300'
                }`}
              >
                <span className="font-medium block">Direct Path</span>
                <span className="text-[11px] text-slate-400">Shorter · risky</span>
              </button>
            </div>
          </div>

          {/* Computed Plan Estimates */}
          {plan && (
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 space-y-1.5 text-xs font-mono tabular-nums">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">One-Way Distance</span>
                <span className="text-slate-200">{plan.distanceOneWayKm} km</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Transit Duration</span>
                <span className="text-slate-200">{plan.estimatedHoursOneWay}h each way</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Round-Trip Energy</span>
                <span className={hasReturnReserve ? 'text-cyan-300' : 'text-rose-400'}>
                  {plan.estimatedTotalRoundTripKwh} kWh
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Terrain Difficulty</span>
                <span className="text-slate-200">{selectedWp.terrainDifficulty.toFixed(2)}x</span>
              </div>
              {routeProfile === 'direct' && cratersOnDirect.length > 0 && (
                <p className="text-amber-400 font-sans pt-1">
                  Warning: Direct line skirts {cratersOnDirect.join(', ')}, increasing suspension wear.
                </p>
              )}
              {!hasReturnReserve && (
                <p className="text-rose-400 font-sans pt-1">
                  Insufficient battery for safe return reserve. Charge rover at dock first.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            {rover.status === 'docked' && (
              <button
                type="button"
                disabled={!hasReturnReserve}
                onClick={() => onDispatch(selectedWp.id, routeProfile)}
                className="w-full min-h-[48px] sm:min-h-[40px] py-2.5 px-4 text-xs font-semibold rounded-lg sm:rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
              >
                Dispatch Rover to {selectedWp.name}
              </button>
            )}

            {rover.status === 'exploring' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={rover.batteryKwh < 2.0}
                  onClick={onCollectSample}
                  className="min-h-[48px] sm:min-h-[40px] py-2.5 px-3 text-xs font-semibold rounded-lg sm:rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
                >
                  Collect Sample (-1.8 kWh)
                </button>
                <button
                  type="button"
                  onClick={onReturnToBase}
                  className="min-h-[48px] sm:min-h-[40px] py-2.5 px-3 text-xs font-semibold rounded-lg sm:rounded border border-cyan-400 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/40 cursor-pointer active:scale-[0.98]"
                >
                  Return to Base
                </button>
              </div>
            )}

            {rover.status === 'en-route-outbound' && (
              <button
                type="button"
                onClick={() => setConfirmAbortOpen(true)}
                className="w-full min-h-[48px] sm:min-h-[40px] py-2.5 px-4 text-xs font-semibold rounded-lg sm:rounded border border-amber-400 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40 cursor-pointer active:scale-[0.98]"
              >
                Abort Sortie & Return to Base
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onToggleCharging}
                className={`min-h-[44px] sm:min-h-[38px] py-2 px-2.5 text-xs font-medium rounded-lg sm:rounded border cursor-pointer active:scale-[0.98] ${
                  rover.chargingEnabled
                    ? 'border-cyan-500/40 bg-cyan-950/25 text-cyan-200'
                    : 'border-slate-700 bg-slate-900 text-slate-300'
                }`}
              >
                {rover.chargingEnabled ? 'Dock Charge: On' : 'Dock Charge: Off'}
              </button>
              <button
                type="button"
                disabled={rover.status !== 'docked' || rover.mobilityHealthPct >= 99}
                onClick={onRepairMobility}
                className="min-h-[44px] sm:min-h-[38px] py-2 px-2.5 text-xs font-medium rounded-lg sm:rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
              >
                Service Wheels
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={confirmAbortOpen}
        title="Abort Active Rover Sortie?"
        description="The rover is currently outbound toward its destination. Aborting now turns it around before reaching the waypoint."
        confirmLabel="Abort & Return"
        tone="warning"
        onCancel={() => setConfirmAbortOpen(false)}
        onConfirm={() => {
          setConfirmAbortOpen(false);
          onReturnToBase();
        }}
      />
    </div>
  );
}

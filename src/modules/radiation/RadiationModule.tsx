import { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ConfirmActionModal } from '../../components/ConfirmActionModal';
import { InfoTooltip } from '../../components/InfoTooltip';
import { StatusIndicator } from '../../components/StatusIndicator';
import { TelemetryMetric } from '../../components/TelemetryMetric';
import type { HandbookSectionId } from '../../data/handbookContent';
import { SCIENTIFIC_ASSUMPTIONS } from '../../simulation/config';
import { computeShieldingTransmission } from '../../simulation/resources';
import type { SimulationState } from '../../simulation/types';

interface RadiationModuleProps {
  state: SimulationState;
  onAdjustWaterWall: (delta: number) => void;
  onAddRegolith: () => void;
  onToggleShelter: () => void;
  onOpenHandbook?: (section: HandbookSectionId) => void;
}

export function RadiationModule({
  state,
  onAdjustWaterWall,
  onAddRegolith,
  onToggleShelter,
  onOpenHandbook,
}: RadiationModuleProps) {
  const [showChartMobile, setShowChartMobile] = useState(false);
  const [confirmExitShelter, setConfirmExitShelter] = useState(false);
  const [confirmDrainWater, setConfirmDrainWater] = useState(false);

  const shielding = state.shielding;
  const attenuation = computeShieldingTransmission(shielding);

  const usedMassKg =
    shielding.aluminiumKg + shielding.waterWallLitres + shielding.regolithBagsKg;
  const remainingMassKg = Math.max(0, shielding.totalMassBudgetKg - usedMassKg);

  const speActive = state.eventRadiationMsvPerHour > 0;
  const speWarning = state.alerts.some(
    (a) => !a.resolved && a.subsystem === 'radiation' && a.severity === 'critical'
  );

  const radStatusLevel =
    state.cumulativeRadiationMsv >= 150
      ? 'critical'
      : state.cumulativeRadiationMsv >= 50 || speActive
      ? 'warning'
      : 'nominal';

  const chartData = state.telemetry.slice(-48);

  const handleShelterClick = () => {
    if (shielding.inShelter && speActive) {
      setConfirmExitShelter(true);
    } else {
      onToggleShelter();
    }
  };

  const handleDrainWaterWallClick = () => {
    if (speActive || state.waterLitres < 70) {
      setConfirmDrainWater(true);
    } else {
      onAdjustWaterWall(-30);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-slate-100">
            03. Radiation Protection
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 max-w-2xl">
            Attenuate GCR and Solar Particle Events (SPE) using aluminium hull, water wall
            bladders, regolith berms, and storm sheltering.
          </p>
        </div>
        <StatusIndicator
          level={speActive ? 'critical' : speWarning ? 'warning' : 'nominal'}
          label={
            speActive
              ? 'SPE Active!'
              : speWarning
              ? 'SPE Warning'
              : 'Background Flux'
          }
        />
      </div>

      {/* Urgent Mobile Shelter Callout during SPE / Warning */}
      {(speActive || speWarning) && (
        <div className="p-3.5 rounded-lg border border-rose-500/50 bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-rose-200">
                {speActive
                  ? 'Solar Particle Event In Progress'
                  : 'Solar Particle Event Incoming'}
              </p>
              <p className="text-xs text-rose-100/80 mt-0.5">
                {shielding.inShelter
                  ? 'Crew is protected inside the Storm Shelter (-82% extra proton dose).'
                  : 'Proton flux elevated! Move crew into the Storm Shelter immediately.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleShelterClick}
            className={`min-h-[46px] px-4 py-2 text-xs font-semibold rounded-lg shrink-0 cursor-pointer transition-transform active:scale-[0.98] ${
              shielding.inShelter
                ? 'border border-amber-400 bg-amber-950/50 text-amber-200'
                : 'bg-rose-500 text-slate-950 hover:bg-rose-400'
            }`}
          >
            {shielding.inShelter ? 'Exit Storm Shelter' : 'Enter Storm Shelter Now'}
          </button>
        </div>
      )}

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <TelemetryMetric
          label="Cumulative Dose"
          value={state.cumulativeRadiationMsv.toFixed(1)}
          unit="mSv"
          progressPct={Math.min(
            100,
            (state.cumulativeRadiationMsv / SCIENTIFIC_ASSUMPTIONS.radiation.criticalDoseMsv) * 100
          )}
          delta={`Caution ${SCIENTIFIC_ASSUMPTIONS.radiation.careerCautionMsv} · Limit 250 mSv`}
          statusLevel={radStatusLevel}
          statusLabel={
            radStatusLevel === 'nominal'
              ? 'Safe'
              : radStatusLevel === 'warning'
              ? 'Elevated'
              : 'Critical'
          }
        />
        <TelemetryMetric
          label="Dose Rate"
          value={state.effectiveDoseRateMsvPerHour.toFixed(3)}
          unit="mSv/h"
          delta={`Raw ${(
            state.backgroundRadiationMsvPerHour + state.eventRadiationMsvPerHour
          ).toFixed(3)} mSv/h`}
          statusLevel={state.effectiveDoseRateMsvPerHour > 0.08 ? 'critical' : 'nominal'}
          statusLabel={state.effectiveDoseRateMsvPerHour > 0.08 ? 'High' : 'Shielded'}
        />
        <TelemetryMetric
          label="Shield Attenuation"
          value={attenuation.protectionPct.toFixed(1)}
          unit="%"
          progressPct={attenuation.protectionPct}
          delta={`Areal density ${attenuation.arealDensityGcm2} g/cm²`}
          statusLevel={attenuation.protectionPct > 45 ? 'nominal' : 'info'}
          statusLabel={shielding.inShelter ? 'Shelter' : 'Walls'}
        />
        <TelemetryMetric
          label="Storm Shelter"
          value={shielding.inShelter ? 'ACTIVE' : 'OPEN'}
          unit=""
          delta={
            shielding.inShelter
              ? '-82% extra proton dose · +0.5 kW'
              : 'Crew in main habitat'
          }
          statusLevel={
            speActive && !shielding.inShelter
              ? 'critical'
              : shielding.inShelter
              ? 'info'
              : 'nominal'
          }
          statusLabel={
            speActive && !shielding.inShelter
              ? 'Enter!'
              : shielding.inShelter
              ? 'Sheltered'
              : 'Normal'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Shielding Engineering & Shelter Controls */}
        <div className="lg:col-span-5 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-4 sm:space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-1 text-sm font-semibold text-slate-200">
              <span>Shielding & Shelter Controls</span>
              <InfoTooltip
                title="GCR, SPE & Material Attenuation"
                explanation="Hydrogen-rich water blocks protons ~2x better per kg than aluminium, while lunar regolith uses local soil with zero launch mass. Use Storm Shelter during Solar Particle Events."
                handbookSection="ch5-radiation"
                onOpenHandbook={onOpenHandbook}
              />
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {usedMassKg.toLocaleString()} / {shielding.totalMassBudgetKg.toLocaleString()} kg
            </span>
          </div>

          {/* Storm Shelter Toggle */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100">
                Habitat Storm Shelter Protocol
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {shielding.inShelter
                  ? 'Crew sheltered inside water-lined core. Exit once SPE clears.'
                  : 'Move crew into inner storm shelter during Solar Particle Events.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleShelterClick}
              className={`min-h-[46px] sm:min-h-[38px] px-4 py-2 text-xs font-semibold rounded-lg sm:rounded border shrink-0 cursor-pointer active:scale-[0.98] ${
                shielding.inShelter
                  ? 'border-amber-400 bg-amber-950/40 text-amber-200 hover:bg-amber-900/40'
                  : speActive || speWarning
                  ? 'border-rose-400 bg-rose-950/50 text-rose-200 hover:bg-rose-900/50'
                  : 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-900/40'
              }`}
            >
              {shielding.inShelter ? 'Exit Storm Shelter' : 'Enter Storm Shelter'}
            </button>
          </div>

          {/* Three Shielding Materials */}
          <div className="space-y-3">
            {/* Aluminium */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-medium text-slate-200">
                  1. Structural Aluminium Hull
                </span>
                <span className="font-mono tabular-nums text-slate-300 shrink-0">
                  {shielding.aluminiumKg.toLocaleString()} kg
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Baseline pressurized hull alloy. Moderate attenuation; high launch mass cost.
              </p>
            </div>

            {/* Water-based shielding */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-medium text-slate-200">
                  2. Hydrogen-Rich Water Bladders
                </span>
                <span className="font-mono tabular-nums text-cyan-300 shrink-0">
                  {shielding.waterWallLitres} L (kg)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Blocks solar protons ~2x better per kg than aluminium ({state.waterLitres.toFixed(0)} L
                potable tank; 40 L safety floor).
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <button
                  type="button"
                  disabled={state.waterLitres < 70 || remainingMassKg < 30}
                  onClick={() => onAdjustWaterWall(30)}
                  className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg sm:rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
                >
                  Pump +30 L
                </button>
                <button
                  type="button"
                  disabled={shielding.waterWallLitres < 30}
                  onClick={handleDrainWaterWallClick}
                  className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg sm:rounded border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
                >
                  Drain -30 L
                </button>
              </div>
            </div>

            {/* Lunar Regolith */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-medium text-slate-200">
                  3. In-Situ Lunar Regolith Berm
                </span>
                <span className="font-mono tabular-nums text-emerald-300 shrink-0">
                  {shielding.regolithBagsKg.toLocaleString()} kg
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Local lunar soil piled over the habitat requires zero launch mass or drinking water.
              </p>
              <div className="mt-2.5">
                <button
                  type="button"
                  disabled={remainingMassKg < 100 || shielding.inShelter}
                  onClick={onAddRegolith}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 text-xs font-medium rounded-lg sm:rounded border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
                >
                  {shielding.inShelter
                    ? 'Unavailable While Sheltered'
                    : 'Stack +450 kg Regolith Berm'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cumulative Radiation Chart */}
        <div className="lg:col-span-7 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-200">
                Cumulative Dose Trajectory (48h)
              </h3>
              <p className="text-xs text-slate-400">
                Absorbed crew dose (mSv) across GCR background and solar storms
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChartMobile((v) => !v)}
              aria-expanded={showChartMobile}
              className="md:hidden min-h-[40px] px-3 text-xs text-cyan-300 inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/60 cursor-pointer shrink-0"
            >
              <span>{showChartMobile ? 'Hide Chart' : 'View Chart'}</span>
              {showChartMobile ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className={`${showChartMobile ? 'flex' : 'hidden'} md:flex flex-col flex-1`}>
            <div className="flex-1 min-h-[220px] sm:min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    stroke="#64748B"
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(v) => `H${v}`}
                  />
                  <YAxis width={52} stroke="#F59E0B" tick={{ fontSize: 11, fill: '#94A3B8' }} unit=" mSv" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1120',
                      borderColor: '#334155',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono, monospace',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeRadiationMsv"
                    name="Cumulative Dose (mSv)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span className="text-slate-200 font-medium">Educational Model Scope: </span>
              {SCIENTIFIC_ASSUMPTIONS.radiation.nasaReference}
            </p>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={confirmExitShelter}
        title="Exit Storm Shelter During Active SPE?"
        description="A Solar Particle Event is still hitting the Moon. Leaving the storm shelter now will expose the crew to elevated radiation dose rates."
        confirmLabel="Exit Shelter Anyway"
        tone="danger"
        onCancel={() => setConfirmExitShelter(false)}
        onConfirm={() => {
          setConfirmExitShelter(false);
          onToggleShelter();
        }}
      />

      <ConfirmActionModal
        open={confirmDrainWater}
        title="Drain 30 L from Radiation Water Wall?"
        description={
          speActive
            ? 'A Solar Particle Event is active. Draining shielding water right now lowers proton attenuation for the crew.'
            : 'Potable reserves are getting tight. Draining water back to tanks helps hydration but reduces habitat radiation protection.'
        }
        confirmLabel="Drain -30 L"
        tone="warning"
        onCancel={() => setConfirmDrainWater(false)}
        onConfirm={() => {
          setConfirmDrainWater(false);
          onAdjustWaterWall(-30);
        }}
      />
    </div>
  );
}

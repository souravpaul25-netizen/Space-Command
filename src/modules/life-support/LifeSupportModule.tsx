import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
import {
  getActivityMultiplier,
  getElectrolysisTargetKgPerHour,
} from '../../simulation/resources';
import type {
  CrewActivityLevel,
  ElectrolysisMode,
  SimulationState,
} from '../../simulation/types';

interface LifeSupportModuleProps {
  state: SimulationState;
  onSetCrewActivity: (activity: CrewActivityLevel) => void;
  onSetElectrolysisMode: (mode: ElectrolysisMode) => void;
  onToggleScrubber: () => void;
  onToggleRecycler: () => void;
  onToggleEmergencyO2: () => void;
  onRepair: (target: 'scrubber' | 'recycler') => void;
  onOpenHandbook?: (section: HandbookSectionId) => void;
}

export function LifeSupportModule({
  state,
  onSetCrewActivity,
  onSetElectrolysisMode,
  onToggleScrubber,
  onToggleRecycler,
  onToggleEmergencyO2,
  onRepair,
  onOpenHandbook,
}: LifeSupportModuleProps) {
  const [showChartMobile, setShowChartMobile] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'scrubber' | 'recycler' | null>(null);

  const activityMult =
    getActivityMultiplier(state.crewActivity) * (state.shielding.inShelter ? 1.06 : 1.0);
  const o2ConsumptionPerHour =
    (state.config.crewSize *
      SCIENTIFIC_ASSUMPTIONS.lifeSupport.o2ConsumptionKgPerPersonDay *
      activityMult) /
    24;
  const targetElectrolysisKgH =
    state.poweredSubsystems.lifeSupport && state.waterLitres > 1
      ? getElectrolysisTargetKgPerHour(state.electrolysisMode)
      : 0;
  const netO2Rate = targetElectrolysisKgH - o2ConsumptionPerHour;

  const co2Level =
    state.co2Ppm >= 10000 ? 'critical' : state.co2Ppm >= 3500 ? 'warning' : 'nominal';
  const o2Level =
    state.oxygenKg < 10 ? 'critical' : state.oxygenKg < 25 ? 'warning' : 'nominal';
  const waterLevel =
    state.waterLitres < 25 ? 'critical' : state.waterLitres < 60 ? 'warning' : 'nominal';

  const chartData = state.telemetry.slice(-48);

  const handleScrubberClick = () => {
    if (state.co2ScrubberEnabled) {
      setConfirmAction('scrubber');
    } else {
      onToggleScrubber();
    }
  };

  const handleRecyclerClick = () => {
    if (state.waterRecyclerEnabled) {
      setConfirmAction('recycler');
    } else {
      onToggleRecycler();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Engineering Note */}
      <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-slate-100">
            01. Life Support & Atmosphere
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 max-w-2xl">
            Maintain breathable O₂ (21.2 kPa), scrub metabolic CO₂ below 2,000 ppm, and close the
            water distillation loop.
          </p>
        </div>
        <StatusIndicator
          level={state.poweredSubsystems.lifeSupport ? 'nominal' : 'critical'}
          label={
            state.poweredSubsystems.lifeSupport
              ? `ECLSS (${state.lastHourBreakdown.lifeSupportKw.toFixed(1)} kW)`
              : 'ECLSS Shed!'
          }
        />
      </div>

      {/* Primary KPI Row (2x2 on smartphone, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <TelemetryMetric
          label="Oxygen Reserves"
          value={state.oxygenKg.toFixed(1)}
          unit="kg"
          progressPct={(state.oxygenKg / state.config.maxOxygenKg) * 100}
          delta={`Net ${netO2Rate >= 0 ? '+' : ''}${netO2Rate.toFixed(3)} kg/h · ${state.cabinO2Kpa.toFixed(1)} kPa`}
          statusLevel={o2Level}
          statusLabel={o2Level === 'nominal' ? 'Nominal' : o2Level === 'warning' ? 'Low' : 'Critical'}
        />
        <TelemetryMetric
          label="Cabin CO₂"
          value={state.co2Ppm.toLocaleString()}
          unit="ppm"
          progressPct={Math.min(100, (state.co2Ppm / 15000) * 100)}
          delta={`Scrubber ${state.co2ScrubberHealthPct.toFixed(0)}% health`}
          statusLevel={co2Level}
          statusLabel={co2Level === 'nominal' ? 'Safe' : co2Level === 'warning' ? 'High' : 'Toxic'}
        />
        <TelemetryMetric
          label="Potable Water"
          value={state.waterLitres.toFixed(1)}
          unit="L"
          progressPct={(state.waterLitres / state.config.maxWaterLitres) * 100}
          delta={`Recovery ${state.waterRecoveryEfficiencyPct.toFixed(1)}%`}
          statusLevel={waterLevel}
          statusLabel={waterLevel === 'nominal' ? 'Nominal' : waterLevel === 'warning' ? 'Low' : 'Critical'}
        />
        <TelemetryMetric
          label="Emergency O₂"
          value={state.emergencyOxygenKg.toFixed(1)}
          unit="kg"
          progressPct={(state.emergencyOxygenKg / Math.max(1, state.config.emergencyOxygenReserveKg)) * 100}
          delta={state.emergencyOxygenActive ? 'Auto-feed armed (< 4 kg)' : 'Manual standby'}
          statusLevel={state.emergencyOxygenKg > 5 ? 'info' : 'warning'}
          statusLabel={state.emergencyOxygenActive ? 'Armed' : 'Standby'}
        />
      </div>

      {/* Controls & Atmosphere Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Interactive Control Deck */}
        <div className="lg:col-span-5 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-4 sm:space-y-5">
          <h3 className="text-sm font-semibold text-slate-200">
            Atmospheric & Water Controls
          </h3>

          {/* Crew Activity */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
              <span className="text-slate-300 font-medium">Crew Activity Level</span>
              <span className="font-mono tabular-nums text-slate-400">
                {(o2ConsumptionPerHour * 24).toFixed(2)} kg O₂/day
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
              {(['resting', 'nominal', 'high'] as CrewActivityLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSetCrewActivity(lvl)}
                  className={`min-h-[44px] sm:min-h-[36px] py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize active:scale-[0.98] ${
                    state.crewActivity === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Electrolysis */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
              <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                <span>O₂ Electrolysis Generator</span>
                <InfoTooltip
                  title="Electrolysis (2H₂O → 2H₂ + O₂)"
                  explanation="Splits liquid water into breathable oxygen using electricity (1.125 L water + 5.8 kWh per 1 kg O₂). Balanced mode matches 4-crew demand."
                  handbookSection="ch3-life-support"
                  onOpenHandbook={onOpenHandbook}
                />
              </span>
              <span className="font-mono tabular-nums text-slate-400">
                {(targetElectrolysisKgH * 1.125).toFixed(2)} L/h ·{' '}
                {(
                  targetElectrolysisKgH *
                  SCIENTIFIC_ASSUMPTIONS.lifeSupport.electrolysisKwhPerKgO2
                ).toFixed(2)}{' '}
                kW
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
              {(['off', 'conserve', 'balanced', 'boost'] as ElectrolysisMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSetElectrolysisMode(mode)}
                  className={`min-h-[44px] sm:min-h-[36px] py-2 px-1 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize active:scale-[0.98] ${
                    state.electrolysisMode === mode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Toggles & Maintenance */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="p-3 rounded-lg border border-slate-800/90 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200">
                  CO₂ Amine Scrubber ({state.co2ScrubberHealthPct.toFixed(0)}%)
                </p>
                <p className="text-[11px] text-slate-400">Draws 1.0 kW to strip cabin CO₂</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleScrubberClick}
                  className={`flex-1 sm:flex-initial min-h-[44px] sm:min-h-[34px] px-3 py-1.5 text-xs font-medium rounded-lg sm:rounded border cursor-pointer active:scale-[0.98] ${
                    state.co2ScrubberEnabled
                      ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
                      : 'border-rose-500/50 bg-rose-950/30 text-rose-300'
                  }`}
                >
                  {state.co2ScrubberEnabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  type="button"
                  disabled={state.co2ScrubberHealthPct >= 98}
                  onClick={() => onRepair('scrubber')}
                  className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[34px] px-3 py-1.5 text-xs font-medium rounded-lg sm:rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
                >
                  Service
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-800/90 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-200">
                  <span>Water Recycler ({state.waterRecyclerHealthPct.toFixed(0)}%)</span>
                  <InfoTooltip
                    title="Closed-Loop Water Recycling"
                    explanation="Reclaims up to 94% of crew wastewater and 55% of greenhouse crop transpiration. Disabling it drains tanks ~11.2 L/day."
                    handbookSection="ch3-life-support"
                    onOpenHandbook={onOpenHandbook}
                  />
                </div>
                <p className="text-[11px] text-slate-400">Draws 1.1 kW · recovers crew & crop H₂O</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRecyclerClick}
                  className={`flex-1 sm:flex-initial min-h-[44px] sm:min-h-[34px] px-3 py-1.5 text-xs font-medium rounded-lg sm:rounded border cursor-pointer active:scale-[0.98] ${
                    state.waterRecyclerEnabled
                      ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
                      : 'border-rose-500/50 bg-rose-950/30 text-rose-300'
                  }`}
                >
                  {state.waterRecyclerEnabled ? 'Enabled' : 'Paused'}
                </button>
                <button
                  type="button"
                  disabled={state.waterRecyclerHealthPct >= 98}
                  onClick={() => onRepair('recycler')}
                  className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[34px] px-3 py-1.5 text-xs font-medium rounded-lg sm:rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
                >
                  Service
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-800/90 bg-slate-900/40 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200">
                  Emergency O₂ Auto-Feed
                </p>
                <p className="text-[11px] text-slate-400">Releases reserve if main O₂ &lt; 4 kg</p>
              </div>
              <button
                type="button"
                onClick={onToggleEmergencyO2}
                className={`min-h-[44px] sm:min-h-[34px] px-3.5 py-1.5 text-xs font-medium rounded-lg sm:rounded border shrink-0 cursor-pointer active:scale-[0.98] ${
                  state.emergencyOxygenActive
                    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {state.emergencyOxygenActive ? 'Armed' : 'Manual'}
              </button>
            </div>
          </div>
        </div>

        {/* Atmospheric Telemetry Chart (collapsible on smartphone) */}
        <div className="lg:col-span-7 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-200">
                Atmosphere & Water Telemetry (48h)
              </h3>
              <p className="text-xs text-slate-400">
                Tracks O₂ (kg), CO₂ (ppm), and water reserves (L)
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
            <div className="flex-1 min-h-[220px] sm:min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    stroke="#64748B"
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(v) => `H${v}`}
                  />
                  <YAxis
                    yAxisId="left"
                    width={42}
                    stroke="#06B6D4"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />
                  <YAxis
                    yAxisId="right"
                    width={48}
                    orientation="right"
                    stroke="#F59E0B"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1120',
                      borderColor: '#334155',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono, monospace',
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="oxygenKg"
                    name="O₂ (kg)"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="waterLitres"
                    name="Water (L)"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="co2Ppm"
                    name="CO₂ (ppm)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span className="text-slate-200 font-medium">Engineering Note: </span>
              {SCIENTIFIC_ASSUMPTIONS.lifeSupport.nasaReference}
            </p>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={confirmAction !== null}
        title={
          confirmAction === 'scrubber'
            ? 'Disable CO₂ Amine Scrubber?'
            : 'Pause Water Distillation Recycler?'
        }
        description={
          confirmAction === 'scrubber'
            ? 'Disabling the CO₂ scrubber saves 1.0 kW of power, but exhaled CO₂ will climb rapidly toward hazardous levels (> 10,000 ppm).'
            : 'Pausing water recycling saves 1.1 kW, but unrecovered wastewater and crop transpiration will drain potable reserves (~11.2 L/day).'
        }
        confirmLabel={confirmAction === 'scrubber' ? 'Disable Scrubber' : 'Pause Recycler'}
        tone="danger"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === 'scrubber') onToggleScrubber();
          if (confirmAction === 'recycler') onToggleRecycler();
          setConfirmAction(null);
        }}
      />
    </div>
  );
}

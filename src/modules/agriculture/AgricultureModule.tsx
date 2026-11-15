import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ConfirmActionModal } from '../../components/ConfirmActionModal';
import { InfoTooltip } from '../../components/InfoTooltip';
import { StatusIndicator } from '../../components/StatusIndicator';
import { TelemetryMetric } from '../../components/TelemetryMetric';
import type { HandbookSectionId } from '../../data/handbookContent';
import { CROP_CATALOG, SCIENTIFIC_ASSUMPTIONS } from '../../simulation/config';
import type {
  CropType,
  LightingLevel,
  NutrientMode,
  SimulationState,
} from '../../simulation/types';

interface AgricultureModuleProps {
  state: SimulationState;
  onPlantCrop: (bayId: number, cropType: CropType) => void;
  onHarvestCrop: (bayId: number) => void;
  onClearCrop: (bayId: number) => void;
  onSetLighting: (level: LightingLevel) => void;
  onSetNutrientMode: (mode: NutrientMode) => void;
  onRepairGreenhouse: () => void;
  onOpenHandbook?: (section: HandbookSectionId) => void;
}

export function AgricultureModule({
  state,
  onPlantCrop,
  onHarvestCrop,
  onClearCrop,
  onSetLighting,
  onSetNutrientMode,
  onRepairGreenhouse,
  onOpenHandbook,
}: AgricultureModuleProps) {
  const [showNoteMobile, setShowNoteMobile] = useState(false);
  const [confirmClearBayId, setConfirmClearBayId] = useState<number | null>(null);

  const dailyFoodDrawKg =
    state.config.crewSize * SCIENTIFIC_ASSUMPTIONS.agriculture.foodKgPerPersonDay;
  const daysOfFoodLeft = state.packagedFoodKg / dailyFoodDrawKg;
  const foodStatus =
    daysOfFoodLeft < 4 ? 'critical' : daysOfFoodLeft < 10 ? 'warning' : 'nominal';

  const activeBays = state.cropBays.filter((b) => b.status === 'growing');
  const cropWaterPerHour = activeBays.reduce((sum, bay) => {
    if (!bay.cropType) return sum;
    return sum + CROP_CATALOG[bay.cropType].waterLitresPerHour;
  }, 0);

  const handleClearBayRequest = (bayId: number, status: string) => {
    if (status === 'growing' || status === 'ready') {
      setConfirmClearBayId(bayId);
    } else {
      onClearCrop(bayId);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-slate-100">
            04. Greenhouse & Food Production
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 max-w-2xl">
            Manage packaged rations and hydroponic crop bays. Greenhouse harvests supplement food
            reserves while competing for electricity and water.
          </p>
        </div>
        <StatusIndicator
          level={state.poweredSubsystems.agriculture ? 'nominal' : 'warning'}
          label={
            state.poweredSubsystems.agriculture
              ? `LEDs On (${state.lastHourBreakdown.agricultureKw.toFixed(1)} kW)`
              : 'LEDs Shed'
          }
        />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <TelemetryMetric
          label="Packaged Food"
          value={state.packagedFoodKg.toFixed(1)}
          unit="kg"
          progressPct={(state.packagedFoodKg / Math.max(1, state.config.initialFoodKg)) * 100}
          delta={`~${daysOfFoodLeft.toFixed(1)} days at ${dailyFoodDrawKg.toFixed(1)} kg/d`}
          statusLevel={foodStatus}
          statusLabel={
            foodStatus === 'nominal' ? 'Nominal' : foodStatus === 'warning' ? 'Low' : 'Critical'
          }
        />
        <TelemetryMetric
          label="Harvested Food"
          value={state.greenhouseFoodProducedKg.toFixed(1)}
          unit="kg"
          delta="Edible dry-mass added"
          statusLevel="info"
          statusLabel={`${activeBays.length}/3 Growing`}
        />
        <TelemetryMetric
          label="Crop Water Draw"
          value={cropWaterPerHour.toFixed(2)}
          unit="L/h"
          delta={`55% vapor captured @ ${state.waterRecoveryEfficiencyPct.toFixed(0)}% WRS`}
          statusLevel={state.waterLitres < 35 ? 'warning' : 'nominal'}
          statusLabel={state.waterLitres < 35 ? 'Tight' : 'Irrigated'}
        />
        <TelemetryMetric
          label="Greenhouse Health"
          value={state.greenhouseHealthPct.toFixed(0)}
          unit="%"
          progressPct={state.greenhouseHealthPct}
          delta={`Crew Morale ${state.crewMoralePct.toFixed(0)}%`}
          statusLevel={state.greenhouseHealthPct < 75 ? 'warning' : 'nominal'}
          statusLabel={state.greenhouseHealthPct < 75 ? 'Calibrate' : 'Healthy'}
        />
      </div>

      {/* Operating Conditions + 3 Crop Bays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Environmental Controls */}
        <div className="lg:col-span-4 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">
            Greenhouse Controls
          </h3>

          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                <span>Artificial LED Lighting</span>
                <InfoTooltip
                  title="Hydroponic Light & Crop Cycles"
                  explanation="LEDs drive photosynthesis over 7–14 day crop cycles. Lowering LEDs saves electricity during crater shadows, but slows harvest. 55% of crop water transpiration is reclaimed by WRS."
                  handbookSection="ch6-agriculture"
                  onOpenHandbook={onOpenHandbook}
                />
              </span>
              <span className="font-mono tabular-nums text-cyan-300">
                {state.greenhouseLighting}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
              {([0, 50, 75, 100] as LightingLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSetLighting(lvl)}
                  className={`min-h-[44px] sm:min-h-[36px] py-2 text-xs font-mono rounded-md transition-colors cursor-pointer active:scale-[0.98] ${
                    state.greenhouseLighting === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {lvl}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-300 font-medium">Hydroponic Nutrient Dosing</span>
              <span className="font-mono text-slate-400 capitalize">
                {state.greenhouseNutrientMode}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800">
              {(['eco', 'standard', 'rich'] as NutrientMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSetNutrientMode(mode)}
                  className={`min-h-[44px] sm:min-h-[36px] py-2 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize active:scale-[0.98] ${
                    state.greenhouseNutrientMode === mode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400">
              Root oxygenation & pump calibration
            </span>
            <button
              type="button"
              disabled={state.greenhouseHealthPct >= 98}
              onClick={onRepairGreenhouse}
              className="min-h-[44px] sm:min-h-[36px] px-3.5 py-1.5 text-xs font-medium rounded-lg sm:rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 disabled:opacity-40 cursor-pointer shrink-0 active:scale-[0.98]"
            >
              Calibrate
            </button>
          </div>

          <div className="border-t border-slate-800 pt-2.5">
            <button
              type="button"
              onClick={() => setShowNoteMobile((v) => !v)}
              className="md:hidden w-full min-h-[36px] flex items-center justify-between text-xs text-cyan-300 cursor-pointer"
            >
              <span>NASA Veggie Science Note</span>
              {showNoteMobile ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            <p className={`${showNoteMobile ? 'block' : 'hidden'} md:block text-xs text-slate-400 mt-1.5 md:mt-0`}>
              <span className="text-slate-200 font-medium">Science Note: </span>
              {SCIENTIFIC_ASSUMPTIONS.agriculture.nasaReference}
            </p>
          </div>
        </div>

        {/* 3 Crop Bays */}
        <div className="lg:col-span-8 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {state.cropBays.map((bay) => {
            const crop = bay.cropType ? CROP_CATALOG[bay.cropType] : null;
            const progressPct = crop
              ? Math.min(100, Math.round((bay.growthHoursElapsed / crop.growthHours) * 100))
              : 0;
            const remainingHours = crop
              ? Math.max(0, Math.ceil(crop.growthHours - bay.growthHoursElapsed))
              : 0;

            return (
              <div
                key={bay.bayId}
                className="min-w-0 p-3.5 sm:p-4 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] flex flex-col justify-between gap-3.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-100">
                      Bay 0{bay.bayId}
                    </h4>
                    <StatusIndicator
                      level={
                        bay.status === 'ready'
                          ? 'nominal'
                          : bay.status === 'failed'
                          ? 'critical'
                          : bay.status === 'growing'
                          ? 'info'
                          : 'warning'
                      }
                      label={
                        bay.status === 'ready'
                          ? 'Ready'
                          : bay.status === 'failed'
                          ? 'Failed'
                          : bay.status === 'growing'
                          ? 'Growing'
                          : 'Empty'
                      }
                    />
                  </div>

                  {crop ? (
                    <div className="mt-2.5 space-y-2.5">
                      <p className="text-sm font-medium text-cyan-300">{crop.name}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{crop.description}</p>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-300 mb-1">
                          <span>Growth {progressPct}%</span>
                          <span>
                            {bay.status === 'ready'
                              ? 'Mature'
                              : `~${(remainingHours / 24).toFixed(1)}d left`}
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              bay.status === 'failed'
                                ? 'bg-rose-500'
                                : bay.status === 'ready'
                                ? 'bg-emerald-400'
                                : 'bg-cyan-400'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-xs font-mono tabular-nums text-slate-400 space-y-0.5">
                        <div>Health: {bay.healthPct.toFixed(0)}% · Yield: {crop.yieldDryKg} kg</div>
                        <div>
                          Uses {crop.waterLitresPerHour} L/h ·{' '}
                          {((crop.powerKwAtFullLight * state.greenhouseLighting) / 100).toFixed(2)} kW
                        </div>
                      </div>

                      {bay.failureReason && (
                        <p className="text-xs text-rose-400">Cause: {bay.failureReason}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2.5 space-y-2">
                      <p className="text-xs text-slate-400">
                        Tap a crop species to plant in this tray:
                      </p>
                      <div className="space-y-1.5">
                        {(Object.keys(CROP_CATALOG) as CropType[]).map((cropKey) => {
                          const def = CROP_CATALOG[cropKey];
                          return (
                            <button
                              key={cropKey}
                              type="button"
                              onClick={() => onPlantCrop(bay.bayId, cropKey)}
                              className="w-full min-h-[44px] text-left px-3 py-2 rounded-lg sm:rounded border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 transition-colors cursor-pointer active:scale-[0.99]"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-medium text-slate-200">{def.name}</span>
                                <span className="font-mono text-cyan-300 shrink-0">
                                  {(def.growthHours / 24).toFixed(0)}d · {def.yieldDryKg} kg
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bay Action Footer */}
                {crop && (
                  <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-2">
                    {bay.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => onHarvestCrop(bay.bayId)}
                        className="flex-1 min-h-[46px] sm:min-h-[38px] py-2 px-3 text-xs font-semibold rounded-lg sm:rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer active:scale-[0.98]"
                      >
                        Harvest (+{crop.yieldDryKg} kg)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleClearBayRequest(bay.bayId, bay.status)}
                      className="min-h-[46px] sm:min-h-[38px] py-2 px-3.5 text-xs font-medium rounded-lg sm:rounded border border-slate-700 text-slate-300 hover:border-slate-500 cursor-pointer active:scale-[0.98]"
                    >
                      Clear Tray
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmActionModal
        open={confirmClearBayId !== null}
        title={`Clear Crop Bay 0${confirmClearBayId ?? ''}?`}
        description="Clearing an active or mature crop bay removes all current plant growth without harvesting. Continue?"
        confirmLabel="Clear Crop Bay"
        tone="warning"
        onCancel={() => setConfirmClearBayId(null)}
        onConfirm={() => {
          if (confirmClearBayId !== null) onClearCrop(confirmClearBayId);
          setConfirmClearBayId(null);
        }}
      />
    </div>
  );
}

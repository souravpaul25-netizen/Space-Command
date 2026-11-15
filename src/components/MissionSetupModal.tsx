import { useState } from 'react';
import { X } from 'lucide-react';
import {
  DEFAULT_MISSION_CONFIG,
  LUNAR_SITE_PROFILES,
  NASA_REFERENCES,
} from '../simulation/config';
import type { LunarSiteId, MissionConfig } from '../simulation/types';

interface MissionSetupModalProps {
  currentConfig: MissionConfig;
  onClose: () => void;
  onStartMission: (config: Partial<MissionConfig>) => void;
}

export function MissionSetupModal({
  currentConfig,
  onClose,
  onStartMission,
}: MissionSetupModalProps) {
  const [siteId, setSiteId] = useState<LunarSiteId>(currentConfig.siteId);
  const [crewSize, setCrewSize] = useState<number>(currentConfig.crewSize);
  const [durationDays, setDurationDays] = useState<number>(
    currentConfig.missionDurationDays
  );
  const [batteryKwh, setBatteryKwh] = useState<number>(
    currentConfig.batteryCapacityKwh
  );

  const handleLaunch = () => {
    const scale = crewSize / 4;
    onStartMission({
      siteId,
      crewSize,
      missionDurationDays: durationDays,
      batteryCapacityKwh: batteryKwh,
      initialBatteryKwh: Math.round(batteryKwh * 0.8),
      initialOxygenKg: Math.round(DEFAULT_MISSION_CONFIG.initialOxygenKg * scale),
      initialWaterLitres: Math.round(DEFAULT_MISSION_CONFIG.initialWaterLitres * scale),
      initialFoodKg: Math.round(DEFAULT_MISSION_CONFIG.initialFoodKg * scale),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-setup-title"
    >
      <div className="w-full max-w-2xl rounded-lg border border-slate-700 bg-[#0B1120] text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-800">
          <div className="min-w-0">
            <h2 id="mission-setup-title" className="text-base sm:text-lg font-semibold text-slate-100">
              Configure New Lunar Outpost Mission
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust outpost parameters and compare lunar south polar vs equatorial illumination.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-100 rounded cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Site Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Landing Site & Illumination Profile
            </label>
            <div className="grid gap-3">
              {Object.values(LUNAR_SITE_PROFILES).map((site) => {
                const selected = site.id === siteId;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => setSiteId(site.id)}
                    className={`text-left p-3.5 rounded-md border transition-colors cursor-pointer ${
                      selected
                        ? 'border-cyan-400 bg-cyan-950/25'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                      <span className="text-sm font-medium text-slate-100">
                        {site.name}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-cyan-300">
                        ~{site.avgIlluminationPct}% Sun
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{site.description}</p>
                    <p className="text-xs font-mono text-slate-500 mt-1">
                      {site.coordinates} · {site.eclipseFrequencyLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configurable Numerical Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-md border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300">Crew Size</span>
                <span className="font-mono tabular-nums text-cyan-300">{crewSize} astronauts</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={crewSize}
                onChange={(e) => setCrewSize(Number(e.target.value))}
                className="w-full telemetry-slider"
              />
            </div>

            <div className="p-3.5 rounded-md border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300">Mission Length</span>
                <span className="font-mono tabular-nums text-cyan-300">{durationDays} days</span>
              </div>
              <input
                type="range"
                min={15}
                max={45}
                step={5}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full telemetry-slider"
              />
            </div>

            <div className="p-3.5 rounded-md border border-slate-800 bg-slate-900/40">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300">Battery Bank</span>
                <span className="font-mono tabular-nums text-cyan-300">{batteryKwh} kWh</span>
              </div>
              <input
                type="range"
                min={80}
                max={200}
                step={20}
                value={batteryKwh}
                onChange={(e) => setBatteryKwh(Number(e.target.value))}
                className="w-full telemetry-slider"
              />
            </div>
          </div>

          {/* Educational Disclaimer & NASA References */}
          <div className="p-4 rounded-md border border-slate-800 bg-slate-900/30 space-y-2">
            <p className="text-xs font-medium text-slate-200">
              Scientific Scope & Educational Assumptions
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              This simulation uses simplified hourly engineering models grounded in NASA ECLSS
              metabolic baselines (0.84 kg O2/person/day) and Artemis Lunar South Pole concepts.
              Crop durations (7–14 days) and radiation attenuation curves are accelerated/simplified
              for educational play and are not flight-certified predictions.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {NASA_REFERENCES.map((ref) => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline"
                >
                  {ref.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-slate-800 bg-[#080D19]">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 rounded border border-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded cursor-pointer"
          >
            Reset & Start Mission
          </button>
        </div>
      </div>
    </div>
  );
}

import { stepOneHour } from './engine';
import type { SimulationState } from './types';

export interface AdvanceResult {
  state: SimulationState;
  hoursAdvanced: number;
  interruptedByEvent: boolean;
  interruptReason: string | null;
}

/**
 * Advances the simulation cleanly by N fixed 1-hour timesteps.
 * Never skips intermediate equipment faults, critical shortages, or solar particle event warnings.
 * When advancing multiple hours (e.g. +6h or +24h), pauses immediately if a critical event requires commander attention.
 */
export function advanceSimulation(
  initialState: SimulationState,
  hoursToAdvance: number
): AdvanceResult {
  let current: SimulationState = { ...initialState, pauseReason: null };
  let hoursAdvanced = 0;

  for (let i = 0; i < hoursToAdvance; i++) {
    if (current.phase !== 'active') {
      break;
    }

    const result = stepOneHour(current);
    current = result.state;
    hoursAdvanced += 1;

    if (current.phase !== 'active') {
      break;
    }

    // If running a multi-hour jump (+6h / +24h), pause at exact hour of a critical event
    if (hoursToAdvance > 1 && result.criticalTriggered) {
      current.paused = true;
      current.pauseReason =
        result.pauseMessage ?? 'Critical event detected — simulation paused for commander review.';
      return {
        state: current,
        hoursAdvanced,
        interruptedByEvent: true,
        interruptReason: current.pauseReason,
      };
    }
  }

  return {
    state: current,
    hoursAdvanced,
    interruptedByEvent: false,
    interruptReason: null,
  };
}

export function formatMissionTime(totalHours: number): {
  day: number;
  hourOfDay: number;
  formatted: string;
} {
  const day = Math.floor(totalHours / 24) + 1;
  const hourOfDay = totalHours % 24;
  const hh = String(hourOfDay).padStart(2, '0');
  return {
    day,
    hourOfDay,
    formatted: `Day ${day} · ${hh}:00`,
  };
}

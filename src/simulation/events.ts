import type { ActiveEvent, MissionAlert, SimulationState } from './types';

interface ScheduledEventTemplate {
  id: string;
  triggerHour: number;
  warningLeadHours: number;
  durationHours: number;
  type: ActiveEvent['type'];
  subsystem: ActiveEvent['subsystem'];
  severity: ActiveEvent['severity'];
  title: string;
  description: string;
  actionHint: string;
}

/**
 * Deterministic yet varied mission events across a 30-day (720-hour) lunar mission.
 * Every major hazard gives advance warning or understandable engineering causes.
 */
const MISSION_EVENT_TIMELINE: ScheduledEventTemplate[] = [
  {
    id: 'evt-dust-1',
    triggerHour: 76, // Day 4
    warningLeadHours: 0,
    durationHours: 180,
    type: 'dust-accumulation',
    subsystem: 'power',
    severity: 'warning',
    title: 'Electrostatic Lunar Dust Accumulation',
    description:
      'Charged lunar regolith dust has settled across solar array photovoltaic surfaces, steadily lowering generation efficiency.',
    actionHint: 'Perform Solar Array Cleaning in Surface Power to restore array output.',
  },
  {
    id: 'evt-scrubber-1',
    triggerHour: 132, // Day 6
    warningLeadHours: 2,
    durationHours: 36,
    type: 'scrubber-malfunction',
    subsystem: 'life-support',
    severity: 'warning',
    title: 'CO2 Scrubber Amine Bed Wear',
    description:
      'Thermal cycling has degraded the CO2 scrubber sorbent bed, reducing carbon dioxide removal rate until serviced.',
    actionHint: 'Inspect Life Support and run Scrubber Maintenance to restore efficiency.',
  },
  {
    id: 'evt-spe-1',
    triggerHour: 210, // Day 9
    warningLeadHours: 5,
    durationHours: 14,
    type: 'solar-particle-event',
    subsystem: 'radiation',
    severity: 'critical',
    title: 'Solar Particle Event (CME Shockwave)',
    description:
      'NOAA/NASA solar monitors detect high-energy proton flux arriving at the lunar surface. Unshielded radiation rates will surge.',
    actionHint: 'Activate Radiation Storm Shelter in Radiation Safety until the event clears.',
  },
  {
    id: 'evt-water-1',
    triggerHour: 300, // Day 13
    warningLeadHours: 2,
    durationHours: 48,
    type: 'water-recycler-fouling',
    subsystem: 'life-support',
    severity: 'warning',
    title: 'Water Recovery Membrane Fouling',
    description:
      'Particulate buildup in the distillation brine loop has lowered water recycling recovery efficiency.',
    actionHint: 'Service the Water Recycler in Life Support or Food & Water to prevent net water loss.',
  },
  {
    id: 'evt-power-dip-1',
    triggerHour: 388, // Day 17
    warningLeadHours: 3,
    durationHours: 16,
    type: 'unexpected-power-dip',
    subsystem: 'power',
    severity: 'warning',
    title: 'Solar Array Tracking Actuator Fault',
    description:
      'Low-temperature lubricant stiffness has reduced solar array sun-tracking alignment by 22% temporarily.',
    actionHint: 'Verify Load Priorities and shed non-critical loads (Greenhouse/Rover Dock) if battery drops.',
  },
  {
    id: 'evt-greenhouse-1',
    triggerHour: 456, // Day 20
    warningLeadHours: 3,
    durationHours: 24,
    type: 'greenhouse-blight',
    subsystem: 'agriculture',
    severity: 'warning',
    title: 'Root Zone Oxygenation Stress',
    description:
      'Nutrient manifold pressure fluctuations are stressing greenhouse crops and degrading bay health.',
    actionHint: 'Inspect Food & Water module and run Greenhouse Calibration to protect yields.',
  },
  {
    id: 'evt-battery-1',
    triggerHour: 528, // Day 23
    warningLeadHours: 2,
    durationHours: 96,
    type: 'battery-degradation',
    subsystem: 'power',
    severity: 'warning',
    title: 'Battery Bank Thermal Cell Imbalance',
    description:
      'Repeated deep discharge cycles have reduced effective usable battery capacity by ~12%.',
    actionHint: 'Run Battery Rebalancing in Surface Power and conserve power during shadow dips.',
  },
  {
    id: 'evt-spe-2',
    triggerHour: 618, // Day 26
    warningLeadHours: 5,
    durationHours: 16,
    type: 'solar-particle-event',
    subsystem: 'radiation',
    severity: 'critical',
    title: 'Major Solar Particle Event',
    description:
      'A fast coronal mass ejection is inbound. Surface proton flux will spike sharply for 16 hours.',
    actionHint: 'Move crew into the Radiation Storm Shelter immediately and verify water/regolith shielding.',
  },
];

function addAlert(state: SimulationState, alert: MissionAlert) {
  if (!state.alerts.some((a) => a.id === alert.id)) {
    state.alerts.unshift(alert);
    if (state.alerts.length > 40) {
      state.alerts = state.alerts.slice(0, 40);
    }
  }
}

/**
 * Evaluates event warnings, activations, and expirations for the current simulation hour.
 * Returns true if a critical event requires pausing multi-hour fast-forward so the commander can react.
 */
export function processMissionEventsForHour(state: SimulationState): {
  criticalTriggered: boolean;
  pauseMessage: string | null;
} {
  let criticalTriggered = false;
  let pauseMessage: string | null = null;
  const h = state.hour;

  for (const tpl of MISSION_EVENT_TIMELINE) {
    const warningHour = tpl.triggerHour - tpl.warningLeadHours;
    const endHour = tpl.triggerHour + tpl.durationHours;

    // 1. Advance warning notification
    if (tpl.warningLeadHours > 0 && h === warningHour) {
      addAlert(state, {
        id: `warn-${tpl.id}`,
        hour: h,
        subsystem: tpl.subsystem,
        severity: tpl.severity === 'critical' ? 'critical' : 'warning',
        title: `Advance Warning: ${tpl.title}`,
        message: `${tpl.description} Expected onset in ${tpl.warningLeadHours} hours.`,
        actionHint: tpl.actionHint,
        resolved: false,
      });

      if (tpl.severity === 'critical') {
        criticalTriggered = true;
        pauseMessage = `Incoming Solar Particle Event warning (${tpl.warningLeadHours}h lead time). Prepare Radiation Shelter.`;
      }
    }

    // 2. Event activation
    if (h === tpl.triggerHour) {
      const evt: ActiveEvent = {
        id: tpl.id,
        type: tpl.type,
        title: tpl.title,
        subsystem: tpl.subsystem,
        startHour: tpl.triggerHour,
        warningHours: tpl.warningLeadHours,
        durationHours: tpl.durationHours,
        severity: tpl.severity,
        active: true,
        mitigated: false,
        description: tpl.description,
      };
      if (!state.activeEvents.some((e) => e.id === evt.id)) {
        state.activeEvents.push(evt);
      }

      addAlert(state, {
        id: `active-${tpl.id}`,
        hour: h,
        subsystem: tpl.subsystem,
        severity: tpl.severity,
        title: tpl.title,
        message: tpl.description,
        actionHint: tpl.actionHint,
        resolved: false,
      });

      // Apply immediate onset effects
      if (tpl.type === 'dust-accumulation') {
        state.solarDustLossPct = Math.min(45, state.solarDustLossPct + 14);
      } else if (tpl.type === 'scrubber-malfunction') {
        state.co2ScrubberHealthPct = Math.max(38, state.co2ScrubberHealthPct - 35);
      } else if (tpl.type === 'water-recycler-fouling') {
        state.waterRecyclerHealthPct = Math.max(42, state.waterRecyclerHealthPct - 32);
      } else if (tpl.type === 'battery-degradation') {
        state.batteryHealthPct = Math.max(70, state.batteryHealthPct - 14);
      } else if (tpl.type === 'greenhouse-blight') {
        state.greenhouseHealthPct = Math.max(45, state.greenhouseHealthPct - 30);
      } else if (tpl.type === 'solar-particle-event' && !state.shielding.inShelter) {
        criticalTriggered = true;
        pauseMessage = 'Solar Particle Event active! Crew is un-sheltered.';
      }
    }

    // 3. Event expiration
    if (h === endHour) {
      const existing = state.activeEvents.find((e) => e.id === tpl.id);
      if (existing) {
        existing.active = false;
      }
      const relatedAlert = state.alerts.find((a) => a.id === `active-${tpl.id}`);
      if (relatedAlert && (tpl.type === 'solar-particle-event' || tpl.type === 'unexpected-power-dip')) {
        relatedAlert.resolved = true;
      }
      if (tpl.type === 'solar-particle-event') {
        addAlert(state, {
          id: `clear-${tpl.id}`,
          hour: h,
          subsystem: 'radiation',
          severity: 'info',
          title: 'Solar Particle Event Cleared',
          message: 'Proton flux has returned to lunar background levels. Crew may exit the storm shelter.',
          actionHint: 'Resume normal operations in Radiation Safety.',
          resolved: true,
        });
      }
    }
  }

  // Dynamic continuous dust accumulation on the lunar surface (~0.04% per hour)
  state.solarDustLossPct = Math.min(48, Number((state.solarDustLossPct + 0.045).toFixed(3)));

  // Compute current active SPE radiation contribution
  const activeSpe = state.activeEvents.find(
    (e) => e.active && e.type === 'solar-particle-event'
  );
  state.eventRadiationMsvPerHour = activeSpe ? 0.58 : 0;

  return { criticalTriggered, pauseMessage };
}

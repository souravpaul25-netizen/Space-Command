import { ROVER_WAYPOINTS, SCIENTIFIC_ASSUMPTIONS } from './config';
import { clamp } from './resources';
import type { MissionEvaluation, ScoreCategory, SimulationState } from './types';

/**
 * Safety-first mission evaluation.
 * Crew survival and critical life-support / radiation thresholds strictly govern mission success.
 * Optional exploration achievements cannot compensate for crew endangerment.
 */
export function evaluateMission(state: SimulationState): MissionEvaluation {
  const crewSurvived = state.phase !== 'failed' && state.crewHealthPct > 0;

  // 1. Crew Safety & Health (Critical weight: 30%)
  const crewSafetyScore = crewSurvived
    ? Math.round(clamp(state.crewHealthPct * 0.75 + state.crewMoralePct * 0.25, 0, 100))
    : 0;

  // 2. Atmospheric Stability (O2 + CO2 control, weight: 20%)
  const co2Penalty =
    state.co2Ppm <= 2500
      ? 0
      : state.co2Ppm <= 5000
      ? (state.co2Ppm - 2500) / 120
      : 22 + (state.co2Ppm - 5000) / 250;
  const o2Penalty = state.oxygenKg < 15 ? (15 - state.oxygenKg) * 2.5 : 0;
  const atmosphereScore = Math.round(clamp(100 - co2Penalty - o2Penalty, 0, 100));

  // 3. Water Sustainability (weight: 15%)
  const waterRatio = state.waterLitres / state.config.initialWaterLitres;
  const waterScore = Math.round(
    clamp(
      waterRatio >= 0.75
        ? 85 + (state.waterRecoveryEfficiencyPct - 80) * 0.8
        : waterRatio * 110,
      0,
      100
    )
  );

  // 4. Energy Reliability (weight: 15%)
  const avgDeficitHours = state.telemetry.filter((t) => t.powerDemandKw > t.solarPowerKw + 3 && t.batteryKwh < 8).length;
  const batteryPct = (state.batteryKwh / state.batteryMaxEffectiveKwh) * 100;
  const energyScore = Math.round(
    clamp(88 + batteryPct * 0.12 - avgDeficitHours * 4, 0, 100)
  );

  // 5. Food Availability & Greenhouse Output (weight: 10%)
  const totalFoodRemaining = state.packagedFoodKg;
  const greenhouseBonus = Math.min(35, state.greenhouseFoodProducedKg * 3.5);
  const foodScore = Math.round(
    clamp(
      (totalFoodRemaining > 10 ? 65 : totalFoodRemaining * 6) + greenhouseBonus,
      0,
      100
    )
  );

  // 6. Radiation Protection (weight: 10%, hard cap if critical dose exceeded)
  const radLimit = SCIENTIFIC_ASSUMPTIONS.radiation.criticalDoseMsv;
  const radScore = Math.round(
    clamp(100 - (state.cumulativeRadiationMsv / radLimit) * 90, 0, 100)
  );

  // 7. Exploration Objectives (Optional bonus weight: 10% — capped if crew safety was compromised)
  const visitedRatio = state.rover.visitedWaypointIds.length / ROVER_WAYPOINTS.length;
  const sampleScore = Math.min(100, visitedRatio * 75 + state.rover.samplesCollected * 6);
  const explorationScore = Math.round(
    crewSurvived ? clamp(sampleScore, 0, 100) : Math.min(30, sampleScore)
  );

  const categories: ScoreCategory[] = [
    {
      id: 'crew-safety',
      label: 'Crew Safety & Health',
      score: crewSafetyScore,
      weight: 0.25,
      status: crewSafetyScore >= 75 ? 'nominal' : crewSafetyScore >= 45 ? 'warning' : 'critical',
      summary: crewSurvived
        ? `Crew health at ${state.crewHealthPct.toFixed(0)}%, morale ${state.crewMoralePct.toFixed(0)}%.`
        : `Mission lost: ${state.failureReason || 'Critical life-support failure.'}`,
    },
    {
      id: 'atmosphere',
      label: 'Atmospheric Stability',
      score: atmosphereScore,
      weight: 0.2,
      status: atmosphereScore >= 75 ? 'nominal' : atmosphereScore >= 45 ? 'warning' : 'critical',
      summary: `O2 reserves ${state.oxygenKg.toFixed(1)} kg · CO2 ${Math.round(state.co2Ppm)} ppm.`,
    },
    {
      id: 'water',
      label: 'Water Sustainability',
      score: waterScore,
      weight: 0.15,
      status: waterScore >= 75 ? 'nominal' : waterScore >= 45 ? 'warning' : 'critical',
      summary: `${state.waterLitres.toFixed(0)} L available · ${state.waterRecoveryEfficiencyPct.toFixed(1)}% recovery rate.`,
    },
    {
      id: 'energy',
      label: 'Energy Reliability',
      score: energyScore,
      weight: 0.15,
      status: energyScore >= 75 ? 'nominal' : energyScore >= 45 ? 'warning' : 'critical',
      summary: `Battery ${state.batteryKwh.toFixed(1)}/${state.batteryMaxEffectiveKwh.toFixed(0)} kWh · ${avgDeficitHours} severe deficit hours.`,
    },
    {
      id: 'food',
      label: 'Food Availability',
      score: foodScore,
      weight: 0.1,
      status: foodScore >= 70 ? 'nominal' : foodScore >= 40 ? 'warning' : 'critical',
      summary: `${state.packagedFoodKg.toFixed(1)} kg rations left · ${state.greenhouseFoodProducedKg.toFixed(1)} kg grown in greenhouse.`,
    },
    {
      id: 'radiation',
      label: 'Radiation Protection',
      score: radScore,
      weight: 0.08,
      status: radScore >= 75 ? 'nominal' : radScore >= 45 ? 'warning' : 'critical',
      summary: `Cumulative dose ${state.cumulativeRadiationMsv.toFixed(1)} mSv (critical limit ${radLimit} mSv).`,
    },
    {
      id: 'exploration',
      label: 'Exploration Objectives',
      score: explorationScore,
      weight: 0.07,
      status: explorationScore >= 60 ? 'nominal' : explorationScore >= 25 ? 'warning' : 'critical',
      summary: `${state.rover.visitedWaypointIds.length}/${ROVER_WAYPOINTS.length} sites surveyed · ${state.rover.discoveredIceSites.length} water-ice prospects mapped.`,
    },
  ];

  // Weighted score with strict safety gate:
  // If crew died OR any critical safety pillar < 25, overall score is capped.
  const rawWeighted = categories.reduce((acc, c) => acc + c.score * c.weight, 0);
  const criticalSafetyFloor = Math.min(crewSafetyScore, atmosphereScore, radScore);

  let overallScore = Math.round(rawWeighted);
  if (!crewSurvived) {
    overallScore = Math.min(35, overallScore);
  } else if (criticalSafetyFloor < 35) {
    overallScore = Math.min(54, overallScore);
  }

  let outcomeGrade: MissionEvaluation['outcomeGrade'] = 'Mission Success';
  if (!crewSurvived || overallScore < 45) {
    outcomeGrade = 'Mission Failure';
  } else if (overallScore < 65 || criticalSafetyFloor < 55) {
    outcomeGrade = 'Mission Compromise';
  } else if (overallScore < 80) {
    outcomeGrade = 'Marginal Survival';
  }

  // Generate transparent educational debrief
  const lowestCat = [...categories].sort((a, b) => a.score - b.score)[0];
  const dayReached = Math.floor(state.hour / 24);

  const whatHappened = !crewSurvived
    ? `On Mission Day ${dayReached}, the outpost suffered a critical failure: ${state.failureReason}`
    : state.phase === 'completed'
    ? `Your 4-astronaut crew completed the full ${state.config.missionDurationDays}-day lunar outpost mission with ${state.crewHealthPct.toFixed(0)}% crew health, ${state.greenhouseFoodProducedKg.toFixed(1)} kg of harvested greenhouse food, and ${state.rover.visitedWaypointIds.length} explored surface sites.`
    : `Mission is currently in progress at Day ${dayReached} of ${state.config.missionDurationDays}. Lowest performing subsystem is ${lowestCat.label} (${lowestCat.score}/100).`;

  const whyItHappened = !crewSurvived
    ? `Failure occurred because interconnected resource buffers were depleted (${lowestCat.summary}). In closed-loop lunar habitats, a deficit in power or water cascades directly into oxygen and thermal failures.`
    : lowestCat.score < 70
    ? `${lowestCat.label} experienced sustained stress (${lowestCat.summary}), driven by competing electrical or water demands across life support, shielding, and agriculture.`
    : `Balanced load prioritization, proactive equipment maintenance, and timely radiation sheltering preserved stable reserves across all five subsystems.`;

  const engineeringPrinciple =
    lowestCat.id === 'atmosphere'
      ? 'Closed-Loop Mass Conservation (ECLSS): Oxygen electrolysis requires both water (1.125 kg H2O per kg O2) and electrical power, while CO2 scrubbing prevents hypercapnia even when O2 is abundant.'
      : lowestCat.id === 'energy'
      ? 'Energy Storage & Load Shedding: Lunar polar illumination still includes multi-day crater shadows; sizing battery reserves and prioritizing life support over optional loads prevents cascading blackouts.'
      : lowestCat.id === 'radiation'
      ? 'Hydrogen-Rich Radiation Attenuation: High-energy solar protons are slowed most effectively per unit mass by hydrogen-rich materials (water bladders) and thick in-situ regolith berms, plus rapid storm sheltering.'
      : lowestCat.id === 'food'
      ? 'Bioregenerative Crop Buffers: Space crops convert water and artificial light into edible biomass slowly over 7–14 days, supplementing packaged rations rather than replacing them instantaneously.'
      : lowestCat.id === 'water'
      ? 'Closed-Loop Water Recovery: Without >85% wastewater recycling, crew consumption, electrolysis, and plant transpiration rapidly exhaust finite initial lunar water tanks.'
      : 'Systems Integration & Safety Margins: Aerospace mission engineering prioritizes crew survivability and reserve margins above secondary science objectives.';

  const whatCouldBeDoneDifferently =
    lowestCat.score >= 85
      ? 'Try re-running the mission at De Gerlache Ridge or Mare Tranquillitatis (14-day lunar night) to test your power and battery management under harsher illumination constraints.'
      : lowestCat.id === 'energy'
      ? 'Clean lunar dust from solar arrays promptly, lower greenhouse lighting to 50–75% during crater shadow eclipses, and keep Life Support at Priority 1.'
      : lowestCat.id === 'radiation'
      ? 'Allocate water-wall shielding or construct lunar regolith berm bags early, and move the crew into the Storm Shelter as soon as a Solar Particle Event warning arrives.'
      : lowestCat.id === 'food'
      ? 'Plant fast-cycle Lettuce or Radishes in Bay 1 early for quick supplementation while growing high-calorie Dwarf Potatoes in Bays 2–3 when solar power is abundant.'
      : lowestCat.id === 'atmosphere'
      ? 'Keep O2 Electrolysis on Balanced mode, repair CO2 scrubbers as soon as amine-bed wear alerts appear, and reduce crew activity during power shortages.'
      : 'Monitor reserve margins before dispatching long rover traverses and maintain critical subsystem health above 70%.';

  return {
    overallScore,
    outcomeGrade,
    crewSurvived,
    categories,
    debrief: {
      whatHappened,
      whyItHappened,
      engineeringPrinciple,
      whatCouldBeDoneDifferently,
    },
  };
}

import type {
  CraterObstacle,
  CropDefinition,
  CropType,
  LunarSiteId,
  LunarSiteProfile,
  MissionConfig,
  RoverWaypoint,
} from './types';

export const TIMESTEP_HOURS = 1;

export const DEFAULT_MISSION_CONFIG: MissionConfig = {
  crewSize: 4,
  missionDurationDays: 30,
  timestepHours: TIMESTEP_HOURS,
  siteId: 'shackleton-rim',
  initialOxygenKg: 62, // ~18.4 days without electrolysis; requires active O2 regeneration
  maxOxygenKg: 140,
  emergencyOxygenReserveKg: 18,
  initialWaterLitres: 240,
  maxWaterLitres: 500,
  initialFoodKg: 60, // ~24.2 days packaged; greenhouse harvests needed for 30-day safety margin
  solarArrayPeakKw: 18.0,
  batteryCapacityKwh: 120,
  initialBatteryKwh: 96,
};

/**
 * Educational Scenario Parameters vs. Actual NASA Reference Baselines
 * Clearly distinguishes simplified classroom physics from flight-certified NASA ECLSS data.
 */
export const SCIENTIFIC_ASSUMPTIONS = {
  lifeSupport: {
    o2ConsumptionKgPerPersonDay: 0.84, // NASA ECLSS human metabolic baseline (~0.84 kg/person/day)
    co2ProductionKgPerPersonDay: 1.0, // NASA ECLSS baseline (~1.0 kg CO2/person/day)
    waterUseLitresPerPersonDay: 2.8, // Drinking + food prep + basic hygiene
    electrolysisWaterPerKgO2: 1.125, // Stoichiometric 2 H2O -> 2 H2 + O2 (18/16 = 1.125)
    electrolysisKwhPerKgO2: 5.8, // Simplified educational energy requirement incl. compression
    cabinVolumeM3: 180, // Pressurized research habitat volume
    nasaReference:
      'Metabolic O2 (0.84 kg/day) and CO2 (1.0 kg/day) align with NASA Human Integration Design Handbook (HIDH) nominal crew rates. Cabin ppm dynamics use a simplified well-mixed 180 m3 volume model.',
  },
  power: {
    batteryRoundTripEfficiency: 0.92, // 8% conversion/inverter loss
    baseHabitatKw: 2.4, // Avionics, thermal loops, communications, interior lighting
    scrubberPowerKw: 1.0,
    waterRecyclerPowerKw: 1.1,
    roverDockChargeKw: 2.5,
    nasaReference:
      'Lunar South Pole sites such as Shackleton Crater rim receive high illumination (~80%) compared to the 14-day equatorial lunar night, enabling smaller battery banks per NASA Lunar Surface Sustainability concepts.',
  },
  radiation: {
    nominalBackgroundMsvPerHour: 0.015, // ~0.36 mSv/day unshielded lunar surface GCR estimate
    spePeakMsvPerHour: 0.55, // Simplified Solar Particle Event unshielded flux
    careerCautionMsv: 50,
    criticalDoseMsv: 200,
    nasaReference:
      'Educational exponential attenuation model (Al, H2O, lunar regolith areal density). Real NASA missions compute particle transport using OLTARIS/HZETRN for secondary neutrons and tissue dose equivalents.',
  },
  agriculture: {
    foodKgPerPersonDay: 0.62, // Dry-mass equivalent food consumption (~2.48 kg/day for 4 crew)
    nasaReference:
      'Crop cycles (7–14 days) are accelerated for 30-day educational gameplay. Real lunar salad/crop experiments (e.g., NASA Veggie / Ohalo III) supplement packaged rations rather than replacing them outright.',
  },
  rover: {
    nominalSpeedKmPerHour: 3.5,
    baseEnergyKwhPerKm: 1.35,
    maxBatteryKwh: 45,
    commRangeKm: 12.0,
    nasaReference:
      'Inspired by NASA VIPER and Artemis LTV mobility concepts. Discovered water-ice prospects are scientific findings only; converting regolith ice into propellant or potable water requires dedicated ISRU excavation and thermal processing plants.',
  },
} as const;

export const LUNAR_SITE_PROFILES: Record<LunarSiteId, LunarSiteProfile> = {
  'shackleton-rim': {
    id: 'shackleton-rim',
    name: 'Shackleton Crater Rim (South Pole)',
    coordinates: '89.7° S, 129.2° E',
    description:
      'Elevated polar ridge with ~82% solar illumination and brief 36-hour shadow eclipses every 9 days.',
    avgIlluminationPct: 82,
    eclipseFrequencyLabel: 'Brief 36h shadow dips every ~9 days',
    getIllumination: (hour: number) => {
      const cycle = hour % 216; // 9-day quasi-polar solar cycle
      if (cycle >= 174 && cycle < 210) {
        // Gradual entry & exit into crater shadow
        const pos = (cycle - 174) / 36;
        const dip = Math.sin(pos * Math.PI);
        return Math.max(0.05, Number((0.92 - dip * 0.87).toFixed(3)));
      }
      // Subtle sun-angle oscillation along the rim
      return Number((0.88 + 0.1 * Math.sin((hour / 216) * Math.PI * 2)).toFixed(3));
    },
  },
  'de-gerlache': {
    id: 'de-gerlache',
    name: 'De Gerlache Ridge (South Pole)',
    coordinates: '88.5° S, 87.1° W',
    description:
      'Moderate polar illumination (~68%) with deeper 60-hour terrain shadows requiring disciplined battery storage.',
    avgIlluminationPct: 68,
    eclipseFrequencyLabel: '60h shadow periods every ~8 days',
    getIllumination: (hour: number) => {
      const cycle = hour % 192;
      if (cycle >= 124 && cycle < 184) {
        const pos = (cycle - 124) / 60;
        const dip = Math.sin(pos * Math.PI);
        return Math.max(0.0, Number((0.85 - dip * 0.85).toFixed(3)));
      }
      return Number((0.82 + 0.12 * Math.sin((hour / 192) * Math.PI * 2)).toFixed(3));
    },
  },
  'equatorial-ref': {
    id: 'equatorial-ref',
    name: 'Mare Tranquillitatis (Equatorial Reference)',
    coordinates: '0.7° N, 23.5° E',
    description:
      'Classic 14-day lunar day / 14-day lunar night cycle (50% average). Demonstrates why solar-only bases struggle at the equator.',
    avgIlluminationPct: 50,
    eclipseFrequencyLabel: '14 Earth days sunlight / 14 days darkness',
    getIllumination: (hour: number) => {
      // 708-hour synodic lunar day (~29.5 Earth days), start near lunar dawn
      const phase = ((hour + 24) % 708) / 708;
      if (phase > 0.5) return 0;
      return Number(Math.max(0, Math.sin(phase * 2 * Math.PI)).toFixed(3));
    },
  },
};

export const CROP_CATALOG: Record<CropType, CropDefinition> = {
  lettuce: {
    id: 'lettuce',
    name: 'Outredgeous Lettuce',
    growthHours: 168, // 7 Earth days (accelerated educational cycle)
    yieldDryKg: 2.6,
    waterLitresPerHour: 0.14,
    powerKwAtFullLight: 1.0,
    moraleBonus: 6,
    description:
      'Fast-growing leafy crop used in ISS Veggie studies. Low power draw and boosts crew morale quickly.',
  },
  radish: {
    id: 'radish',
    name: 'Cherry Belle Radish',
    growthHours: 216, // 9 Earth days
    yieldDryKg: 3.8,
    waterLitresPerHour: 0.18,
    powerKwAtFullLight: 1.25,
    moraleBonus: 5,
    description:
      'Reliable root-and-leaf crop with moderate lighting demand and balanced calorie-to-water efficiency.',
  },
  soybean: {
    id: 'soybean',
    name: 'Dwarf Soybean',
    growthHours: 288, // 12 Earth days
    yieldDryKg: 5.4,
    waterLitresPerHour: 0.24,
    powerKwAtFullLight: 1.6,
    moraleBonus: 4,
    description:
      'Protein-rich legume requiring consistent lighting and nutrients for higher edible dry mass.',
  },
  potato: {
    id: 'potato',
    name: 'Dwarf Lunar Potato',
    growthHours: 336, // 14 Earth days
    yieldDryKg: 8.2,
    waterLitresPerHour: 0.28,
    powerKwAtFullLight: 1.9,
    moraleBonus: 7,
    description:
      'High-calorie staple crop. Demands substantial artificial lighting and water over a 2-week growth window.',
  },
};

export const ROVER_WAYPOINTS: RoverWaypoint[] = [
  {
    id: 'wp-ridge-overlook',
    name: 'Shackleton Rim Overlook',
    x: 2.8,
    y: -1.8,
    elevationM: 420,
    terrainDifficulty: 1.1,
    scienceValue: 15,
    hasPotentialWaterIce: false,
    hasRegolithDeposit: false,
    description:
      'High-elevation ridge ideal for solar horizon surveying and Earth direct-line communications testing.',
  },
  {
    id: 'wp-regolith-quarry',
    name: 'Basalt Regolith Quarry',
    x: -3.4,
    y: -2.2,
    elevationM: 120,
    terrainDifficulty: 1.25,
    scienceValue: 18,
    hasPotentialWaterIce: false,
    hasRegolithDeposit: true,
    description:
      'Loose fine-grained regolith apron suited for studying radiation-shielding sintering and berm construction.',
  },
  {
    id: 'wp-ice-alpha',
    name: 'PSR Frost Prospect Alpha',
    x: 5.2,
    y: 4.1,
    elevationM: -280,
    terrainDifficulty: 1.65,
    scienceValue: 30,
    hasPotentialWaterIce: true,
    hasRegolithDeposit: false,
    description:
      'Margin of a permanently shadowed depression showing neutron-spectrometer hydrogen signatures.',
  },
  {
    id: 'wp-comms-beacon',
    name: 'Malapert Relay Knoll',
    x: -5.8,
    y: 3.4,
    elevationM: 580,
    terrainDifficulty: 1.4,
    scienceValue: 20,
    hasPotentialWaterIce: false,
    hasRegolithDeposit: false,
    description:
      'Elevated knoll used to map multi-hop radio propagation across polar crater walls.',
  },
  {
    id: 'wp-ice-beta',
    name: 'De Gerlache Ice Trench',
    x: -1.8,
    y: 7.4,
    elevationM: -410,
    terrainDifficulty: 1.9,
    scienceValue: 35,
    hasPotentialWaterIce: true,
    hasRegolithDeposit: true,
    description:
      'Deep polar shadow edge with high-priority subsurface water-ice indicators. Steep slopes increase wheel wear.',
  },
  {
    id: 'wp-ejecta-field',
    name: 'Anorthosite Ejecta Field',
    x: 7.6,
    y: -4.6,
    elevationM: 210,
    terrainDifficulty: 1.75,
    scienceValue: 25,
    hasPotentialWaterIce: false,
    hasRegolithDeposit: true,
    description:
      'Ancient highland crust boulders ejected from nearby impacts; prime target for geological core sampling.',
  },
];

export const LUNAR_CRATERS: CraterObstacle[] = [
  {
    id: 'crater-1',
    name: 'Shackleton Inner Pit',
    x: 2.2,
    y: 2.6,
    radiusKm: 1.5,
    permanentlyShadowed: true,
  },
  {
    id: 'crater-2',
    name: 'West Shadow Bowl',
    x: -3.2,
    y: 1.1,
    radiusKm: 1.3,
    permanentlyShadowed: true,
  },
  {
    id: 'crater-3',
    name: 'South Ejecta Basin',
    x: 4.1,
    y: -3.2,
    radiusKm: 1.2,
    permanentlyShadowed: false,
  },
  {
    id: 'crater-4',
    name: 'Polar Cold Trap',
    x: -0.4,
    y: 5.1,
    radiusKm: 1.4,
    permanentlyShadowed: true,
  },
];

export const NASA_REFERENCES = [
  {
    title: 'NASA Lunar Surface Technology',
    url: 'https://www.nasa.gov/lunar-surface-technology/',
    topic: 'Dust mitigation, surface power, and extreme polar thermal environments',
  },
  {
    title: 'NASA Moonbase Systems',
    url: 'https://www.nasa.gov/moonbase-systems/',
    topic: 'ECLSS air/water loops, pressurized habitats, and crew safety systems',
  },
  {
    title: 'NASA In-Situ Resource Utilization (ISRU)',
    url: 'https://www.nasa.gov/overview-in-situ-resource-utilization/',
    topic: 'Prospecting lunar polar water-ice and regolith processing constraints',
  },
  {
    title: 'NASA Lunar Surface Sustainability Concept',
    url: 'https://www.nasa.gov/general/nasa-outlines-lunar-surface-sustainability-concept/',
    topic: 'Artemis Base Camp architecture, surface mobility, and long-duration ops',
  },
] as const;

// PAL (Physical Activity Level) & Metabolic Calculator based on METs
// Calculates BMR, NEAT, EAT, TEF and personalized macro/calorie targets.

// Standard MET values (Compendium of Physical Activities)
const ACTIVITY_METS = {
  // Alltag & Hausarbeit
  house_cleaning: 3.3,    // Haus putzen / Saugen
  dishwashing: 2.3,       // Geschirrspülen / Küche
  cooking: 2.5,           // Kochen
  gardening: 3.8,         // Gartenarbeit
  standing_work: 2.0,     // Stehende Arbeit / Verkauf
  desk_work: 1.3,         // Büro / Sitzen
  
  // Sportarten & Training
  weightlifting: 5.5,     // Krafttraining / Gym
  heavy_weightlifting: 6.0,
  walking: 3.5,           // Spazieren
  running: 8.5,           // Joggen
  sprinting: 12.0,
  boxing_mma: 9.0,        // Boxen / Kampfsport
  swimming: 7.0,          // Schwimmen
  cycling: 6.5,           // Radfahren
  soccer: 8.0,            // Fußball
  basketball: 7.5,
  hiit: 8.5
};

// Calculate Basal Metabolic Rate (Mifflin-St Jeor)
function calculateBMR(weightKg, heightCm, age = 25, isMale = true) {
  if (isMale) {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
}

// Calculate true daily PAL from steps, sport and daily chores
function calculateDailyCalorieTarget({
  weightKg = 78,
  heightCm = 180,
  age = 25,
  isMale = true,
  dailySteps = 10000,
  weeklyChoresHours = 5,   // Putzen, Spülen etc.
  weeklySportsHours = 4,   // Krafttraining etc.
  goal = 'recomposition'   // 'fat_loss' | 'muscle_gain' | 'recomposition'
}) {
  const bmr = calculateBMR(weightKg, heightCm, age, isMale);

  // Calorie expenditure from steps (approx 0.04 kcal per step for avg person)
  const stepsCalories = Math.round(dailySteps * 0.04);

  // Daily chore expenditure (MET ~ 3.0 -> extra ~120 kcal per hour)
  const dailyChoreHours = weeklyChoresHours / 7;
  const choresCalories = Math.round(dailyChoreHours * 130);

  // Daily sports expenditure (MET ~ 6.5 -> extra ~400 kcal per hour)
  const dailySportsHours = weeklySportsHours / 7;
  const sportsCalories = Math.round(dailySportsHours * 420);

  // Total Daily Energy Expenditure (TDEE)
  const tdee = Math.round(bmr + stepsCalories + choresCalories + sportsCalories);
  const pal = Math.round((tdee / bmr) * 100) / 100;

  let targetCalories = tdee;
  if (goal === 'fat_loss') {
    targetCalories = Math.round(tdee * 0.82); // 18% Deficit
  } else if (goal === 'muscle_gain') {
    targetCalories = Math.round(tdee * 1.10); // 10% Surplus
  }

  // Primal Ancestral Macro Distribution (High Protein, High Quality Fat, Moderate Carb)
  const targetProteinGrams = Math.round(weightKg * 2.2); // 2.2g per kg
  const proteinCalories = targetProteinGrams * 4;

  const remainingCalories = targetCalories - proteinCalories;
  const targetFatGrams = Math.round((remainingCalories * 0.60) / 9);
  const targetCarbsGrams = Math.round((remainingCalories * 0.40) / 4);

  return {
    bmr,
    tdee,
    pal,
    targetCalories,
    macros: {
      protein: `${targetProteinGrams}g`,
      fat: `${targetFatGrams}g`,
      carbs: `${targetCarbsGrams}g`
    },
    breakdown: {
      stepsCalories,
      choresCalories,
      sportsCalories
    }
  };
}

module.exports = {
  ACTIVITY_METS,
  calculateBMR,
  calculateDailyCalorieTarget
};

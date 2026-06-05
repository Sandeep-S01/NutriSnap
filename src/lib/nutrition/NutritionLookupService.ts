import { NutritionData } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { logTracker } from '@/lib/logger';

// Seed reference database of standard meals for local fallback retrieval
export const NUTRITION_REFERENCE_DATABASE: NutritionData[] = [
  {
    food_name: 'Avocado Toast with Poached Egg',
    description: 'Toasted sourdough topped with smashed avocado, a poached egg, chili flakes, and microgreens.',
    confidence: 1.0, calories: 410, protein: 18, carbs: 36, fat: 22, fiber: 7,
    vitamins: { 'Sodium': '420mg', 'Potassium': '580mg', 'Iron': '3.2mg', 'Vitamin A': '28mcg', 'Vitamin B': '1.2mg', 'Vitamin C': '8mg', 'Vitamin D': '3mcg' },
    sugar: 3, sodium: 420, potassium: 580, iron: 3.2, vitamin_a: 28, vitamin_b: 1.2, vitamin_c: 8, vitamin_d: 3
  },
  {
    food_name: 'Grilled Chicken Caesar Salad',
    description: 'Romaine lettuce with grilled chicken breast, parmesan shavings, croutons, and Caesar dressing.',
    confidence: 1.0, calories: 380, protein: 42, carbs: 18, fat: 16, fiber: 4,
    vitamins: { 'Sodium': '780mg', 'Potassium': '440mg', 'Iron': '2.8mg', 'Vitamin A': '960mcg', 'Vitamin B': '0.8mg', 'Vitamin C': '24mg', 'Vitamin D': '1mcg' },
    sugar: 2, sodium: 780, potassium: 440, iron: 2.8, vitamin_a: 960, vitamin_b: 0.8, vitamin_c: 24, vitamin_d: 1
  },
  {
    food_name: 'Margherita Pizza (2 slices)',
    description: 'Classic Neapolitan pizza with tomato sauce, fresh mozzarella, and basil leaves.',
    confidence: 1.0, calories: 560, protein: 22, carbs: 68, fat: 20, fiber: 3,
    vitamins: { 'Sodium': '890mg', 'Potassium': '310mg', 'Iron': '3.5mg', 'Vitamin A': '240mcg', 'Vitamin B': '0.4mg', 'Vitamin C': '8mg', 'Vitamin D': '0.5mcg' },
    sugar: 5, sodium: 890, potassium: 310, iron: 3.5, vitamin_a: 240, vitamin_b: 0.4, vitamin_c: 8, vitamin_d: 0.5
  },
  {
    food_name: 'Acai Smoothie Bowl',
    description: 'Blended acai topped with granola, banana slices, mixed berries, and honey drizzle.',
    confidence: 1.0, calories: 480, protein: 9, carbs: 82, fat: 14, fiber: 11,
    vitamins: { 'Sodium': '85mg', 'Potassium': '680mg', 'Iron': '2.1mg', 'Vitamin A': '48mcg', 'Vitamin B': '1.8mg', 'Vitamin C': '48mg', 'Vitamin D': '0mcg' },
    sugar: 38, sodium: 85, potassium: 680, iron: 2.1, vitamin_a: 48, vitamin_b: 1.8, vitamin_c: 48, vitamin_d: 0
  },
  {
    food_name: 'Salmon Teriyaki Bowl',
    description: 'Pan-seared salmon fillet with steamed rice, edamame, cucumber, and teriyaki glaze.',
    confidence: 1.0, calories: 620, protein: 48, carbs: 58, fat: 18, fiber: 5,
    vitamins: { 'Sodium': '920mg', 'Potassium': '840mg', 'Iron': '4.2mg', 'Vitamin A': '54mcg', 'Vitamin B': '4.2mg', 'Vitamin C': '2mg', 'Vitamin D': '18mcg' },
    sugar: 12, sodium: 920, potassium: 840, iron: 4.2, vitamin_a: 54, vitamin_b: 4.2, vitamin_c: 2, vitamin_d: 18
  },
  {
    food_name: 'Greek Yogurt Parfait',
    description: 'Layered Greek yogurt with wild blueberries, strawberries, walnuts, and a drizzle of honey.',
    confidence: 1.0, calories: 320, protein: 24, carbs: 38, fat: 8, fiber: 4,
    vitamins: { 'Sodium': '95mg', 'Potassium': '520mg', 'Iron': '1.4mg', 'Vitamin A': '110mcg', 'Vitamin B': '1.4mg', 'Vitamin C': '22mg', 'Vitamin D': '3mcg' },
    sugar: 22, sodium: 95, potassium: 520, iron: 1.4, vitamin_a: 110, vitamin_b: 1.4, vitamin_c: 22, vitamin_d: 3
  },
  {
    food_name: 'Quinoa & Roasted Veggie Bowl',
    description: 'Fluffy quinoa with roasted sweet potato, chickpeas, red onion, and tahini dressing.',
    confidence: 1.0, calories: 490, protein: 18, carbs: 72, fat: 14, fiber: 13,
    vitamins: { 'Sodium': '320mg', 'Potassium': '710mg', 'Iron': '4.8mg', 'Vitamin A': '540mcg', 'Vitamin B': '1.5mg', 'Vitamin C': '18mg', 'Vitamin D': '0mcg' },
    sugar: 8, sodium: 320, potassium: 710, iron: 4.8, vitamin_a: 540, vitamin_b: 1.5, vitamin_c: 18, vitamin_d: 0
  },
  {
    food_name: 'Beef Burger with Fries',
    description: 'Juicy beef patty in a brioche bun with lettuce, tomato, cheese, and a side of crispy fries.',
    confidence: 1.0, calories: 860, protein: 38, carbs: 88, fat: 40, fiber: 6,
    vitamins: { 'Sodium': '1150mg', 'Potassium': '740mg', 'Iron': '5.2mg', 'Vitamin A': '120mcg', 'Vitamin B': '3.8mg', 'Vitamin C': '4mg', 'Vitamin D': '0.2mcg' },
    sugar: 9, sodium: 1150, potassium: 740, iron: 5.2, vitamin_a: 120, vitamin_b: 3.8, vitamin_c: 4, vitamin_d: 0.2
  },
];

export class NutritionLookupService {
  /**
   * Looks up a food name case-insensitively using fuzzy search.
   * Checks Supabase foods table if initialized, falls back to local reference database.
   */
  public static async lookup(detectedFoodName: string): Promise<NutritionData | null> {
    logTracker.debug(`NutritionLookupService: Querying reference databases for "${detectedFoodName}"...`);
    const cleanName = detectedFoodName.trim().toLowerCase();

    // 1. Supabase Check
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('foods')
          .select('*')
          .ilike('food_name', `%${cleanName}%`)
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const dbRow = data[0];
          logTracker.info(`NutritionLookupService: Database Cache Hit for "${dbRow.food_name}"`);
          return {
            food_name: dbRow.food_name,
            calories: dbRow.calories,
            protein: Number(dbRow.protein),
            carbs: Number(dbRow.carbs),
            fat: Number(dbRow.fat),
            fiber: Number(dbRow.fiber),
            description: dbRow.description || '',
            confidence: 0.98,
            vitamins: {
              'Sodium': `${dbRow.sodium}mg`,
              'Potassium': `${dbRow.potassium}mg`,
              'Iron': `${dbRow.iron}mg`,
              'Vitamin A': `${dbRow.vitamin_a}mcg`,
              'Vitamin B': `${dbRow.vitamin_b}mg`,
              'Vitamin C': `${dbRow.vitamin_c}mg`,
              'Vitamin D': `${dbRow.vitamin_d}mcg`,
            },
            sugar: Number(dbRow.sugar),
            sodium: Number(dbRow.sodium),
            potassium: Number(dbRow.potassium),
            iron: Number(dbRow.iron),
            vitamin_a: Number(dbRow.vitamin_a),
            vitamin_b: Number(dbRow.vitamin_b),
            vitamin_c: Number(dbRow.vitamin_c),
            vitamin_d: Number(dbRow.vitamin_d),
          };
        }
      } catch (dbErr) {
        logTracker.apiError('NutritionLookupService.lookup [db]', dbErr);
      }
    }

    // 2. Static Fallback Check
    const localMatch = NUTRITION_REFERENCE_DATABASE.find((item) => {
      const itemTitle = item.food_name.toLowerCase();
      return (
        itemTitle === cleanName ||
        itemTitle.includes(cleanName) ||
        cleanName.includes(itemTitle)
      );
    });

    if (localMatch) {
      logTracker.info(`NutritionLookupService: Local Cache Hit for "${localMatch.food_name}"`);
      return {
        ...localMatch,
        confidence: 0.98,
      };
    }

    logTracker.info(`NutritionLookupService: Cache Miss for "${detectedFoodName}"`);
    return null;
  }
}

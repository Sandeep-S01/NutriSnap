import OpenAI from 'openai';
import { NutritionData } from '@/lib/openai';
import { FoodDetectionService } from './FoodDetectionService';
import { NutritionLookupService, NUTRITION_REFERENCE_DATABASE } from './NutritionLookupService';
import { logTracker } from '@/lib/logger';

export class AnalysisService {
  private static getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'demo') {
      throw new Error('OpenAI API key is missing or set to demo mode');
    }
    return new OpenAI({ apiKey });
  }

  /**
   * Main orchestrator to analyze food image with optimal cost & caching.
   * Image -> Food name detection (Cheap GPT-4o-mini) -> DB lookup -> Fallback GPT calculation
   */
  public static async analyze(base64Image?: string, imageUrl?: string, fileName?: string): Promise<NutritionData> {
    logTracker.info('Starting AnalysisService workflow...');
    
    // Step 1: Detect food name & confidence
    const detection = await FoodDetectionService.detect(base64Image, imageUrl, fileName);
    
    // Step 2: If confidence is high, try local database reference lookup
    if (detection.confidence >= 0.90) {
      logTracker.info(`High detection confidence (${Math.round(detection.confidence * 100)}%). Checking reference DB...`);
      const cachedNutrition = await NutritionLookupService.lookup(detection.food_name);
      
      if (cachedNutrition) {
        logTracker.info(`Cache Hit: Using database reference nutrition for "${cachedNutrition.food_name}"`);
        return {
          ...cachedNutrition,
          confidence: detection.confidence // Merge original vision detection confidence
        };
      }
    } else {
      logTracker.warn(`Low detection confidence (${Math.round(detection.confidence * 100)}%). Bypassing database lookup.`);
    }

    // Step 3: Fallback - Request full calculation from gpt-4o-mini using JSON Schema
    logTracker.info(`Cache Miss/Low Confidence: Requesting full OpenAI nutrition analysis for "${detection.food_name}"`);
    return this.calculateNutritionFallback(base64Image, imageUrl, detection.food_name);
  }

  /**
   * Mock endpoint logic when running in local offline/test demo mode.
   */
  public static async analyzeDemo(fileName?: string): Promise<NutritionData> {
    logTracker.info(`Running in Demo Mode: analyzing filename "${fileName || 'none'}"`);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    let selectedFood = NUTRITION_REFERENCE_DATABASE[Math.floor(Math.random() * NUTRITION_REFERENCE_DATABASE.length)];

    if (fileName) {
      const cleanFileName = fileName.toLowerCase();
      // Look for matches in the reference database
      const matches = NUTRITION_REFERENCE_DATABASE.filter(food => {
        const nameLower = food.food_name.toLowerCase();
        
        // Split name into words (e.g. "avocado", "toast", "egg")
        const words = nameLower.split(/[\s&()\-+,/]+/);
        return words.some(word => {
          if (word.length <= 2) return false;
          if (['with', 'for', 'and', 'the'].includes(word)) return false;
          return cleanFileName.includes(word);
        });
      });

      if (matches.length > 0) {
        selectedFood = matches[0];
        logTracker.info(`Demo Mode Match Found: filename "${fileName}" matched reference food "${selectedFood.food_name}"`);
      } else {
        logTracker.info(`Demo Mode: No keyword match for filename "${fileName}". Falling back to random food.`);
      }
    }

    return {
      ...selectedFood,
      _demo: true
    };
  }

  /**
   * Requests a full nutritional analysis from gpt-4o-mini for fallback.
   */
  private static async calculateNutritionFallback(
    base64Image?: string,
    imageUrl?: string,
    foodName?: string
  ): Promise<NutritionData> {
    try {
      const openai = this.getClient();
      
      const imagePayload = imageUrl
        ? { url: imageUrl }
        : { url: `data:image/jpeg;base64,${base64Image}`, detail: 'auto' };

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a professional nutritionist. Analyze this food image, which is identified as "${foodName}". Provide a complete nutritional breakdown per serving, including calories (kcal), macros (g), fiber (g), sugar (g), sodium (mg), potassium (mg), iron (mg), vitamin_a (mcg), vitamin_b (mg), vitamin_c (mg), vitamin_d (mcg), description, and 3-5 vitamins/minerals in the vitamins dictionary map.`
              },
              {
                type: 'image_url',
                image_url: imagePayload
              }
            ]
          }
        ] as any,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'nutrition_analysis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                food_name: { type: 'string', description: 'Name of the analyzed dish.' },
                description: { type: 'string', description: 'Brief description of the meal.' },
                confidence: { type: 'number', description: 'Confidence level between 0.0 and 1.0.' },
                calories: { type: 'integer', description: 'Calories in kcal.' },
                protein: { type: 'number', description: 'Protein content in grams.' },
                carbs: { type: 'number', description: 'Carbohydrates content in grams.' },
                fat: { type: 'number', description: 'Fat content in grams.' },
                fiber: { type: 'number', description: 'Dietary fiber content in grams.' },
                sugar: { type: 'number', description: 'Total sugar content in grams.' },
                sodium: { type: 'number', description: 'Sodium content in milligrams (mg).' },
                potassium: { type: 'number', description: 'Potassium content in milligrams (mg).' },
                iron: { type: 'number', description: 'Iron content in milligrams (mg).' },
                vitamin_a: { type: 'number', description: 'Vitamin A content in micrograms (mcg).' },
                vitamin_b: { type: 'number', description: 'Vitamin B content in milligrams (mg).' },
                vitamin_c: { type: 'number', description: 'Vitamin C content in milligrams (mg).' },
                vitamin_d: { type: 'number', description: 'Vitamin D content in micrograms (mcg).' },
                vitamins: {
                  type: 'object',
                  description: 'Vitamins and minerals mapped to their quantities as strings (e.g., Sodium: 15mg).',
                  additionalProperties: { type: 'string' }
                }
              },
              required: [
                'food_name', 'description', 'confidence', 'calories', 'protein', 'carbs', 'fat', 'fiber',
                'sugar', 'sodium', 'potassium', 'iron', 'vitamin_a', 'vitamin_b', 'vitamin_c', 'vitamin_d', 'vitamins'
              ],
              additionalProperties: false
            }
          }
        },
        max_tokens: 400,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty response from OpenAI for fallback nutrition calculation');
      }

      const result: NutritionData = JSON.parse(content);
      logTracker.info(`Fallback Calculation Completed: "${result.food_name}" (${result.calories} kcal)`);
      return result;

    } catch (error: unknown) {
      logTracker.openAiError('AnalysisService.calculateNutritionFallback', error);
      throw error;
    }
  }
}

import OpenAI from 'openai';
import { logTracker } from '@/lib/logger';

export interface DetectionResult {
  food_name: string;
  confidence: number;
}

export class FoodDetectionService {
  private static getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'demo') {
      throw new Error('OpenAI API key is missing or set to demo mode');
    }
    return new OpenAI({ apiKey });
  }

  /**
   * Identifies the name of the food and the confidence rating from a base64 image or a remote URL.
   * Uses cheap, fast gpt-4o-mini model with structured outputs.
   */
  public static async detect(base64Image?: string, imageUrl?: string, fileName?: string): Promise<DetectionResult> {
    logTracker.debug('Invoking OpenAI gpt-4o-mini for food name detection...');
    try {
      const openai = this.getClient();
      
      const imagePayload = imageUrl
        ? { url: imageUrl }
        : { url: `data:image/jpeg;base64,${base64Image}`, detail: 'auto' };

      const promptText = 'Analyze the food in this image. Identify the name of the dish as clearly as possible, and provide a confidence rating between 0.0 and 1.0 (where 1.0 is extremely certain and 0.0 is completely uncertain).\n' +
        'Pay close attention to textures, breading, shape, and structures to avoid misidentifying similar-looking fried foods (e.g. distinguishing fish fry from french fries, potato wedges, or potato fries).' +
        (fileName ? `\n\nContext: The image file was uploaded with the filename "${fileName}". If this filename contains descriptive terms of food items (e.g., "fish_fry"), use it as a helpful contextual hint to disambiguate the visual identification, but ignore it if the filename is generic (like "camera-capture.webp", "image.png") or clearly contradicts the actual image contents.` : '');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
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
            name: 'food_detection',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                food_name: {
                  type: 'string',
                  description: 'The identified name of the dish or food item.'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence rating of the identification between 0.0 and 1.0.'
                }
              },
              required: ['food_name', 'confidence'],
              additionalProperties: false
            }
          }
        },
        max_tokens: 150,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty response from OpenAI Vision API');
      }

      const result: DetectionResult = JSON.parse(content);
      logTracker.info(`FoodDetectionService: Identified "${result.food_name}" with ${Math.round(result.confidence * 100)}% confidence`);
      return result;

    } catch (error: unknown) {
      logTracker.openAiError('FoodDetectionService.detect', error);
      throw error;
    }
  }
}

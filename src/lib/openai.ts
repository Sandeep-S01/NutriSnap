export interface NutritionData {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamins: Record<string, string>;
  description: string;
  confidence: number;
  _demo?: boolean;

  // Expanded micronutrients
  sugar?: number;
  sodium?: number;
  potassium?: number;
  iron?: number;
  vitamin_a?: number;
  vitamin_b?: number;
  vitamin_c?: number;
  vitamin_d?: number;
}

export async function analyzeFoodImage(base64Image: string, imageUrl?: string, fileName?: string): Promise<NutritionData> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, imageUrl, fileName }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Analysis failed');
  }

  return response.json();
}

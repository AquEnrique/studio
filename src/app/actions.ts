'use server';

import { validateDeck, type DeckValidationInput, type DeckValidationOutput } from '@/ai/flows/deck-validation';

export async function getDeckValidation(input: DeckValidationInput): Promise<DeckValidationOutput> {
  try {
    const result = await validateDeck(input);
    return result;
  } catch (error) {
    console.error("Error calling validateDeck flow:", error);
    // Provide a default error response
    return {
      isValid: false,
      feedback: "There was an error validating your deck. The AI service may be unavailable. Please try again later."
    };
  }
}

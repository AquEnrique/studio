// src/ai/flows/deck-validation.ts
'use server';

/**
 * @fileOverview Provides real-time feedback on Yu-Gi-Oh! deck composition.
 *
 * - validateDeck - Validates the deck and provides feedback.
 * - DeckValidationInput - Input schema for deck validation.
 * - DeckValidationOutput - Output schema for deck validation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DeckValidationInputSchema = z.object({
  mainDeckSize: z
    .number()
    .describe('The number of cards in the main deck.')
    .min(0),
  extraDeckSize: z
    .number()
    .describe('The number of cards in the extra deck.')
    .min(0),
  sideDeckSize: z
    .number()
    .describe('The number of cards in the side deck.')
    .min(0),
});
export type DeckValidationInput = z.infer<typeof DeckValidationInputSchema>;

const DeckValidationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the deck is valid or not.'),
  feedback: z.string().describe('Feedback on the deck composition.'),
});
export type DeckValidationOutput = z.infer<typeof DeckValidationOutputSchema>;

export async function validateDeck(input: DeckValidationInput): Promise<DeckValidationOutput> {
  return validateDeckFlow(input);
}

const prompt = ai.definePrompt({
  name: 'deckValidationPrompt',
  input: {schema: DeckValidationInputSchema},
  output: {schema: DeckValidationOutputSchema},
  prompt: `You are an expert Yu-Gi-Oh! deck validator. Given the sizes of the main, extra, and side decks, determine if the deck is valid.

Main Deck Size: {{{mainDeckSize}}}
Extra Deck Size: {{{extraDeckSize}}}
Side Deck Size: {{{sideDeckSize}}}

Main deck must have between 40 and 60 cards. Extra deck must have at most 15 cards. Side deck must have at most 15 cards.

Respond with whether the deck is valid, and provide feedback on the deck composition.  The feedback should be a single paragraph.
`,
});

const validateDeckFlow = ai.defineFlow(
  {
    name: 'validateDeckFlow',
    inputSchema: DeckValidationInputSchema,
    outputSchema: DeckValidationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

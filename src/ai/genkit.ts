import { genkit } from 'genkit';

/**
 * Genkit instance for flow orchestration.
 * This file is strictly for orchestration and contains NO hardcoded API keys.
 * All AI completions are handled via the direct Groq SDK using environment variables.
 */
export const ai = genkit({
  plugins: [], 
});

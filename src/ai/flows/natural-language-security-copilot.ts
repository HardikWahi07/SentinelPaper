'use server';
/**
 * @fileOverview Natural Language Security Copilot Flow.
 * 
 * Uses Groq SDK directly to answer security queries based on context provided by the client.
 * This ensures compliance with client-only Firebase restrictions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { groq } from '@/lib/groq';

const CopilotInputSchema = z.object({
  query: z.string(),
  context: z.string().optional().describe("Live security context and system metrics passed from the client."),
});
export type NaturalLanguageSecurityCopilotInput = z.infer<typeof CopilotInputSchema>;

const CopilotOutputSchema = z.object({
  response: z.string(),
});
export type NaturalLanguageSecurityCopilotOutput = z.infer<typeof CopilotOutputSchema>;

export async function naturalLanguageSecurityCopilot(
  input: NaturalLanguageSecurityCopilotInput
): Promise<NaturalLanguageSecurityCopilotOutput> {
  return copilotFlow(input);
}

const copilotFlow = ai.defineFlow(
  {
    name: 'copilotFlow',
    inputSchema: CopilotInputSchema,
    outputSchema: CopilotOutputSchema,
  },
  async (input) => {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are the Sentinel Security Copilot, an advanced AI specialized in forensic security analysis. Use the provided context to answer the user query professionally. If no context is provided, rely on your internal knowledge base but remind the user that live node data is unavailable.',
        },
        {
          role: 'user',
          content: `
LIVE SECURITY CONTEXT PROVIDED BY CLIENT:
${input.context || "No live context provided."}

USER QUERY: 
${input.query}
`,
        },
      ],
    });

    return {
      response: completion.choices[0].message.content || 'I encountered an error synthesizing the security data.'
    };
  }
);

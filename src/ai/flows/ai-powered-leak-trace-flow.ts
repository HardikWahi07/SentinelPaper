
'use server';
/**
 * @fileOverview AI-Powered Leak Trace Flow.
 * 
 * Uses Groq SDK directly to analyze documents for forensic watermarks.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { groq } from '@/lib/groq';

const LeakTraceInputSchema = z.object({
  leakedDocumentImage: z.string().describe("Base64 encoded image data"),
  internalRecords: z.string(),
});
export type LeakTraceInput = z.infer<typeof LeakTraceInputSchema>;

const LeakTraceOutputSchema = z.object({
  identifiedWatermarks: z.array(z.string()),
  leakSource: z.string(),
  confidenceScore: z.number(),
  reportDetails: z.string(),
});
export type LeakTraceOutput = z.infer<typeof LeakTraceOutputSchema>;

export async function traceLeak(input: LeakTraceInput): Promise<LeakTraceOutput> {
  return traceLeakFlow(input);
}

const traceLeakFlow = ai.defineFlow(
  {
    name: 'traceLeakFlow',
    inputSchema: LeakTraceInputSchema,
    outputSchema: LeakTraceOutputSchema,
  },
  async (input) => {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert security analyst specializing in forensic document analysis. Analyze provided evidence and records to identify leak sources. Return a JSON object.',
        },
        {
          role: 'user',
          content: `
Analyze the following security context:
Internal Records for Correlation:
${input.internalRecords}

Evidence (Document Data): 
${input.leakedDocumentImage.substring(0, 100)}... [Data truncated]

Return JSON format:
{
  "identifiedWatermarks": ["list", "of", "codes"],
  "leakSource": "Probable User/Center",
  "confidenceScore": 0.95,
  "reportDetails": "Detailed narrative"
}
`,
        },
      ],
    });

    const content = completion.choices[0].message.content || '{}';
    return JSON.parse(content);
  }
);


'use server';
/**
 * @fileOverview Secure Exam Generation Flow.
 * 
 * Uses Groq SDK directly to generate MCQs with forensic watermarking.
 * Integrated with the Sentinel Forensic Service for QR generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import crypto from 'crypto';
import { groq } from '@/lib/groq';
import { generateForensicWatermark } from '@/lib/forensics';

const ExamGenerationInputSchema = z.object({
  subject: z.string(),
  difficulty: z.string(),
  questionCount: z.number(),
  timeLimit: z.number(),
  centerId: z.string(),
});
export type ExamGenerationInput = z.infer<typeof ExamGenerationInputSchema>;

const ExamGenerationOutputSchema = z.object({
  batchId: z.string(),
  title: z.string(),
  centerId: z.string(),
  watermark: z.string(),
  qrDataUri: z.string(),
  generatedAt: z.string(),
  timeLimit: z.number(),
  questions: z.array(z.object({
    id: z.number(),
    text: z.string(),
    options: z.array(z.string()),
    correctAnswerIndex: z.number(),
  })),
});
export type ExamGenerationOutput = z.infer<typeof ExamGenerationOutputSchema>;

export async function generateExam(input: ExamGenerationInput): Promise<ExamGenerationOutput> {
  return generateExamFlow(input);
}

const generateExamFlow = ai.defineFlow(
  {
    name: 'generateExamFlow',
    inputSchema: ExamGenerationInputSchema,
    outputSchema: ExamGenerationOutputSchema,
  },
  async (input) => {
    // 1. Generate the questions using Groq
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an elite examination paper setter for high-stakes government certifications. Generate a professional MCQ paper in JSON format.',
        },
        {
          role: 'user',
          content: `
Generate exactly ${input.questionCount} multiple choice questions.
Subject: ${input.subject}
Difficulty: ${input.difficulty}

The output MUST be valid JSON with a "title" and a "questions" array of objects.
Each question object must have: id, text, options (array of 4), and correctAnswerIndex.
`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    
    // 2. Generate forensic identifiers
    const batchId = `SENTINEL-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    
    // 3. Generate the forensic signature and scannable QR code (the "FastAPI" equivalent logic)
    const forensics = await generateForensicWatermark(batchId, input.centerId);

    return {
      batchId,
      title: parsed.title || `${input.subject} Examination`,
      centerId: input.centerId,
      watermark: forensics.hash,
      qrDataUri: forensics.qrDataUri,
      generatedAt: forensics.timestamp,
      timeLimit: input.timeLimit,
      questions: parsed.questions || [],
    };
  }
);

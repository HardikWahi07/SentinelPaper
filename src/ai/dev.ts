import { config } from 'dotenv';
config();

// Pre-load flows for Genkit developer UI
import '@/ai/flows/natural-language-security-copilot.ts';
import '@/ai/flows/ai-powered-leak-trace-flow.ts';
import '@/ai/flows/generate-exam-flow.ts';

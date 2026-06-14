import Groq from "groq-sdk";

/**
 * Direct Groq SDK client.
 * Strictly uses process.env.GROQ_API_KEY.
 */
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

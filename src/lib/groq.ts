import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const AI_MODEL = "openai/gpt-oss-120b";

export default groq;

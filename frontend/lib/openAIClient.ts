import OpenAI from "openai";
import { APIError } from "@/app/api/forms/errorHandler"

const openaiApiKey = process.env.OPENAI_API_KEY!;
if (!openaiApiKey) {
  console.error('OPENAI_API_KEY is not set');
  throw new APIError('Server configuration error.', 500);
}
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export default openai
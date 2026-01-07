import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    // console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
export const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

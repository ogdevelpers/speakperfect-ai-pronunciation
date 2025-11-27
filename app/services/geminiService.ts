'use client';

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EvaluationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });

const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "A score from 0 to 100 representing pronunciation accuracy.",
    },
    phoneticMatch: {
      type: Type.STRING,
      description: "The IPA phonetic transcription of what the user actually said.",
    },
    feedback: {
      type: Type.STRING,
      description: "Constructive feedback on which specific sounds were incorrect or if the intonation was off. Keep it concise (under 2 sentences).",
    },
    isCorrect: {
      type: Type.BOOLEAN,
      description: "True if the pronunciation is understandable by a native speaker, false otherwise.",
    },
  },
  required: ["score", "phoneticMatch", "feedback", "isCorrect"],
};

export const evaluatePronunciation = async (
  audioBase64: string,
  mimeType: string,
  targetWord: string
): Promise<EvaluationResult> => {
  try {
    const model = "gemini-2.5-flash"; // Using 2.5 Flash for fast multimodal processing

    const prompt = `
      Listen to the attached audio. The user is trying to pronounce the word "${targetWord}".
      Analyze the pronunciation accuracy carefully as a strict linguistics coach.
      Compare it to the standard American English pronunciation.
      Provide a score, the IPA transcription of what you heard, and helpful feedback.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.2, // Low temperature for consistent scoring
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(text) as EvaluationResult;
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback for demo purposes if API fails or quota exceeded, though strictly we should just throw.
    // Throwing allows the UI to handle the error state.
    throw error;
  }
};


'use client';

import { EvaluationResult } from "../types";

export const evaluatePronunciation = async (
  audioBase64: string,
  mimeType: string,
  targetWord: string
): Promise<EvaluationResult> => {
  try {
    const response = await fetch('/api/evaluate-pronunciation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64,
        mimeType,
        targetWord,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const result = await response.json() as EvaluationResult;
    return result;
  } catch (error: any) {
    console.error("Pronunciation evaluation error:", error);
    
    // Re-throw the error with user-friendly message
    const errorMessage = error?.message || error?.toString() || '';
    throw new Error(errorMessage || "Failed to analyze pronunciation. Please check your internet connection and try again.");
  }
};


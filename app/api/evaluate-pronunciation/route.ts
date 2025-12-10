import { NextRequest, NextResponse } from 'next/server';

// Convert base64 to Buffer for OpenAI API (Node.js compatible)
const base64ToBuffer = (base64: string): Buffer => {
  return Buffer.from(base64, 'base64');
};

// Helper function to check if error is retryable
const isRetryableError = (error: any): boolean => {
  const errorMessage = error?.message || error?.toString() || '';
  const retryableMessages = [
    'overloaded',
    'rate limit',
    'quota',
    '503',
    '429',
    '500',
    '502',
    '504',
    'timeout',
    'network',
    'ECONNRESET',
    'ETIMEDOUT'
  ];
  return retryableMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()));
};

// Retry with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If it's the last attempt or error is not retryable, throw
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

export async function POST(request: NextRequest) {
  try {
    const { audioBase64, mimeType, targetWord } = await request.json();

    if (!audioBase64 || !mimeType || !targetWord) {
      return NextResponse.json(
        { error: 'Missing required fields: audioBase64, mimeType, targetWord' },
        { status: 400 }
      );
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const attemptEvaluation = async () => {
      // Step 1: Transcribe audio using Whisper API
      const audioBuffer = base64ToBuffer(audioBase64);
      const audioBlob = new Blob([audioBuffer], { type: mimeType });

      const formData = new FormData();
      // FormData.append accepts Blob with filename option in Node.js 18+
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Transcription failed: ${transcriptionResponse.statusText}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcribedText = transcriptionData.text || '';

      // Step 2: Evaluate pronunciation using GPT-4o-mini
      const evaluationPrompt = `You are a strict linguistics coach evaluating pronunciation. The user tried to pronounce the word "${targetWord}".

The transcription of what they said: "${transcribedText}"

Analyze the pronunciation accuracy and provide a JSON response with this exact structure:
{
  "score": <number from 0 to 100>,
  "phoneticMatch": "<IPA phonetic transcription of what you heard>",
  "feedback": "<Constructive feedback on which specific sounds were incorrect or if the intonation was off. Keep it concise (under 2 sentences).>",
  "isCorrect": <true if the pronunciation is understandable by a native speaker, false otherwise>
}

Return ONLY valid JSON, no other text.`;

      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a pronunciation evaluation expert. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: evaluationPrompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Evaluation failed: ${chatResponse.statusText}`);
      }

      const chatData = await chatResponse.json();
      const responseText = chatData.choices?.[0]?.message?.content;
      
      if (!responseText) {
        throw new Error("No response from OpenAI");
      }

      const result = JSON.parse(responseText);
      return result;
    };

    // Retry with exponential backoff
    const result = await retryWithBackoff(attemptEvaluation, 3, 1000);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    
    // Provide user-friendly error message
    const errorMessage = error?.message || error?.toString() || '';
    let statusCode = 500;
    let message = "Failed to analyze pronunciation. Please check your internet connection and try again.";
    
    if (errorMessage.toLowerCase().includes('overloaded') || errorMessage.toLowerCase().includes('rate limit')) {
      message = "The service is currently busy. Please try again in a few moments.";
      statusCode = 503;
    } else if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('insufficient_quota')) {
      message = "API quota exceeded. Please check your OpenAI account credits.";
      statusCode = 402;
    } else if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('authentication') || errorMessage.toLowerCase().includes('invalid_api_key')) {
      message = "API configuration error. Please check your OpenAI API key.";
      statusCode = 401;
    } else if (errorMessage.toLowerCase().includes('not configured')) {
      message = "OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.";
      statusCode = 500;
    }
    
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    );
  }
}


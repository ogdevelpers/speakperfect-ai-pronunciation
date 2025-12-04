export type Level = 'Low' | 'Medium' | 'Hard';

export interface WordChallenge {
  id: string;
  word: string;
  phonetic: string;
  definition: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface EvaluationResult {
  score: number;
  phoneticMatch: string;
  feedback: string;
  isCorrect: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  LEVEL_SELECTION = 'LEVEL_SELECTION',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  FINISHED = 'FINISHED'
}


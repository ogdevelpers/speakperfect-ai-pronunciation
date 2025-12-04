'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getWordsByLevel } from './constants';
import { AppState, EvaluationResult, Level } from './types';
import WordDisplay from './components/WordDisplay';
import Recorder from './components/Recorder';
import ResultCard from './components/ResultCard';
import { evaluatePronunciation } from './services/pronunciationService';
import { Mic2, Timer, Trophy, RotateCcw, Play, Gamepad2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TOTAL_TIME_SECONDS = 120; // 2 minutes

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [challenges, setChallenges] = useState<typeof import('./constants').CHALLENGES>([]);
  
  const timerRef = useRef<any>(null);
  
  const currentChallenge = challenges[currentIndex];

  const finishGame = useCallback(() => {
    clearInterval(timerRef.current);
    setAppState(AppState.FINISHED);
  }, []);

  // Timer Logic - continues running during RECORDING, PROCESSING, and RESULT states
  useEffect(() => {
    const isGameActive = appState === AppState.RECORDING || appState === AppState.PROCESSING || appState === AppState.RESULT;
    
    if (isGameActive) {
      // Only start timer if it's not already running
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              finishGame();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      // Clear timer when game is not active
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [appState, finishGame]);

  // Trigger confetti on good result
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const triggerConfetti = async () => {
      const confetti = (await import('canvas-confetti')).default;
      
      if (appState === AppState.RESULT && evaluation && evaluation.score >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#ec4899', '#8b5cf6', '#10b981']
        });
      }
      if (appState === AppState.FINISHED) {
        // Big celebration
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#ec4899']
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#f43f5e', '#f59e0b']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      }
    };
    
    triggerConfetti();
  }, [appState, evaluation]);

  const handleLevelSelection = (level: Level) => {
    setSelectedLevel(level);
    const levelWords = getWordsByLevel(level);
    setChallenges(levelWords);
    setCurrentIndex(0);
    setResults([]);
    setTimeLeft(TOTAL_TIME_SECONDS);
    setEvaluation(null);
    setAppState(AppState.RECORDING);
  };

  const startGame = () => {
    setAppState(AppState.LEVEL_SELECTION);
  };

  const handleStartRecording = () => {
    // handled by Recorder auto-start
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setAppState(AppState.PROCESSING);
    
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const result = await evaluatePronunciation(base64Audio, audioBlob.type, currentChallenge.word);
      
      setEvaluation(result);
      setResults(prev => [...prev, result]);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      // Use the error message from the service if available, otherwise use a generic one
      const errorMessage = err?.message || "Failed to analyze audio. Please check your internet connection and try again.";
      setErrorMsg(errorMessage);
      setAppState(AppState.ERROR);
    }
  };

  const handleNext = () => {
    if (currentIndex >= challenges.length - 1) {
      finishGame();
    } else {
      setCurrentIndex(prev => prev + 1);
      setEvaluation(null);
      setErrorMsg(null);
      setAppState(AppState.RECORDING); 
    }
  };

  const handleReset = () => {
    // Retry current word
    setAppState(AppState.RECORDING);
    setEvaluation(null);
    setErrorMsg(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Screens ---

  // Start Screen
  if (appState === AppState.IDLE) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient">
        {/* Decorative Blobs */}
        <div className="blob bg-yellow-300 w-64 h-64 rounded-full top-10 left-10"></div>
        <div className="blob bg-cyan-300 w-80 h-80 rounded-full bottom-20 right-10 animation-delay-2000"></div>

        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center transform hover:scale-[1.01] transition-transform duration-300">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-indigo-50">
            <Mic2 className="w-12 h-12 text-indigo-600 animate-bounce" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-3 tracking-tight">SpeakPerfect</h1>
          <p className="text-gray-500 mb-8 font-medium">
            Can you beat the clock? Pronounce words correctly in 2 minutes!
          </p>
          <button 
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-xl shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 fill-current" />
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Level Selection Screen
  if (appState === AppState.LEVEL_SELECTION) {
    const levels: { level: Level; label: string; icon: React.ReactNode; color: string; bgColor: string; description: string }[] = [
      {
        level: 'Low',
        label: 'Low',
        icon: <TrendingDown className="w-8 h-8" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
        description: 'Easy words for beginners'
      },
      {
        level: 'Medium',
        label: 'Medium',
        icon: <Minus className="w-8 h-8" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
        description: 'Moderate difficulty words'
      },
      {
        level: 'Hard',
        label: 'Hard',
        icon: <TrendingUp className="w-8 h-8" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
        description: 'Challenging words for experts'
      }
    ];

    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        {/* Decorative Blobs */}
        <div className="blob bg-yellow-300 w-64 h-64 rounded-full top-10 left-10"></div>
        <div className="blob bg-cyan-300 w-80 h-80 rounded-full bottom-20 right-10 animation-delay-2000"></div>

        <div className="max-w-2xl w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center transform hover:scale-[1.01] transition-transform duration-300 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-indigo-50">
            <Gamepad2 className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-3 tracking-tight">Choose Your Level</h1>
          <p className="text-gray-500 mb-8 font-medium">
            Select a difficulty level. You'll get up to 10 words to pronounce!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {levels.map(({ level, label, icon, color, bgColor, description }) => (
              <button
                key={level}
                onClick={() => handleLevelSelection(level)}
                className={`${bgColor} border-2 rounded-2xl p-6 text-left transition-all transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg`}
              >
                <div className={`${color} mb-3 flex items-center justify-center`}>
                  {icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{label}</h3>
                <p className="text-sm text-gray-600">{description}</p>
                <p className="text-xs text-gray-500 mt-2 font-medium">Up to 10 words</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setAppState(AppState.IDLE)}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Summary Screen
  if (appState === AppState.FINISHED) {
    const avgScore = results.length > 0 
      ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) 
      : 0;
    
    let message = "Good effort!";
    if (avgScore > 90) message = "You're a Superstar! 🌟";
    else if (avgScore > 75) message = "Awesome Job! 🎉";

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-blue-400 to-indigo-600">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in-up border-4 border-white/20">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-yellow-200">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Level Complete!</h1>
          <p className="text-indigo-500 font-bold text-lg mb-6">{message}</p>
          
          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase mb-1">Words</p>
              <p className="text-3xl font-bold text-gray-800">{results.length} <span className="text-lg text-gray-400">/ {challenges.length}</span></p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase mb-1">Score</p>
              <p className={`text-3xl font-bold ${avgScore >= 80 ? 'text-green-500' : 'text-indigo-500'}`}>{avgScore}</p>
            </div>
          </div>
          <button 
            onClick={() => setAppState(AppState.IDLE)}
            className="w-full py-4 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-lg transition-all shadow-xl hover:-translate-y-1"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Main Game Loop
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 text-gray-800 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
        
        {/* Animated Background */}
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>

      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md">
                <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-indigo-900 hidden sm:block">SpeakPerfect</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-full transition-colors border-2 ${timeLeft < 30 ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' : 'bg-white text-gray-700 border-gray-100'}`}>
                <Timer className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
             </div>
             <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
               Word {currentIndex + 1} of {challenges.length}
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl px-6 py-8 flex flex-col items-center relative z-10">
        
        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full mb-10 overflow-hidden shadow-inner">
            <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-700 ease-out rounded-full relative"
                style={{ width: `${challenges.length > 0 ? ((currentIndex + (appState === AppState.RESULT ? 1 : 0)) / challenges.length) * 100 : 0}%` }}
            >
                <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
        </div>

        {currentChallenge && <WordDisplay challenge={currentChallenge} />}

        {/* Dynamic Interaction Area */}
        <div className="w-full min-h-[300px] flex flex-col items-center justify-start mt-4">
            
            {appState === AppState.ERROR && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm w-full text-center border-2 border-red-100 font-bold animate-shake">
                    {errorMsg || "Oops! Something went wrong."}
                    <button onClick={handleReset} className="block mx-auto mt-2 underline text-red-800">Try Again</button>
                </div>
            )}

            {appState !== AppState.RESULT ? (
                <div className="w-full flex flex-col items-center animate-fade-in">
                    <Recorder 
                        appState={appState}
                        onStartRecording={handleStartRecording}
                        onRecordingComplete={handleRecordingComplete}
                    />
                </div>
            ) : (
                evaluation && (
                    <ResultCard 
                        result={evaluation}
                        onNext={handleNext}
                        isLast={currentIndex === challenges.length - 1}
                    />
                )
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-gray-400 text-xs bg-white/50 backdrop-blur-sm relative z-10">
        <p className="font-bold tracking-wider opacity-60">POWERED BY SPELLBEE</p>
      </footer>
    </div>
  );
}


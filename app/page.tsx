'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getWordsByLevel } from './constants';
import { AppState, EvaluationResult, Level } from './types';
import WordDisplay from './components/WordDisplay';
import Recorder from './components/Recorder';
import ResultCard from './components/ResultCard';
import Header from './components/Header';
import Footer from './components/Footer';
import Timer from './components/Timer';
import { evaluatePronunciation } from './services/pronunciationService';
import { Mic2, Timer as TimerIcon, Trophy, RotateCcw, Play, Gamepad2, TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react';

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

  // --- Screens ---

  // Start Screen
  if (appState === AppState.IDLE) {
    return (
      <div className="start-screen">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-6 relative">
          {/* Decorative Blobs */}
          <div className="blob bg-yellow-300 w-64 h-64 rounded-full top-10 left-10"></div>
          <div className="blob bg-cyan-300 w-80 h-80 rounded-full bottom-20 right-10"></div>

          <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center transform transition-transform duration-300 relative z-10"
               style={{ transform: 'scale(1)' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-indigo-50">
              <Mic2 className="w-12 h-12 text-indigo-600 animate-bounce" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-3 tracking-tight">SpeakPerfect</h1>
            <p className="text-gray-500 mb-8 font-medium">
              Can you beat the clock? Pronounce words correctly in 2 minutes!
            </p>
            <button 
              onClick={startGame}
              className="btn-gradient-indigo w-full text-xl flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6 fill-current" />
              Start Game
            </button>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Level Selection Screen
  if (appState === AppState.LEVEL_SELECTION) {
    const levels: { level: Level; label: string; icon: React.ReactNode; color: string; bgColor: string; hoverBgColor: string; description: string }[] = [
      {
        level: 'Low',
        label: 'Low',
        icon: <TrendingDown className="w-8 h-8" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        hoverBgColor: 'bg-green-100',
        description: 'Easy words for beginners'
      },
      {
        level: 'Medium',
        label: 'Medium',
        icon: <Minus className="w-8 h-8" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        hoverBgColor: 'bg-yellow-100',
        description: 'Moderate difficulty words'
      },
      {
        level: 'Hard',
        label: 'Hard',
        icon: <TrendingUp className="w-8 h-8" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        hoverBgColor: 'bg-red-100',
        description: 'Challenging words for experts'
      }
    ];

    return (
      <div className="level-selection-screen">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-6 relative">
          {/* Decorative Blobs */}
          <div className="blob bg-yellow-300 w-64 h-64 rounded-full top-10 left-10"></div>
          <div className="blob bg-cyan-300 w-80 h-80 rounded-full bottom-20 right-10"></div>

          <div className="max-w-2xl w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center transform transition-transform duration-300 relative z-10"
               style={{ transform: 'scale(1)' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-indigo-50">
              <Gamepad2 className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-3 tracking-tight">Choose Your Level</h1>
            <p className="text-gray-500 mb-8 font-medium">
              Select a difficulty level. You'll get up to 10 words to pronounce!
            </p>
            
            <div className="grid grid-cols-1 md-grid-cols-3 gap-4 mb-6">
              {levels.map(({ level, label, icon, color, bgColor, hoverBgColor, description }) => (
                <button
                  key={level}
                  onClick={() => handleLevelSelection(level)}
                  className={`${bgColor} border-2 rounded-2xl p-6 text-left transition-all transform shadow-md hover-shadow-lg`}
                  style={{ transform: 'scale(1)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.className = `${hoverBgColor} border-2 rounded-2xl p-6 text-left transition-all transform shadow-md hover-shadow-lg`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.className = `${bgColor} border-2 rounded-2xl p-6 text-left transition-all transform shadow-md hover-shadow-lg`;
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
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
              className="back-to-home-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </main>
        
        <Footer />
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
      <div className="finished-screen">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-6">
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
              className="w-full py-4 flex items-center justify-center gap-2 bg-gray-900 hover-bg-black text-white rounded-2xl font-bold text-lg transition-all shadow-xl"
              style={{ transform: 'translateY(0)' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-0.25rem)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Main Game Loop
  return (
    <div className="game-screen">
      {/* Animated Background */}
      <div className="game-background"></div>

      <Header 
        showProgress={true}
        currentIndex={currentIndex}
        totalWords={challenges.length}
      />

      {/* Main Content */}
      <main className="main-game-content">
        {/* Progress Bar Section */}
        <div className="game-progress-section">
          <div className="game-progress-bar">
            <div 
              className="game-progress-fill"
              style={{ width: `${challenges.length > 0 ? ((currentIndex + (appState === AppState.RESULT ? 1 : 0)) / challenges.length) * 100 : 0}%` }}
            >
              <div className="game-progress-shimmer"></div>
            </div>
          </div>
          <div className="game-progress-text">
            Progress: {currentIndex + (appState === AppState.RESULT ? 1 : 0)} / {challenges.length}
          </div>
        </div>

        {/* Timer - Positioned above word section */}
        <div className="game-timer-section">
          <Timer timeLeft={timeLeft} />
        </div>

        {/* Word Display Section */}
        <div className="game-word-section">
          {currentChallenge && <WordDisplay challenge={currentChallenge} />}
        </div>

        {/* Interaction Area */}
        <div className="game-interaction-section">
          {appState === AppState.ERROR && (
            <div className="game-error-message">
              {errorMsg || "Oops! Something went wrong."}
              <button onClick={handleReset} className="game-error-button">Try Again</button>
            </div>
          )}

          {appState !== AppState.RESULT ? (
            <div className="game-recorder-wrapper">
              <Recorder 
                appState={appState}
                onStartRecording={handleStartRecording}
                onRecordingComplete={handleRecordingComplete}
              />
            </div>
          ) : (
            evaluation && (
              <div className="game-result-wrapper">
                <ResultCard 
                  result={evaluation}
                  onNext={handleNext}
                  isLast={currentIndex === challenges.length - 1}
                />
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}


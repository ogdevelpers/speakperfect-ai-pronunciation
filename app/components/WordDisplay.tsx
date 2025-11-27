'use client';

import React from 'react';
import { WordChallenge } from '../types';
import { Volume2, Star } from 'lucide-react';

interface WordDisplayProps {
  challenge: WordChallenge;
}

const WordDisplay: React.FC<WordDisplayProps> = ({ challenge }) => {
  const speakWord = () => {
    if (typeof window !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(challenge.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="text-center mb-6 w-full max-w-lg mx-auto animate-pop-in">
      <div className="flex justify-center mb-6">
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 shadow-sm ${getDifficultyColor(challenge.difficulty)} flex items-center gap-1`}>
          <Star className="w-3 h-3 fill-current" />
          Level: {challenge.difficulty}
        </span>
      </div>
      
      <div className="relative inline-block group cursor-pointer" onClick={speakWord}>
         <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-2 tracking-tight drop-shadow-sm group-hover:scale-105 transition-transform duration-200">
            {challenge.word}
         </h1>
         <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Volume2 className="w-8 h-8 text-indigo-400 animate-pulse" />
         </div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border-2 border-indigo-50 shadow-sm mt-4 inline-block transform hover:rotate-1 transition-transform duration-300">
        <div className="flex items-center justify-center gap-3 text-indigo-900 mb-2">
            <button 
            onClick={speakWord}
            className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-full transition-colors"
            aria-label="Listen to pronunciation"
            >
            <Volume2 className="w-6 h-6 text-indigo-600" />
            </button>
            <span className="text-2xl font-inter text-gray-600">{challenge.phonetic}</span>
        </div>

        <p className="text-gray-600 font-medium font-inter text-lg">
            "{challenge.definition}"
        </p>
      </div>
    </div>
  );
};

export default WordDisplay;


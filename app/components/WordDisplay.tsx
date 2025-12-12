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
    <div className="word-display-container">
      <div className="word-difficulty-badge">
        <span className={`difficulty-badge ${getDifficultyColor(challenge.difficulty)}`}>
          <Star className="w-4 h-4 fill-current" />
          <span>Level: {challenge.difficulty}</span>
        </span>
      </div>
      
      <div className="word-main-display">
        <div className="word-title-wrapper group" onClick={speakWord}>
          <h1 className="word-title">
            {challenge.word}
          </h1>
          <div className="word-hover-icon">
            <Volume2 className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
        </div>
      </div>
      
      <div className="word-definition-card">
        <div className="word-definition-header">
          <button 
            onClick={speakWord}
            className="word-listen-button"
            aria-label="Listen to pronunciation"
          >
            <Volume2 className="w-6 h-6 text-indigo-600" />
          </button>
        </div>
        <p className="word-definition-text">
          "{challenge.definition}"
        </p>
      </div>
    </div>
  );
};

export default WordDisplay;


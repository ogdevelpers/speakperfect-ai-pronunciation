'use client';

import React from 'react';
import { Gamepad2, Timer } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  showTimer?: boolean;
  timeLeft?: number;
  showProgress?: boolean;
  currentIndex?: number;
  totalWords?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  showTimer = false, 
  timeLeft = 0, 
  showProgress = false,
  currentIndex = 0,
  totalWords = 0
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-indigo-900 hidden sm:block">
              SpeakPerfect
            </span>
          </Link>
          
          {/* Right side info */}
          <div className="flex items-center gap-4">
            {showTimer && (
              <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-full transition-colors border-2 ${
                timeLeft < 30 
                  ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' 
                  : 'bg-white text-gray-700 border-gray-100'
              }`}>
                <Timer className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            {showProgress && (
              <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                Word {currentIndex + 1} of {totalWords}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


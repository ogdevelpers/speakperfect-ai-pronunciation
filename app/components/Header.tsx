'use client';

import React from 'react';
import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  showProgress?: boolean;
  currentIndex?: number;
  totalWords?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  showProgress = false,
  currentIndex = 0,
  totalWords = 0
}) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm-px-6 lg-px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-indigo-900 hidden sm-block">
              SpeakPerfect
            </span>
          </Link>
          
          {/* Right side info */}
          <div className="flex items-center gap-4">
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


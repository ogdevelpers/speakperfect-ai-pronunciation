'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs font-bold tracking-wider opacity-60">
            POWERED BY SPELLBEE
          </p>
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} SpeakPerfect AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


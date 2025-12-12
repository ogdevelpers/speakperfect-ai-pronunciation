'use client';

import React from 'react';
import { Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  timeLeft: number;
}

const Timer: React.FC<TimerProps> = ({ timeLeft }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`timer-container ${timeLeft < 30 ? 'timer-urgent' : timeLeft < 60 ? 'timer-warning' : 'timer-normal'}`}>
      <div className="timer-icon-wrapper">
        <TimerIcon className="timer-icon" />
      </div>
      <div className="timer-content">
        <span className="timer-label">Time</span>
        <span className="timer-value">{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};

export default Timer;


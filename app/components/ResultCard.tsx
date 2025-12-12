'use client';

import React, { useEffect, useState } from 'react';
import { EvaluationResult } from '../types';
import { CheckCircle2, XCircle, ArrowRight, Star, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ResultCardProps {
  result: EvaluationResult;
  onNext: () => void;
  isLast: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onNext, isLast }) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate score counting up
  useEffect(() => {
    let start = 0;
    const end = result.score;
    const duration = 1000;
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [result.score]);

  const isGood = result.score >= 80;
  
  const chartData = [
    { name: 'Score', value: displayScore },
    { name: 'Remaining', value: 100 - displayScore },
  ];
  
  const COLORS = isGood ? ['#4ade80', '#f3f4f6'] : ['#facc15', '#f3f4f6'];
  if (result.score < 50) COLORS[0] = '#f87171';

  // Determine Stars
  const stars = result.score >= 90 ? 3 : result.score >= 70 ? 2 : 1;

  return (
    <div className={`w-full mx-auto mt-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden animate-slide-up border-2 ${isGood ? 'result-card-good' : 'result-card-nice-try'}`}>
      <div className="p-6">
        <div className={`flex items-center justify-between mb-4 p-4 rounded-2xl ${isGood ? 'result-header-good' : 'result-header-nice-try'}`}>
            <h2 className={`text-3xl font-extrabold flex items-center gap-3 ${isGood ? 'text-green-700' : 'text-orange-700'}`}>
                {isGood ? (
                  <>
                    <span>Awesome!</span>
                    <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                  </>
                ) : (
                  <>
                    <span>Nice Try!</span>
                    <XCircle className="w-6 h-6 text-orange-500" />
                  </>
                )}
            </h2>
            <div className="flex gap-1">
                {[1, 2, 3].map((s) => (
                    <Star 
                        key={s} 
                        className={`w-7 h-7 ${s <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                ))}
            </div>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
             {/* Score Ring */}
             <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={10}
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800">{displayScore}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase">Points</span>
                </div>
             </div>
             
             <div className="flex-1 flex flex-col justify-center">
                 <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">You said</p>
                 <div className="bg-gray-100 p-3 rounded-xl border-2 border-gray-200">
                     <p className="text-xl font-inter font-medium text-gray-800">
                         {result.phoneticMatch || "..."}
                     </p>
                 </div>
             </div>
        </div>

        <div className={`coach-feedback-box ${isGood ? 'coach-box-good' : 'coach-box-nice-try'}`}>
            <div className="coach-feedback-content">
                <span className="coach-feedback-header">
                   {isGood ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                   <span>Coach says:</span>
                </span>
                <p className="coach-feedback-text">{result.feedback}</p>
            </div>
        </div>

        <button
            onClick={onNext}
            className="w-full py-4 bg-indigo-600 hover-bg-indigo-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover-shadow-indigo-200"
            style={{ transform: 'translateY(0)' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-0.25rem)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <span>{isLast ? "See Final Score" : "Next Word"}</span>
            <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ResultCard;


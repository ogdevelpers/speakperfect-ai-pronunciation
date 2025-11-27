'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Square, Loader2, Mic } from 'lucide-react';
import { AppState } from '../types';

interface RecorderProps {
  appState: AppState;
  onRecordingComplete: (audioBlob: Blob) => void;
  onStartRecording: () => void;
}

const SILENCE_THRESHOLD = 15; // Amplitude threshold (0-255)
const SILENCE_DURATION = 1500; // ms of silence to trigger auto-stop

const Recorder: React.FC<RecorderProps> = ({ appState, onRecordingComplete, onStartRecording }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(12).fill(5));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const speechStartedRef = useRef<boolean>(false);

  // Auto-start recording when mounted if in RECORDING state
  useEffect(() => {
    if (appState === AppState.RECORDING) {
      startRecording();
    }
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);

      // Setup Audio Context for Visualizer and Silence Detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Smaller FFT for chunkier bars
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        onRecordingComplete(audioBlob);
        stopStream();
        audioContext.close();
      };

      mediaRecorder.start();
      speechStartedRef.current = false;
      onStartRecording();
      
      // Start analysis loop
      detectSilence();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const detectSilence = () => {
    if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    // Visualizer data update - pick 12 nicely spaced frequencies
    const newData = [];
    const step = Math.floor(bufferLength / 12);
    for (let i = 0; i < 12; i++) {
        const val = dataArray[i * step];
        newData.push(Math.max(8, val / 2)); // Scale down slightly
    }
    setVisualizerData(newData);

    // Silence Detection Logic
    if (average > SILENCE_THRESHOLD) {
      speechStartedRef.current = true;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else if (speechStartedRef.current) {
      // If speech has started and now it's silent
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          stopRecording();
        }, SILENCE_DURATION);
      }
    }

    requestAnimationFrame(detectSilence);
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  if (appState === AppState.PROCESSING) {
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="relative">
             <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-75"></div>
             <div className="relative bg-indigo-100 p-4 rounded-full">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
             </div>
        </div>
        <p className="text-indigo-600 font-bold mt-4 text-lg">Checking your pronunciation...</p>
      </div>
    );
  }

  // Generate rainbow colors for visualizer
  const getBarColor = (index: number) => {
    const colors = [
        'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 
        'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 
        'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="h-32 flex items-end justify-center gap-1.5 mb-6 w-full max-w-sm p-4 bg-white/50 rounded-3xl backdrop-blur-sm border border-white/60 shadow-inner">
         {visualizerData.map((height, i) => (
           <div 
              key={i} 
              className={`w-5 rounded-full transition-all duration-75 ease-out ${getBarColor(i)}`}
              style={{ height: `${Math.min(height, 100)}%` }}
           />
         ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-6 py-2 rounded-full shadow-sm text-indigo-600 font-bold animate-bounce">
           <Mic className="w-5 h-5" />
           <span>I'm listening! Say the word...</span>
        </div>
        
        <button
          onClick={stopRecording}
          className="mt-2 px-8 py-3 bg-red-100 text-red-600 hover:bg-red-200 hover:scale-105 active:scale-95 rounded-2xl font-bold transition-all flex items-center gap-2 border-2 border-red-200"
        >
           <Square className="w-4 h-4 fill-current" />
           Stop & Check
        </button>
      </div>
    </div>
  );
};

export default Recorder;


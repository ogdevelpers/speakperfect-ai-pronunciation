'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

  // Define stopStream before it's used in useEffect
  const stopStream = useCallback(() => {
    setStream((currentStream) => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  }, []);

  // Reset stream when appState changes to RECORDING (new word)
  useEffect(() => {
    if (appState === AppState.RECORDING) {
      // Reset stream and visualizer when starting a new word
      stopStream();
      setVisualizerData(new Array(12).fill(5));
      speechStartedRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  }, [appState, stopStream]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const startRecording = async () => {
    try {
      // Optimized audio constraints for immediate recording in crowded environments
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Request high-quality audio for better analysis
        sampleRate: { ideal: 44100 },
        channelCount: { ideal: 1 }, // Mono for better processing
      };

      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints 
      });
      setStream(audioStream);

      // Setup Audio Context for Visualizer and Silence Detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100, // High sample rate for quality
        latencyHint: 'interactive' // Low latency for immediate response
      });
      const source = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Smaller FFT for chunkier bars
      analyser.smoothingTimeConstant = 0.3; // Less smoothing for more responsive visualization
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus', // High quality codec
        audioBitsPerSecond: 128000 // High bitrate for quality
      });
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

      // Start recording immediately with timeslice for better responsiveness
      mediaRecorder.start(100); // Collect data every 100ms for immediate processing
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

  // Show start recording button if not recording yet
  if (appState === AppState.RECORDING && !stream) {
    return (
      <div className="flex flex-col items-center w-full">
        <div className="h-32 flex items-center justify-center mb-6 w-full max-w-sm p-4 bg-white/50 rounded-3xl backdrop-blur-sm border border-white/60 shadow-inner">
          <Mic className="w-16 h-16 text-indigo-400 animate-pulse" />
        </div>
        <button
          onClick={startRecording}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg transition-all flex items-center gap-3 shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 active:scale-95"
        >
          <Mic className="w-6 h-6" />
          Start Recording
        </button>
        <p className="text-gray-500 text-sm mt-4 font-medium">Click to start recording your pronunciation</p>
      </div>
    );
  }

  // Show recording interface when actively recording
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


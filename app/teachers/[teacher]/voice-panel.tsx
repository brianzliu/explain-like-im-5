'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

const teacherMeta: Record<'spongebob' | 'peter' | 'edna', { 
  name: string; 
  img: string; 
  thinkingImg?: string;
  talkingImg?: string;
  bubbleColor: string; 
  voiceId: string | null 
}> = {
  spongebob: { 
    name: 'spongebob', 
    img: '/images/spongebob_neutral.png',
    thinkingImg: '/images/spongebob_thinking.png',
    talkingImg: '/images/spongebob_talking.png',
    bubbleColor: '#FFF7B1',
    voiceId: 'l5rFONx2gxJPREYQyyjp'
  },
  peter: { 
    name: 'peter griffin', 
    img: '/images/peter_neutral.png', 
    bubbleColor: '#FFDCE2',
    voiceId: null
  },
  edna: { 
    name: 'dora the explorer', 
    img: '/images/dora_neutral.png', 
    bubbleColor: '#E9D7FF',
    voiceId: null 
  }
};

type Props = { teacher: 'spongebob' | 'peter' | 'edna' };

type Status = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking' | 'error';

export default function VoicePanel({ teacher }: Props) {
  const meta = teacherMeta[teacher];
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('Tap the button and ask a question...');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(meta.img);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const talkingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (talkingIntervalRef.current) {
      clearInterval(talkingIntervalRef.current);
      talkingIntervalRef.current = null;
    }

    switch (status) {
      case 'thinking':
      case 'transcribing':
        setCurrentImage(meta.thinkingImg || meta.img);
        break;
      case 'speaking':
        if (meta.talkingImg) {
          let isNeutral = true;
          setCurrentImage(meta.talkingImg);
          talkingIntervalRef.current = setInterval(() => {
            setCurrentImage(isNeutral ? meta.talkingImg! : meta.img);
            isNeutral = !isNeutral;
          }, 300);
        }
        break;
      default:
        setCurrentImage(meta.img);
        break;
    }

    return () => {
      if (talkingIntervalRef.current) {
        clearInterval(talkingIntervalRef.current);
      }
    };
  }, [status, meta]);


  const startRecording = async () => {
    try {
      setStatus('recording');
      setTranscript('Listening...');
      setResponse('');
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.start();

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch (err: any) {
      console.error('Recording error:', err);
      setError('Failed to access microphone');
      setStatus('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processRecording = async () => {
    setStatus('transcribing');
    setTranscript('Transcribing your question...');

    try {
      // Step 1: Speech to Text
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const transcriptResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!transcriptResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { transcript: transcribedText } = await transcriptResponse.json();
      setTranscript(transcribedText);

      // Step 2: Get answer from Claude + Parallel Search
      setStatus('thinking');
      
      const askResponse = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: transcribedText,
          teacher: teacher,
        }),
      });

      if (!askResponse.ok) {
        throw new Error('Failed to get answer');
      }

      const { answer } = await askResponse.json();
      setResponse(answer);

      // Step 3: Text to Speech (only if voice clone available)
      if (meta.voiceId) {
        setStatus('speaking');
        
        const ttsResponse = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: answer,
            voiceId: meta.voiceId,
          }),
        });

        if (!ttsResponse.ok) {
          throw new Error('Failed to generate speech');
        }

        const audioBlob = await ttsResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setStatus('idle');
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setStatus('idle');
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      } else {
        // Fallback to browser TTS if no voice clone
        const utterance = new SpeechSynthesisUtterance(answer);
        utterance.onend = () => setStatus('idle');
        window.speechSynthesis.speak(utterance);
        setStatus('speaking');
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Something went wrong');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'recording': return 'Recording... (tap to stop)';
      case 'transcribing': return 'Transcribing...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      case 'error': return 'Error - Try again';
      default: return 'Ask with your voice';
    }
  };

  const handleButtonClick = () => {
    if (status === 'recording') {
      stopRecording();
    } else if (status === 'idle' || status === 'error') {
      startRecording();
    }
  };

  const bubbleStyle = useMemo(() => ({ background: meta.bubbleColor }), [meta.bubbleColor]);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-start">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-44 h-44 rounded-xl overflow-hidden shadow">
          <Image src={currentImage} alt={meta.name} fill className="object-scale-down" />
        </div>
        <button 
          className="voice-button" 
          onClick={handleButtonClick} 
          disabled={status === 'transcribing' || status === 'thinking' || status === 'speaking'}
        >
          {getButtonText()}
        </button>
        {!meta.voiceId && (
          <p className="text-xs text-gray-500 text-center">
            Voice clone not available yet.<br />Using browser voice.
          </p>
        )}
      </div>

      <div className="relative mt-6 md:mt-0">
        <div className="rounded-2xl p-6 text-lg leading-7 shadow" style={bubbleStyle}>
          {error ? (
            <span className="text-red-600">❌ {error}</span>
          ) : (
            <>
              {transcript && (
                <div className="mb-4">
                  <strong>You asked:</strong> {transcript}
                </div>
              )}
              {response && (
                <div>
                  <strong>{meta.name} says:</strong> {response}
                </div>
              )}
              {!response && !error && transcript === 'Tap the button and ask a question...' && transcript}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

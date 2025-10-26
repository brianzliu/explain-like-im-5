"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import MermaidGraph from "../../components/MermaidGraph";

type BubbleTone = "user" | "response" | "error";

const DEFAULT_PROMPT = "Tap the button and ask a question...";
const BUBBLE_PALETTE: Record<BubbleTone, { bubble: string; tail: string }> = {
  response: {
    bubble: "bg-emerald-400 border-emerald-500 text-white shadow-[0_14px_0_rgba(16,185,129,0.35)]",
    tail: "bg-emerald-400 border-emerald-500"
  },
  user: {
    bubble: "bg-sky-400 border-sky-500 text-white shadow-[0_14px_0_rgba(56,189,248,0.35)]",
    tail: "bg-sky-400 border-sky-500"
  },
  error: {
    bubble: "bg-rose-500 border-rose-600 text-white shadow-[0_14px_0_rgba(244,63,94,0.35)]",
    tail: "bg-rose-500 border-rose-600"
  }
};

const teacherMeta: Record<'spongebob' | 'peter' | 'dora', { 
  name: string; 
  img: string; 
  thinkingImg?: string;
  talkingImg?: string;
  voiceId: string | null;
}> = {
  spongebob: { 
    name: 'spongebob', 
    img: '/images/spongebob_neutral.png',
    thinkingImg: '/images/spongebob_thinking.png',
    talkingImg: '/images/spongebob_talking.png',
    voiceId: 'l5rFONx2gxJPREYQyyjp'
  },
  peter: { 
    name: 'peter griffin', 
    img: '/images/peter_neutral.png',
    thinkingImg: '/images/peter_thinking.png',
    talkingImg: '/images/peter_talking.png',
    voiceId: 'AyUKqLr5dode9vNoRaPk'
  },
  dora: { 
    name: 'dora the explorer', 
    img: '/images/dora_neutral.png',
    thinkingImg: '/images/dora_thinking.png',
    talkingImg: '/images/dora_talking.png',
    voiceId: 'y3js7EbIVnE22jVvnCQM'
  }
};

type Props = { teacher: 'spongebob' | 'peter' | 'dora'; chatId?: string };

type Status = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking' | 'error';

export default function VoicePanel({ teacher, chatId: initialChatId }: Props) {
  const meta = teacherMeta[teacher];
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState(DEFAULT_PROMPT);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(meta.img);
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [turns, setTurns] = useState<Array<{ id: string; concept: string; summary: string; question: string; answer: string; audioId?: string | null }>>([]);
  const [sidebarEl, setSidebarEl] = useState<Element | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const replayRef = useRef<HTMLAudioElement | null>(null);
  const talkingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamingAnimationRef = useRef<NodeJS.Timeout | null>(null);

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

  // Sync chatId with prop changes (for loading past chats)
  useEffect(() => {
    if (initialChatId && initialChatId !== chatId) {
      setChatId(initialChatId);
      // Reset UI state when loading a past chat
      setTranscript(DEFAULT_PROMPT);
      setResponse('');
      setError('');
      setHasInteracted(turns.length > 0); // If there are turns, we've interacted
    }
  }, [initialChatId, chatId, turns.length]);

  // Ensure a chat exists for this session
  useEffect(() => {
    const ensureChat = async () => {
      if (chatId) return;
      try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacher }),
        });
        const data = await res.json();
        setChatId(data.chatId);
      } catch {}
    };
    ensureChat();
  }, [chatId, teacher]);

  // Load existing turns when chatId is available
  useEffect(() => {
    const loadTurns = async () => {
      if (!chatId) return;
      try {
        const res = await fetch(`/api/chats/${chatId}/turns`);
        if (res.ok) {
          const data = await res.json();
          const turnsData = data.turns.map((t: any) => ({
            id: t.id,
            concept: t.concept,
            summary: t.summary || '',
            question: t.question,
            answer: t.answer,
            audioId: t.audioId,
          }));
          setTurns(turnsData);
          // Update hasInteracted if there are turns
          if (turnsData.length > 0) {
            setHasInteracted(true);
          }
        }
      } catch {}
    };
    loadTurns();
  }, [chatId]);

  // Mount flag for portals
  useEffect(() => {
    setSidebarEl(document.getElementById('concept-sidebar'));
    setMounted(true);
  }, []);

  useEffect(() => () => {
    if (replayRef.current) {
      replayRef.current.pause();
    }
  }, []);

  useEffect(() => () => {
    if (streamingAnimationRef.current) {
      clearInterval(streamingAnimationRef.current);
    }
  }, []);


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
      setHasInteracted(true); // Mark first interaction

      // Step 2: Get answer from Claude with streaming
      setStatus('thinking');
      
      const askResponse = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: transcribedText,
          teacher: teacher,
          conversationHistory: turns.map(t => ({
            question: t.question,
            answer: t.answer
          }))
        }),
      });

      if (!askResponse.ok) {
        throw new Error('Failed to get answer');
      }

      const reader = askResponse.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      setResponse(''); // Clear previous

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setResponse(accumulatedText);
      }

      // Extract concept and summary from accumulated text
      const conceptMatch = accumulatedText.match(/<concept:\s*([^>]+)>/i);
      const summaryMatch = accumulatedText.match(/<summary:\s*([^>]+)>/i);
      const concept = conceptMatch ? conceptMatch[1].trim() : 'Concept';
      const answer = accumulatedText.replace(/<concept:[^>]+>/i, '').replace(/<summary:[^>]+>/i, '').trim();
      const summary = summaryMatch ? summaryMatch[1].trim() : answer.substring(0, 50) + '...';
      setResponse(answer);

      // Step 3: Text to Speech (only if voice clone available)
      let audioBase64: string | undefined;
      let mimeType: string | undefined;
      if (meta.voiceId) {
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
        // prepare for DB save as base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        audioBase64 = btoa(binary);
        mimeType = 'audio/mpeg';
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        // Start mouth animation when audio plays
        setStatus('speaking');
        
        audio.onended = () => {
          setStatus('idle'); // Stops animation
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
        setStatus('speaking'); // Start animation
        utterance.onend = () => setStatus('idle'); // Stop animation
        window.speechSynthesis.speak(utterance);
      }

      // Persist the turn
      if (chatId) {
        try {
          const saveRes = await fetch(`/api/chats/${chatId}/turns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: transcribedText,
              answer,
              concept,
              summary,
              audioBase64,
              mimeType,
            }),
          });
          if (saveRes.ok) {
            const { turnId, audioId } = await saveRes.json();
            setTurns((t) => [...t, { id: turnId, concept, summary, question: transcribedText, answer, audioId }]);
          }
        } catch {}
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

  const handleButtonClick = useCallback(() => {
    if (status === 'recording') {
      stopRecording();
    } else if (status === 'idle' || status === 'error') {
      startRecording();
    }
  }, [status, stopRecording, startRecording]);

  const handleReplay = useCallback(async (audioId?: string | null) => {
    if (!audioId) return;
    try {
      const response = await fetch(`/api/audio/${audioId}`);
      if (!response.ok) throw new Error('Audio unavailable');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (replayRef.current) {
        const prevUrl = replayRef.current.src;
        replayRef.current.pause();
        replayRef.current = null;
        if (prevUrl.startsWith('blob:')) URL.revokeObjectURL(prevUrl);
      }

      const audio = new Audio(url);
      replayRef.current = audio;
      audio.onended = () => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        replayRef.current = null;
      };
      audio.onerror = () => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        replayRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.error('Replay failed', err);
    }
  }, []);

  const handleNodeClick = useCallback((turnId: string) => {
    const turn = turns.find(t => t.id === turnId);
    if (turn) {
      setResponse(turn.answer);
      setTranscript(turn.question);
      setError('');
      // Also replay the audio if available
      if (turn.audioId) {
        handleReplay(turn.audioId);
      }
    }
  }, [turns, handleReplay]);

  const graph = useMemo(() => {
    if (turns.length < 1) return 'graph TD;';
    const ids = turns.map((_, i) => `C${i}`);
    const nodes = turns
      .map((t, i) => {
        const label = t.summary ? `${t.concept}<br/>${t.summary}` : t.concept;
        return `${ids[i]}["${label.replace(/\[/g, '(').replace(/\]/g, ')').replace(/"/g, '\\"')}"]`;
      })
      .join('; ');
    const edges = ids.slice(0, -1).map((id, i) => `${id}-->${ids[i + 1]}`).join('; ');
    return `graph TD; ${nodes}; ${edges}`;
  }, [turns]);


  const statusLabel = getButtonText();

  let bubbleNode: React.ReactNode = null;
  if (error) {
    bubbleNode = (
      <SpeechBubble tone="error">{error}</SpeechBubble>
    );
  } else if (response) {
    bubbleNode = (
      <SpeechBubble tone="response">{response}</SpeechBubble>
    );
  } else if (transcript && transcript !== DEFAULT_PROMPT) {
    const copy = status === 'transcribing' ? 'Transcribing…' : status === 'thinking' ? 'Thinking…' : transcript;
    bubbleNode = (
      <SpeechBubble tone="user">{copy}</SpeechBubble>
    );
  }

  if (!bubbleNode) {
    bubbleNode = (
      <SpeechBubble tone="response">Tap the green button and I&apos;ll explain it like you&apos;re five!</SpeechBubble>
    );
  }

  const micPortal = useMemo(() => {
    return React.createElement(
      'button',
      {
        className: "absolute bottom-8 left-1/2 z-50 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border-4 border-black/10 bg-emerald-400 text-white shadow-[0_18px_0_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_22px_0_rgba(0,0,0,0.22)] focus:outline-none focus:ring-4 focus:ring-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-60",
        onClick: handleButtonClick,
        disabled: status === 'transcribing' || status === 'thinking' || status === 'speaking',
        'aria-label': 'Start recording',
      },
      status === 'recording' ? (
        React.createElement('div', { className: "h-8 w-8 animate-pulse rounded-full bg-white" })
      ) : (
        React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", className: "h-9 w-9" },
          React.createElement('path', { d: "M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2ZM13 19.95V23h-2v-3.05a9.004 9.004 0 0 1-7.938-7.938L5 11h2l-.938 2.012A7.004 7.004 0 0 0 12 19a7.004 7.004 0 0 0 5.938-5.988L17 11h2l.938 1.012A9.004 9.004 0 0 1 13 19.95Z" })
        )
      )
    );
  }, [handleButtonClick, status]);


  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent" aria-hidden />
      <div className="relative flex h-full flex-col items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-2xl">
          <div className="relative flex flex-col items-center gap-4 rounded-[3rem] border-4 border-black/10 bg-white/95 px-6 py-6 text-center shadow-[0_25px_0_rgba(0,0,0,0.08)] md:px-12 md:py-8">
            {!hasInteracted && (
              <span className="inline-flex items-center gap-2 rounded-full border-4 border-emerald-500/40 bg-emerald-200/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.3em] text-emerald-900 shadow-[0_10px_0_rgba(16,185,129,0.35)]">
                Meet your teacher
              </span>
            )}

            {bubbleNode}

            <div className="relative h-40 w-40 md:h-48 md:w-48">
              <div className="absolute inset-0 rounded-[2.5rem] bg-white" />
              <Image src={currentImage} alt={meta.name} fill className="absolute inset-0 object-contain" />
            </div>

            {!hasInteracted && (
              <div className="flex max-w-md flex-col gap-2">
                <h2 className="text-2xl font-black capitalize text-slate-900 md:text-3xl">{meta.name}</h2>
                <p className="text-xs font-medium text-slate-600 md:text-sm">
                  Ask anything and {meta.name} will break it down in the friendliest way possible.
                </p>
              </div>
            )}

              {!hasInteracted && (
                <div className="flex flex-wrap justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-700">
                  <span className="inline-flex items-center gap-2 rounded-full border-4 border-slate-900/10 bg-white px-3 py-1.5 shadow-[0_10px_0_rgba(0,0,0,0.06)]">
                    {statusLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border-4 border-slate-900/10 bg-white px-3 py-1.5 shadow-[0_10px_0_rgba(0,0,0,0.06)]">
                    🎧 Keep asking follow ups
                  </span>
                </div>
              )}

            {!hasInteracted && !meta.voiceId && (
              <div className="rounded-2xl border-4 border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                Voice clone coming soon—using browser voice meanwhile!
              </div>
            )}
          </div>
        </div>
      </div>

      {micPortal}
      {mounted && sidebarEl && createPortal(
        <ConceptPanel graph={graph} turns={turns} onNodeClick={handleNodeClick} />,
        sidebarEl
      )}
    </div>
  );
}

function SpeechBubble({ tone, children }: { tone: BubbleTone; children: React.ReactNode }) {
  const classes = BUBBLE_PALETTE[tone];
  return (
    <div className="relative flex justify-center">
      <div className={`inline-flex max-w-xl items-center justify-center rounded-[2.5rem] border-4 px-8 py-5 text-lg font-semibold leading-relaxed ${classes.bubble}`}>
        {children}
      </div>
      <div className={`absolute left-1/2 top-full -mt-3 h-8 w-8 -translate-x-1/2 rotate-45 border-b-4 border-r-4 ${classes.tail}`} />
    </div>
  );
}

function ConceptPanel({ graph, turns, onNodeClick }: { graph: string; turns: Array<{ id: string; concept: string; summary: string; question: string; answer: string; audioId?: string | null }>; onNodeClick: (turnId: string) => void }) {
  if (!turns.length) {
    return (
      <div className="rounded-[2rem] border-4 border-dashed border-emerald-200 bg-white/80 px-6 py-8 text-center text-sm font-semibold text-emerald-600 shadow-[0_14px_0_rgba(0,0,0,0.05)]">
        Start chatting to grow a chain of connected concepts!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[2rem] border-4 border-emerald-200 bg-white/90 p-4 shadow-[0_14px_0_rgba(0,0,0,0.05)]">
        <MermaidGraph graph={graph} turns={turns} />
      </div>
      <div className="space-y-3">
        {turns.map((turn, index) => (
          <button
            key={turn.id}
            onClick={() => onNodeClick(turn.id)}
            className="w-full rounded-[1.75rem] border-4 border-emerald-200 bg-emerald-50 px-5 py-4 shadow-[0_12px_0_rgba(16,185,129,0.15)] transition-all hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-[0_16px_0_rgba(16,185,129,0.2)] text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-black uppercase tracking-[0.3em] text-emerald-700">Concept {index + 1}</span>
              {turn.audioId && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 4a8 8 0 1 0 8 8h2a10 10 0 1 1-10-10V0l5 4-5 4V4Z" />
                  </svg>
                  <span className="hidden sm:inline">Click to view & replay</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm font-medium leading-relaxed text-emerald-900">{turn.concept}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

const teacherMeta: Record<'spongebob' | 'peter' | 'edna', { name: string; img: string; bubbleColor: string }> = {
  spongebob: { name: 'spongebob', img: '/images/spongebob.png', bubbleColor: '#FFF7B1' },
  peter: { name: 'peter griffin', img: '/images/peter.png', bubbleColor: '#FFDCE2' },
  edna: { name: 'edna mode', img: '/images/edna.png', bubbleColor: '#E9D7FF' }
};

type Props = { teacher: 'spongebob' | 'peter' | 'edna' };

export default function VoicePanel({ teacher }: Props) {
  const meta = teacherMeta[teacher];
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('Tap and ask a question...');
  const [response, setResponse] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // @ts-expect-error: window.SpeechRecognition types vary across browsers
  const SpeechRecognitionImpl: typeof window.SpeechRecognition | undefined = typeof window !== 'undefined' ? (window.SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined;

  useEffect(() => {
    if (!SpeechRecognitionImpl) return;
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, [SpeechRecognitionImpl]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported in this browser');
      return;
    }
    setTranscript('listening...');
    setResponse('');
    setListening(true);
    recognitionRef.current.start();
  };

  const speak = async () => {
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = `${meta.name} says: ${response || "I'm ready to help!"}`;
    window.speechSynthesis.speak(utterance);
  };

  // Demo response for now; in future, call an API.
  useEffect(() => {
    if (!listening && transcript && transcript !== 'listening...') {
      const simple = `That's a great question! Imagine you're five: ${transcript}.`;
      setResponse(simple);
    }
  }, [listening, transcript]);

  useEffect(() => {
    if (response) speak();
  }, [response]);

  const bubbleStyle = useMemo(() => ({ background: meta.bubbleColor }), [meta.bubbleColor]);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-start">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-44 h-44 rounded-xl overflow-hidden shadow">
          <Image src={meta.img} alt={meta.name} fill className="object-cover" />
        </div>
        <button className="voice-button" onClick={startListening} disabled={listening}>
          {listening ? 'Listening...' : 'Ask with your voice'}
        </button>
      </div>

      <div className="relative mt-6 md:mt-0">
        <div className="rounded-2xl p-6 text-lg leading-7 shadow" style={bubbleStyle}>
          {response || transcript}
        </div>
      </div>
    </div>
  );
}


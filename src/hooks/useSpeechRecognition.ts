import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const ctor = getRecognitionCtor();
  const isSupported = ctor !== null;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldKeepListeningRef = useRef(false);

  const stop = useCallback(() => {
    shouldKeepListeningRef.current = false;
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        // Ignore stop errors if already ended
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, [stop]);

  const start = useCallback(() => {
    const Recognition = getRecognitionCtor();
    if (!Recognition) {
      setError('お使いのブラウザは音声認識（Web Speech API）に対応していません。Chrome / Edge / Safari をお試しください。');
      return;
    }

    setError(null);
    shouldKeepListeningRef.current = true;

    const rec = new Recognition();
    rec.lang = 'ja-JP';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let finalAdded = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript ?? '';
        if (res.isFinal) {
          finalAdded += text;
        } else {
          interim += text;
        }
      }
      if (finalAdded) {
        setTranscript((prev) => prev + finalAdded);
      }
      setInterimTranscript(interim);
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'not-allowed') {
        setError('マイクへのアクセスが許可されていません。ブラウザの設定からマイクを許可してください。');
        shouldKeepListeningRef.current = false;
        setIsListening(false);
        return;
      }
      setError(`音声認識エラー: ${event.error}`);
    };

    rec.onend = () => {
      if (shouldKeepListeningRef.current) {
        try {
          rec.start();
        } catch {
          shouldKeepListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      setError('音声認識を開始できませんでした。');
      shouldKeepListeningRef.current = false;
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;
      if (recRef.current) {
        try {
          recRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    combinedTranscript: transcript + interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}

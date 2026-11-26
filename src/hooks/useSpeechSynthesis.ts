import { useCallback, useEffect, useRef, useState } from 'react';
import type { CustomPhraseOverride, Phrase } from '../types.ts';
import { getPhraseTtsText } from '../utils/rubyParser.ts';

interface UseSpeechSynthesisOptions {
  rate: number;
  pauseSec: number;
  customOverrides: Record<string, CustomPhraseOverride>;
}

export function useSpeechSynthesis({
  rate,
  pauseSec,
  customOverrides,
}: UseSpeechSynthesisOptions) {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedBetween, setIsPausedBetween] = useState(false);
  const [playingPhraseId, setPlayingPhraseId] = useState<string | null>(null);
  const [loop, setLoop] = useState(false);

  const queueRef = useRef<Phrase[]>([]);
  const indexRef = useRef(0);
  const activeRunIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const loopRef = useRef(loop);
  const rateRef = useRef(rate);
  const pauseSecRef = useRef(pauseSec);
  const overridesRef = useRef(customOverrides);

  loopRef.current = loop;
  rateRef.current = rate;
  pauseSecRef.current = pauseSec;
  overridesRef.current = customOverrides;

  const clearPendingTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    activeRunIdRef.current++;
    clearPendingTimer();
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPausedBetween(false);
    setPlayingPhraseId(null);
  }, [isSupported]);

  const pickJapaneseVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported) return null;
    const voices = window.speechSynthesis.getVoices();
    const jaVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('ja'));
    if (jaVoices.length === 0) return null;
    return (
      jaVoices.find((v) => v.name.includes('Google') || v.name.includes('Nanami') || v.name.includes('Keita')) ??
      jaVoices[0]
    );
  }, [isSupported]);

  const speakAt = useCallback(
    (idx: number, runId: number) => {
      if (!isSupported || runId !== activeRunIdRef.current) return;

      const list = queueRef.current;
      if (idx >= list.length) {
        if (loopRef.current && list.length > 0) {
          indexRef.current = 0;
          speakAt(0, runId);
          return;
        }
        setIsPlaying(false);
        setIsPausedBetween(false);
        setPlayingPhraseId(null);
        return;
      }

      const phrase = list[idx];
      indexRef.current = idx;
      setIsPausedBetween(false);
      setPlayingPhraseId(phrase.id);

      const override = overridesRef.current[phrase.id]?.ttsOverride;
      const ttsText = getPhraseTtsText(phrase, override);

      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.lang = 'ja-JP';
      utterance.rate = rateRef.current;
      const voice = pickJapaneseVoice();
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (runId !== activeRunIdRef.current) return;
        const delayMs = Math.max(0, Math.round(pauseSecRef.current * 1000));
        if (delayMs > 0 && idx + 1 < list.length) {
          setIsPausedBetween(true);
          timerRef.current = window.setTimeout(() => {
            if (runId === activeRunIdRef.current) {
              speakAt(idx + 1, runId);
            }
          }, delayMs);
        } else {
          speakAt(idx + 1, runId);
        }
      };

      utterance.onerror = () => {
        if (runId !== activeRunIdRef.current) return;
        stop();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, pickJapaneseVoice, stop]
  );

  const playPhrases = useCallback(
    (phrases: Phrase[], startIndex = 0) => {
      if (!isSupported || phrases.length === 0) return;
      stop();
      const runId = ++activeRunIdRef.current;
      queueRef.current = phrases;
      setIsPlaying(true);
      speakAt(startIndex, runId);
    },
    [isSupported, speakAt, stop]
  );

  const speakSingle = useCallback(
    (phrase: Phrase) => {
      playPhrases([phrase], 0);
    },
    [playPhrases]
  );

  useEffect(() => {
    return () => {
      activeRunIdRef.current++;
      clearPendingTimer();
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isSupported,
    isPlaying,
    isPausedBetween,
    playingPhraseId,
    loop,
    setLoop,
    playPhrases,
    speakSingle,
    stop,
  };
}

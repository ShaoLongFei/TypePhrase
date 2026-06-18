import { usePronunciation } from "~/composables/user/pronunciation";

// 便于测试
// 后面不使用 audio 后也可以不破坏业务逻辑
const audio = new Audio();
let fallbackText = "";

export function updateSource(src: string, text = "") {
  fallbackText = text;
  audio.src = src;
  audio.load();
}

const { getPronunciationUrl } = usePronunciation();
export function usePlayWordSound() {
  const wordAudio = new Audio();
  let lastWord = "";
  let isPlaying = false;

  wordAudio.onplay = () => {
    isPlaying = true;
  };

  wordAudio.onended = () => {
    isPlaying = false;
  };

  function handlePlayWordSound(word: string) {
    if (isPlaying && lastWord === word) {
      // skip
      return;
    }
    lastWord = word;
    wordAudio.src = getPronunciationUrl(word);
    wordAudio.onerror = () => {
      playBrowserSpeech(word);
    };
    const playResult = wordAudio.play();
    playResult?.catch?.(() => {
      playBrowserSpeech(word);
    });
  }

  return {
    handlePlayWordSound,
  };
}

export interface PlayOptions {
  times?: number;
  rate?: number;
  interval?: number;
}

const DefaultPlayOptions = {
  times: 1,
  rate: 1,
  interval: 500,
};

export function play(playOptions?: PlayOptions) {
  const { times, rate, interval } = Object.assign({}, DefaultPlayOptions, playOptions);

  audio.playbackRate = rate;
  let stopBrowserSpeech = () => {};
  let didFallback = false;

  function playFallback() {
    if (didFallback) return;
    didFallback = true;
    stopBrowserSpeech = playBrowserSpeech(fallbackText, { rate });
  }

  audio.onerror = playFallback;

  const playResult = audio.play();
  playResult?.catch?.(playFallback);

  if (times > 1) {
    audio.addEventListener("ended", handleEnded, false);
  }

  let index = 1;
  let timeoutId: NodeJS.Timeout;
  function handleEnded() {
    timeoutId = setTimeout(() => {
      if (index < times) {
        audio.play();
        index++;
      } else {
        index = 1;
        audio.removeEventListener("ended", handleEnded);
      }
    }, interval);
  }

  return () => {
    audio.pause();
    audio.currentTime = 0;
    audio.removeEventListener("ended", handleEnded);
    stopBrowserSpeech();
    timeoutId && clearTimeout(timeoutId);
  };
}

function playBrowserSpeech(text: string, options?: Pick<PlayOptions, "rate">) {
  const speechSynthesis = globalThis.speechSynthesis;
  const Utterance = globalThis.SpeechSynthesisUtterance;

  if (!text || !speechSynthesis || !Utterance) {
    return () => {};
  }

  const utterance = new Utterance(text);
  utterance.lang = "en-US";
  utterance.rate = options?.rate ?? 1;

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);

  return () => {
    speechSynthesis.cancel();
  };
}

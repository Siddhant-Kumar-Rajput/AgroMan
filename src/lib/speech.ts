const nativeLocales: Record<string, string> = {
  en: "en-IN",
  as: "as-IN",
  bn: "bn-IN",
  brx: "brx-IN",
  doi: "doi-IN",
  gu: "gu-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  ks: "ks-IN",
  kok: "kok-IN",
  mai: "mai-IN",
  ml: "ml-IN",
  "mni-Mtei": "mni-IN",
  mr: "mr-IN",
  ne: "ne-NP",
  or: "or-IN",
  pa: "pa-IN",
  sa: "sa-IN",
  sat: "sat-IN",
  sd: "sd-IN",
  ta: "ta-IN",
  te: "te-IN",
  ur: "ur-IN",
};

export const offlineSpeechLocales: Readonly<Record<string, string>> = {
  as: "as",
  bn: "bn",
  gu: "gu",
  hi: "hi",
  kn: "kn",
  kok: "kok",
  ml: "ml",
  mr: "mr",
  ne: "ne",
  or: "or",
  pa: "pa",
  sd: "sd",
  ta: "ta",
  te: "te",
  ur: "ur",
};

type EspeakWorker = {
  samplerate: number;
  rate: number;
  set_voice: (name: string, language: string) => void;
  synthesize: (text: string, callback: (audio: Int16Array) => boolean) => void;
};

type EspeakModule = {
  eSpeakNGWorker: new () => EspeakWorker;
};

let modulePromise: Promise<EspeakModule> | undefined;
let audioContext: AudioContext | undefined;
let activeSource: AudioBufferSourceNode | undefined;

function cleanForSpeech(text: string) {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*#_`>|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function waitForNativeVoices() {
  const synth = window.speechSynthesis;
  const current = synth.getVoices();
  if (current.length) return Promise.resolve(current);
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const finish = () => {
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish, { once: true });
    window.setTimeout(finish, 400);
  });
}

function findNativeVoice(voices: SpeechSynthesisVoice[], locale: string) {
  const requested = (nativeLocales[locale] ?? locale).toLowerCase();
  const language = locale.toLowerCase();
  return voices.find((voice) => {
    const available = voice.lang.toLowerCase();
    return available === requested || available.startsWith(`${language}-`);
  });
}

async function speakNatively(text: string, locale: string) {
  if (!("speechSynthesis" in window)) return false;
  const voices = await waitForNativeVoices();
  const voice = findNativeVoice(voices, locale);
  // English may safely use the browser default. Other languages must never
  // silently fall back to an English voice.
  if (!voice && locale !== "en") return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = nativeLocales[locale] ?? locale;
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

async function getEspeak() {
  modulePromise ??= (async () => {
    // Fetching first keeps Vite from trying to bundle the generated module.
    // Its 24 MB language data remains a separate, lazy-loaded asset.
    const response = await fetch("/espeak/espeak-ng.js");
    if (!response.ok) throw new Error("Speech engine could not be loaded.");
    const originalSource = await response.text();
    const moduleSource = originalSource.replace(
      "let currentModuleUrl = import.meta.url",
      "let currentModuleUrl = globalThis.location.origin + '/espeak/espeak-ng.js'",
    );
    if (moduleSource === originalSource)
      throw new Error("Speech engine asset format is unsupported.");
    const blobUrl = URL.createObjectURL(
      new Blob([moduleSource], { type: "text/javascript" }),
    );
    try {
      const loaded = await import(/* @vite-ignore */ blobUrl);
      return (await loaded.default()) as EspeakModule;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  })();
  return modulePromise;
}

async function speakOffline(text: string, locale: string) {
  const voice = offlineSpeechLocales[locale];
  if (!voice) return false;
  const module = await getEspeak();
  const worker = new module.eSpeakNGWorker();
  worker.set_voice("", voice);
  worker.rate = 155;
  const chunks: Int16Array[] = [];
  worker.synthesize(text, (chunk) => {
    if (chunk.length) chunks.push(chunk);
    // eSpeak treats a truthy callback result as "stop synthesis". Returning
    // false lets it deliver every audio chunk for the full sentence.
    return false;
  });
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  if (!length) return false;
  audioContext ??= new AudioContext();
  if (audioContext.state === "suspended") await audioContext.resume();
  activeSource?.stop();
  const buffer = audioContext.createBuffer(1, length, worker.samplerate);
  const channel = buffer.getChannelData(0);
  let offset = 0;
  for (const chunk of chunks) {
    for (let index = 0; index < chunk.length; index += 1)
      channel[offset + index] = chunk[index] / 32768;
    offset += chunk.length;
  }
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.onended = () => {
    if (activeSource === source) activeSource = undefined;
  };
  activeSource = source;
  source.start();
  return true;
}

export async function speakText(text: string, locale: string) {
  const clean = cleanForSpeech(text);
  if (!clean) return false;
  if (await speakNatively(clean, locale)) return true;
  return speakOffline(clean, locale);
}

export function stopSpeech() {
  window.speechSynthesis?.cancel();
  activeSource?.stop();
  activeSource = undefined;
}

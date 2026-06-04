import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceInputButton({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string, opts: { final: boolean }) => void;
  disabled?: boolean;
}) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef<string>("");

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const toggle = () => {
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      toast.error("Seu navegador não suporta ditado por voz. Tente no Chrome.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = "";

    rec.onresult = (e) => {
      let finalChunk = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) finalChunk += txt;
        else interim += txt;
      }
      if (finalChunk) {
        baseRef.current = (baseRef.current + " " + finalChunk).trim();
        onTranscript(baseRef.current, { final: false });
      } else {
        const combined = (baseRef.current + " " + interim).trim();
        onTranscript(combined, { final: false });
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("Permissão de microfone negada.");
      } else if (e.error !== "aborted" && e.error !== "no-speech") {
        toast.error(`Erro no microfone: ${e.error}`);
      }
    };
    rec.onend = () => {
      setListening(false);
      if (baseRef.current) onTranscript(baseRef.current, { final: true });
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      toast.error("Não foi possível iniciar o microfone.");
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? "Parar gravação" : "Falar"}
      aria-pressed={listening}
      className={`h-9 w-9 inline-flex items-center justify-center rounded-md border border-border transition-colors ${
        listening
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "bg-background hover:bg-accent text-muted-foreground hover:text-foreground"
      } disabled:opacity-50`}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}

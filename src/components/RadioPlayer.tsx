"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteConfig } from "@/lib/site";
import Icon from "./Icon";
export default function RadioPlayer({ site }: { site: SiteConfig }) {
  const audio = useRef<HTMLAudioElement>(null);
  const wanted = useRef(false);
  const retry = useRef(0);
  const epoch = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [message, setMessage] = useState("");
  const setPlayback = useCallback((value: boolean) => {
    setPlaying(value);
    window.dispatchEvent(new CustomEvent("idblet:radio-state", { detail: value }));
  }, []);
  const cancelTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  const recover = useCallback(
    function reconnect() {
      if (!wanted.current || !site.streamUrl || timer.current) return;
      setPlayback(false);
      if (retry.current >= 3) {
        wanted.current = false;
        setMessage("Sem conexão. Clique em play para tentar.");
        return;
      }
      const attempt = ++retry.current;
      const generation = epoch.current;
      setMessage(`Reconectando… ${attempt}/3`);
      timer.current = setTimeout(
        async () => {
          timer.current = null;
          if (!wanted.current || generation !== epoch.current || !audio.current) return;
          audio.current.load();
          try {
            await audio.current.play();
          } catch (error) {
            if (!wanted.current || generation !== epoch.current) return;
            if (error instanceof DOMException && error.name === "NotAllowedError") {
              wanted.current = false;
              setMessage("Clique em play para permitir o áudio.");
            } else reconnect();
          }
        },
        [4000, 8000, 12000][attempt - 1],
      );
    },
    [site.streamUrl, setPlayback],
  );
  const toggle = useCallback(async () => {
    if (!audio.current || !site.streamUrl) return;
    if (wanted.current) {
      wanted.current = false;
      epoch.current++;
      cancelTimer();
      retry.current = 0;
      audio.current.pause();
      setPlayback(false);
      setMessage("");
      return;
    }
    wanted.current = true;
    const generation = ++epoch.current;
    retry.current = 0;
    setMessage("Conectando ao AutoDJ…");
    try {
      await audio.current.play();
    } catch (error) {
      if (!wanted.current || generation !== epoch.current) return;
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        wanted.current = false;
        setMessage("Clique em play para permitir o áudio.");
      } else recover();
    }
  }, [site.streamUrl, cancelTimer, setPlayback, recover]);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume / 100;
  }, [volume]);
  useEffect(() => {
    wanted.current = false;
    epoch.current++;
    retry.current = 0;
    cancelTimer();
    setMessage("");
    setPlayback(false);
    return () => {
      wanted.current = false;
      epoch.current++;
      cancelTimer();
    };
  }, [site.streamUrl, cancelTimer, setPlayback]);
  useEffect(() => {
    const handle = () => {
      void toggle();
    };
    const report = () =>
      window.dispatchEvent(
        new CustomEvent("idblet:radio-state", {
          detail: !!audio.current && !audio.current.paused && audio.current.readyState >= 3,
        }),
      );
    window.addEventListener("idblet:toggle-radio", handle);
    window.addEventListener("idblet:request-radio-state", report);
    return () => {
      window.removeEventListener("idblet:toggle-radio", handle);
      window.removeEventListener("idblet:request-radio-state", report);
    };
  }, [toggle]);
  return (
    <aside className="compact-player frequency-player" aria-label="Player da rádio">
      <audio
        ref={audio}
        src={site.streamUrl || undefined}
        preload="none"
        onPlaying={() => {
          if (!wanted.current) {
            audio.current?.pause();
            return;
          }
          cancelTimer();
          retry.current = 0;
          setMessage("");
          setPlayback(true);
        }}
        onPause={() => setPlayback(false)}
        onEnded={recover}
        onStalled={recover}
        onWaiting={() => {
          if (wanted.current) {
            setPlayback(false);
            recover();
          }
        }}
        onError={recover}
      />
      <span className="player-monogram">iB</span>
      <div className="player-track">
        <strong>
          {site.dj}
          <span className={`playback-dot ${playing ? "active" : ""}`} />
        </strong>
        <small role="status">
          {message || (!site.streamUrl ? "Rádio em preparação" : site.show)}
        </small>
      </div>
      <button
        className="player-toggle"
        disabled={!site.streamUrl}
        title={!site.streamUrl ? "Transmissão em preparação" : undefined}
        onClick={() => void toggle()}
        aria-label={playing ? "Pausar rádio" : "Tocar rádio"}
        aria-pressed={playing}
      >
        <Icon name={playing ? "pause" : "play"} size={19} />
      </button>
      <div className="player-volume">
        <Icon name="volume" size={17} />
        <input
          type="range"
          aria-label="Volume"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>
      <span className="player-listeners">
        <Icon name="headphones" size={15} />
        {site.listeners}
      </span>
    </aside>
  );
}

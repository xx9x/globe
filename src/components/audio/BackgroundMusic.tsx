"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Site-wide background music with a persistent mute control.
 *
 * - Mounted in the root layout, so playback continues across page navigations.
 * - Browsers block audible autoplay, so the track starts on the visitor's first
 *   click / tap / key press (unless they've muted it before).
 * - The mute choice is remembered in localStorage.
 * - If the audio file is missing or can't play, the control hides itself.
 *
 * Add the track at /public/audio/sunrise.mp3 (you must hold the rights to use it).
 */

const TRACK = { src: "/audio/sunrise.mp3", title: "Sunrise", artist: "Leadwave" };
const VOLUME = 0.35;
const STORAGE_KEY = "globe:music-muted";

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* storage unavailable (private mode) — preference just isn't remembered */
  }
}

export function BackgroundMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const fadeFrame = useRef<number | null>(null);
  const [available, setAvailable] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  /** Smoothly ramps volume, then optionally pauses. */
  const fadeTo = useCallback((target: number, then?: () => void) => {
    const el = audio.current;
    if (!el) return;
    if (fadeFrame.current) cancelAnimationFrame(fadeFrame.current);
    const from = el.volume;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 900);
      el.volume = Math.min(1, Math.max(0, from + (target - from) * k));
      if (k < 1) fadeFrame.current = requestAnimationFrame(step);
      else then?.();
    };
    fadeFrame.current = requestAnimationFrame(step);
  }, []);

  const start = useCallback(async () => {
    const el = audio.current;
    if (!el) return false;
    if (!el.paused) {
      fadeTo(VOLUME);
      return true;
    }
    try {
      if (fadeFrame.current) cancelAnimationFrame(fadeFrame.current);
      el.volume = 0;
      await el.play();
      fadeTo(VOLUME);
      return true;
    } catch {
      return false; // blocked until a user gesture
    }
  }, [fadeTo]);

  // The element may finish loading (or fail) before React attaches its handlers.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    if (el.error) setAvailable(false);
    else if (el.readyState >= 1) setAvailable(true);
  }, []);

  // Initial state: honour a saved mute; otherwise begin on the first interaction.
  useEffect(() => {
    const wasMuted = readMuted();
    setMuted(wasMuted);
    if (wasMuted) return;

    let done = false;
    const onGesture = async (e: Event) => {
      // Let the mute button handle its own click.
      if ((e.target as HTMLElement | null)?.closest?.("[data-music-toggle]")) return;
      if (done) return;
      done = await start();
      if (done) remove();
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const remove = () => events.forEach((ev) => window.removeEventListener(ev, onGesture));
    events.forEach((ev) => window.addEventListener(ev, onGesture, { passive: true }));
    start().then((ok) => {
      if (ok) {
        done = true;
        remove();
      }
    });
    return remove;
  }, [start]);

  useEffect(() => () => {
    if (fadeFrame.current) cancelAnimationFrame(fadeFrame.current);
  }, []);

  const toggle = async () => {
    const el = audio.current;
    if (!el) return;
    if (muted || el.paused) {
      setMuted(false);
      saveMuted(false);
      await start();
    } else {
      setMuted(true);
      saveMuted(true);
      fadeTo(0, () => el.pause());
    }
  };

  const label = playing ? "Mute music" : "Play music";

  return (
    <>
      <audio
        ref={audio}
        src={TRACK.src}
        loop
        preload="metadata"
        onCanPlay={() => setAvailable(true)}
        onLoadedMetadata={() => setAvailable(true)}
        onError={() => setAvailable(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {available && (
        <button
          type="button"
          data-music-toggle
          onClick={toggle}
          aria-label={label}
          aria-pressed={!playing}
          title={`${label} — “${TRACK.title}” by ${TRACK.artist}`}
          className="group fixed bottom-5 right-5 z-[60] flex h-11 items-center gap-2.5 rounded-full border border-line bg-bg/75 pl-3.5 pr-4 text-[12.5px] font-medium text-muted shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-[border-color,color,background-color] duration-200 animate-fade hover:border-[#444] hover:bg-surface hover:text-fg sm:bottom-6 sm:right-6"
        >
          <Equalizer active={playing} />
          <span className="hidden sm:inline">
            {playing ? (
              <>
                <span className="text-fg">{TRACK.title}</span> · {TRACK.artist}
              </>
            ) : (
              "Sound off"
            )}
          </span>
          {playing ? <Volume2 className="size-4 text-fg" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
        </button>
      )}
    </>
  );
}

/** Four dotted bars that bounce while music plays (static when paused or with reduced motion). */
function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="flex h-3.5 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-[2px] origin-bottom rounded-full bg-current ${active ? "motion-safe:animate-[eq_1.1s_ease-in-out_infinite]" : ""}`}
          style={{ height: "100%", transform: active ? undefined : "scaleY(0.25)", animationDelay: `${i * -0.27}s` }}
        />
      ))}
    </span>
  );
}

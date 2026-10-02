"use client";

import { useEffect } from "react";

/** Ниже этой частоты кадров при прокрутке включается облегчённый режим. */
const MIN_FPS = 45;
/** Сколько прокрутки набрать для вердикта: первые жесты дают и декодирование фото, и анимации появления. */
const SAMPLE_MS = 1500;
/** Пауза между событиями прокрутки, после которой жест считается законченным. */
const IDLE_MS = 200;
/** Один кадр дольше этого — это не прокрутка, а пауза вкладки; в замер не идёт. */
const MAX_FRAME_MS = 250;
/** Сколько помнить вердикт: машина та же, но браузер и драйверы обновляются. */
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "heritage-perf-lite";

function enableLite() {
  document.documentElement.dataset.perf = "lite";
}

function rememberedLite() {
  try {
    const at = Number(localStorage.getItem(STORAGE_KEY));
    return at > 0 && Date.now() - at < REMEMBER_MS;
  } catch {
    return false;
  }
}

/**
 * Облегчённый режим для машин, которые не тянут эффекты страницы.
 *
 * Прокрутку на десктопе тормозит не фото, а то, что сверху: размытие вуалей у краёв окна,
 * зерно на весь экран и стекло шапки — их видеокарта пересобирает каждый кадр. На слабой
 * встроенной графике это десятки миллисекунд на кадр. Компонент меряет частоту кадров
 * на первых секундах прокрутки и, если она ниже MIN_FPS, ставит data-perf="lite" на <html>:
 * globals.css выключает там то же, что на телефоне. Вердикт запоминается, чтобы на
 * следующих страницах не тормозить заново.
 */
export function PerfGuard() {
  useEffect(() => {
    if (rememberedLite()) {
      enableLite();
      return;
    }

    let frames = 0;
    let sampled = 0;
    let last = 0;
    let lastScroll = 0;
    let raf = 0;
    let done = false;

    const tick = (now: number) => {
      const gap = now - last;
      if (last && gap < MAX_FRAME_MS) {
        frames += 1;
        sampled += gap;
      }
      last = now;

      if (sampled >= SAMPLE_MS) {
        finish((frames * 1000) / sampled < MIN_FPS);
        return;
      }
      // Жест закончился — ждём следующего, иначе в замер пойдут кадры простоя
      raf = now - lastScroll < IDLE_MS ? requestAnimationFrame(tick) : 0;
    };

    const onScroll = () => {
      lastScroll = performance.now();
      if (!raf && !done) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const finish = (lite: boolean) => {
      done = true;
      raf = 0;
      window.removeEventListener("scroll", onScroll);
      if (!lite) return;
      enableLite();
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // Без хранилища режим продержится до перезагрузки — тоже годится
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      done = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}

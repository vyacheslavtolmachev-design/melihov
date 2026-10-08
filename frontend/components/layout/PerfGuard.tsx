"use client";

import { useEffect, useSyncExternalStore } from "react";

/** Ниже этой частоты кадров при прокрутке или движении мыши включается облегчённый режим. */
const MIN_FPS = 45;
/** Сколько кадров жеста набрать для вердикта: первые жесты дают и декодирование фото, и анимации появления. */
const SAMPLE_MS = 1500;
/** Пауза между событиями ввода, после которой жест считается законченным. */
const IDLE_MS = 200;
/**
 * Кадр дольше этого засчитывается как этот. Одиночная заминка (декодирование фото, сборка
 * мусора) не решает вердикт, а стабильно медленные кадры всё равно тянут среднее вниз.
 * Отбрасывать длинные кадры нельзя: раньше так и было (порог 250 мс), и на самой слабой
 * машине выборка не набиралась вовсе. Паузу вкладки отдельно ловить не нужно — за ней
 * жест уже закончился (IDLE_MS), и интервал в замер не попадает.
 */
const MAX_FRAME_MS = 100;
/** Сколько помнить вердикт: машина та же, но браузер и драйверы обновляются. */
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "heritage-perf-lite";

/**
 * Жесты меряются порознь. Прокрутка нагружает вуали и стекло над контентом, движение мыши —
 * пыльцу на главной. Общий счёт дал бы вердикт «не тормозит» по дешёвому движению мыши
 * над каталогом раньше, чем дошло бы до прокрутки.
 */
const GESTURES = ["scroll", "pointer"] as const;
type Gesture = (typeof GESTURES)[number];

function isLite() {
  return document.documentElement.dataset.perf === "lite";
}

function enableLite() {
  document.documentElement.dataset.perf = "lite";
}

function subscribeLite(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-perf"] });
  return () => observer.disconnect();
}

/** Включён ли облегчённый режим — для того, что CSS выключить не может (WebGL в герое). */
export function usePerfLite() {
  return useSyncExternalStore(subscribeLite, isLite, () => false);
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
 * Тормозят не фото, а то, что сверху: размытие вуалей у краёв окна, зерно на весь экран,
 * стекло шапки и плиток, пыльца в герое — их видеокарта пересобирает каждый кадр. На слабой
 * встроенной графике и на экране с высокой плотностью это десятки миллисекунд на кадр.
 * Компонент меряет частоту кадров на первых секундах прокрутки и движения мыши и, если она
 * ниже MIN_FPS, ставит data-perf="lite" на <html>: globals.css выключает там то же, что на
 * телефоне, а герой показывает статичный кадр вместо пыльцы. Вердикт запоминается, чтобы
 * на следующих страницах не тормозить заново.
 */
export function PerfGuard() {
  useEffect(() => {
    if (rememberedLite()) {
      enableLite();
      return;
    }

    const samples: Record<Gesture, { frames: number; time: number; done: boolean }> = {
      scroll: { frames: 0, time: 0, done: false },
      pointer: { frames: 0, time: 0, done: false },
    };
    const lastInput: Record<Gesture, number> = { scroll: 0, pointer: 0 };
    let last = 0;
    let raf = 0;

    // Кадр засчитывается жесту, который сейчас идёт; прокрутка важнее движения мыши
    const activeGesture = (now: number) =>
      GESTURES.find((gesture) => !samples[gesture].done && now - lastInput[gesture] < IDLE_MS);

    const tick = (now: number) => {
      raf = 0;
      const gesture = activeGesture(now);
      // Жест закончился — ждём следующего, иначе в замер пойдут кадры простоя
      if (!gesture) {
        last = 0;
        return;
      }

      const gap = last ? Math.min(now - last, MAX_FRAME_MS) : 0;
      last = now;
      if (gap > 0) {
        const sample = samples[gesture];
        sample.frames += 1;
        sample.time += gap;

        if (sample.time >= SAMPLE_MS) {
          sample.done = true;
          if ((sample.frames * 1000) / sample.time < MIN_FPS) {
            finish(true);
            return;
          }
          if (GESTURES.every((name) => samples[name].done)) {
            finish(false);
            return;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    const onInput = (gesture: Gesture) => {
      if (samples[gesture].done) return;
      lastInput[gesture] = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => onInput("scroll");
    const onPointer = () => onInput("pointer");

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };

    const finish = (lite: boolean) => {
      stop();
      if (!lite) return;
      enableLite();
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // Без хранилища режим продержится до перезагрузки — тоже годится
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    return stop;
  }, []);

  return null;
}

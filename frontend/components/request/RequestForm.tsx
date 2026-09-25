"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import {
  clearRequestList,
  getRequestListServerSnapshot,
  getRequestListSnapshot,
  subscribeRequestList,
} from "@/lib/request-list";
import { site } from "@/lib/site";

type FormState = {
  name: string;
  phone: string;
  email: string;
  messenger: string;
  comment: string;
};

const initial: FormState = {
  name: "",
  phone: "",
  email: "",
  messenger: "",
  comment: "",
};

export function RequestForm({ intent = "order" }: { intent?: "order" | "consult" }) {
  const items = useSyncExternalStore(
    subscribeRequestList,
    getRequestListSnapshot,
    getRequestListServerSnapshot,
  );
  const [form, setForm] = useState<FormState>(initial);
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Пока без бэкенда: фиксируем заявку локально и очищаем лист заказа.
    setSent(true);
    if (intent === "order") {
      clearRequestList();
    }
    setForm(initial);
  }

  if (sent) {
    return (
      <div className="glass-strong p-8 md:p-10">
        <h2 className="font-display text-[22px]">Заявка принята</h2>
        <p className="mt-4 text-[15.5px] leading-relaxed text-fg-soft">
          Мы свяжемся с вами по указанному контакту. Пока форма работает в демонстрационном режиме — для срочной
          связи используйте{" "}
          <a href={site.contacts.phoneHref} className="text-gold transition-colors hover:text-gold-light">
            {site.contacts.phone}
          </a>
          .
        </p>
        <button type="button" className="btn btn-ghost mt-8" onClick={() => setSent(false)}>
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass-strong p-8 md:p-10">
      <h2 className="font-display text-[22px]">
        {intent === "consult" ? "Заявка на подбор сада" : "Форма связи"}
      </h2>
      <p className="mt-3 text-[14.5px] leading-relaxed text-fg-muted">
        {intent === "consult"
          ? "Опишите участок и задачу — вернёмся с вопросами и предложением по сортам."
          : "Укажите контакты и комментарий. Если добавили сорта в лист — они уйдут вместе с заявкой."}
      </p>

      {intent === "order" && items.length > 0 && (
        <p className="mt-5 border border-gold/20 bg-gold/6 px-4 py-3 text-[13.5px] text-fg-soft">
          В заявке: {items.map((item) => `${item.title} × ${item.quantity}`).join(", ")}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px] text-fg-muted">
          Имя
          <input
            required
            name="name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-xl border border-white/12 bg-bg-deep/40 px-4 py-3 text-[15px] text-fg outline-none transition-colors focus:border-gold/40"
          />
        </label>
        <label className="flex flex-col gap-2 text-[13px] text-fg-muted">
          Телефон
          <input
            required
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="rounded-xl border border-white/12 bg-bg-deep/40 px-4 py-3 text-[15px] text-fg outline-none transition-colors focus:border-gold/40"
          />
        </label>
        <label className="flex flex-col gap-2 text-[13px] text-fg-muted">
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-xl border border-white/12 bg-bg-deep/40 px-4 py-3 text-[15px] text-fg outline-none transition-colors focus:border-gold/40"
          />
        </label>
        <label className="flex flex-col gap-2 text-[13px] text-fg-muted">
          Telegram / Max
          <input
            name="messenger"
            value={form.messenger}
            onChange={(event) => setForm((prev) => ({ ...prev, messenger: event.target.value }))}
            placeholder="ник или ссылка"
            className="rounded-xl border border-white/12 bg-bg-deep/40 px-4 py-3 text-[15px] text-fg outline-none transition-colors focus:border-gold/40"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-[13px] text-fg-muted">
        Комментарий
        <textarea
          name="comment"
          rows={4}
          value={form.comment}
          onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
          placeholder={
            intent === "consult"
              ? "Регион, размер участка, желаемые культуры…"
              : "Сроки самовывоза, пожелания по сортам…"
          }
          className="rounded-xl border border-white/12 bg-bg-deep/40 px-4 py-3 text-[15px] text-fg outline-none transition-colors focus:border-gold/40"
        />
      </label>

      <button type="submit" className="btn btn-gold mt-8">
        Отправить заявку
      </button>
    </form>
  );
}

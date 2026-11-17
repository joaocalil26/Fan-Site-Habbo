"use client";
import { useActionState, useState } from "react";
import { saveAppearance } from "@/actions/appearance";
import { seasons, type Season, type SeasonalConfig } from "@/lib/seasonal-config";
import SeasonPixel from "./SeasonPixel";
export default function AppearanceForm({ initial }: { initial: SeasonalConfig }) {
  const [state, action, pending] = useActionState(saveAppearance, {});
  const [theme, setTheme] = useState<Season>(initial.theme);
  const [motion, setMotion] = useState(initial.motion);
  return (
    <form action={action} className="appearance-form">
      <div className="appearance-summary">
        <span>
          <SeasonPixel name={seasons[initial.theme].icon} size={23} />
          Tema ativo: <strong>{seasons[initial.theme].label}</strong>
        </span>
        <small>A ativação é manual e vale para todas as páginas públicas.</small>
      </div>
      <fieldset>
        <legend>Escolha a decoração do IdBlet</legend>
        <div className="season-options">
          {(Object.entries(seasons) as [Season, (typeof seasons)[Season]][]).map(([id, option]) => (
            <label
              className={`season-option season-option-${id}`}
              key={id}
              data-selected={theme === id}
            >
              <input
                type="radio"
                name="theme"
                value={id}
                checked={theme === id}
                onChange={() => setTheme(id)}
              />
              <span className="season-option-art">
                <SeasonPixel name={option.icon} size={42} />
              </span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={`season-preview preview-${theme}`} data-motion={motion ? "on" : "off"}>
        <div>
          <span className="overline">PRÉVIA DA DECORAÇÃO</span>
          <h2>
            {theme === "none"
              ? "Seu IdBlet, do jeito de sempre."
              : `${seasons[theme].label} no IdBlet`}
          </h2>
          <p>
            {theme === "none"
              ? "Detalhes em pixel art e o tema dourado original."
              : seasons[theme].description}
          </p>
        </div>
        <span className="preview-pixels">
          <SeasonPixel name={seasons[theme].icon} size={52} />
          <SeasonPixel
            name={
              theme === "halloween"
                ? "ghost"
                : theme === "easter"
                  ? "bunny"
                  : theme === "junina"
                    ? "flag"
                    : theme === "christmas"
                      ? "gift"
                      : "sparkle"
            }
            size={38}
          />
        </span>
      </div>
      <label className="season-motion">
        <input
          type="checkbox"
          name="motion"
          checked={motion}
          onChange={(e) => setMotion(e.target.checked)}
        />
        <span>
          <strong>Ativar animações suaves</strong>
          <small>
            Desligue para manter apenas os enfeites estáticos. A preferência de movimento reduzido
            do visitante é respeitada.
          </small>
        </span>
      </label>
      <div className="appearance-actions">
        <button className="primary-button" disabled={pending}>
          {pending ? "Aplicando…" : "Aplicar tema no site"}
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer">
          Ver o site ↗
        </a>
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}

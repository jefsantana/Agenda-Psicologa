import { useEffect } from "react";
import { supabase } from "./supabaseClient.js";

const LIMITE_INATIVIDADE_MS = 30 * 60 * 1000; // 30 min — requisito de LGPD/CFP do produto
const EVENTOS_DE_ATIVIDADE = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

/** Desloga automaticamente após LIMITE_INATIVIDADE_MS sem interação, enquanto `ativo` for true. */
export function useInactivityLogout(ativo) {
  useEffect(() => {
    if (!ativo) return;

    let timer = agendarLogout();

    function agendarLogout() {
      return setTimeout(() => supabase.auth.signOut(), LIMITE_INATIVIDADE_MS);
    }

    function reiniciarTimer() {
      clearTimeout(timer);
      timer = agendarLogout();
    }

    EVENTOS_DE_ATIVIDADE.forEach((evento) => window.addEventListener(evento, reiniciarTimer));

    return () => {
      clearTimeout(timer);
      EVENTOS_DE_ATIVIDADE.forEach((evento) => window.removeEventListener(evento, reiniciarTimer));
    };
  }, [ativo]);
}

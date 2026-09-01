import { useEffect } from "react";
import { supabase } from "./supabaseClient.js";

const LIMITE_INATIVIDADE_MS = 30 * 60 * 1000; // 30 min — requisito de LGPD/CFP do produto
const EVENTOS_DE_ATIVIDADE = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
const CHAVE_ULTIMA_ATIVIDADE = "ultima_atividade";

/**
 * Desloga automaticamente após LIMITE_INATIVIDADE_MS sem interação, enquanto `ativo` for true.
 *
 * Além do timer, guarda o horário da última atividade e reconfere sempre que a
 * aba volta ao foco — assim um notebook que ficou suspenso (ou a aba em segundo
 * plano, onde o setTimeout é estrangulado pelo navegador) desloga ao reabrir em
 * vez de esperar um novo ciclo de 30 min.
 */
export function useInactivityLogout(ativo) {
  useEffect(() => {
    if (!ativo) return;

    let timer;

    function sair() {
      try {
        localStorage.removeItem(CHAVE_ULTIMA_ATIVIDADE);
      } catch {
        // localStorage indisponível (aba privada, etc.) — segue para o signOut
      }
      supabase.auth.signOut();
    }

    function registrarAtividade() {
      try {
        localStorage.setItem(CHAVE_ULTIMA_ATIVIDADE, String(Date.now()));
      } catch {
        // sem persistência: o timer abaixo ainda cobre o caso comum
      }
      clearTimeout(timer);
      timer = setTimeout(sair, LIMITE_INATIVIDADE_MS);
    }

    function conferirAoVoltar() {
      if (document.visibilityState !== "visible") return;
      let ultima = 0;
      try {
        ultima = Number(localStorage.getItem(CHAVE_ULTIMA_ATIVIDADE)) || 0;
      } catch {
        ultima = 0;
      }
      if (ultima && Date.now() - ultima >= LIMITE_INATIVIDADE_MS) {
        sair();
      } else {
        registrarAtividade();
      }
    }

    registrarAtividade();
    EVENTOS_DE_ATIVIDADE.forEach((evento) => window.addEventListener(evento, registrarAtividade));
    document.addEventListener("visibilitychange", conferirAoVoltar);
    window.addEventListener("focus", conferirAoVoltar);

    return () => {
      clearTimeout(timer);
      EVENTOS_DE_ATIVIDADE.forEach((evento) => window.removeEventListener(evento, registrarAtividade));
      document.removeEventListener("visibilitychange", conferirAoVoltar);
      window.removeEventListener("focus", conferirAoVoltar);
    };
  }, [ativo]);
}

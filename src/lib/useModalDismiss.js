import { useEffect, useRef } from "react";

/*
  Comportamento de teclado e foco compartilhado por todas as folhas/modais
  (`.sheet`). Enquanto a folha está aberta:

  - Esc fecha (chama `aoFechar`);
  - o foco fica preso dentro do painel — Tab no último elemento volta para o
    primeiro, Shift+Tab no primeiro vai para o último;
  - ao abrir, o foco vai para o primeiro campo interativo do painel; ao fechar,
    volta para o elemento que abriu a folha (o botão que o usuário clicou);
  - a rolagem do fundo fica travada, para o gesto de rolar não "vazar" para a
    página atrás da folha.

  `aoFechar` costuma ser uma arrow function recriada a cada render do componente
  pai; por isso ela é lida através de uma ref e o efeito depende só de `aberto`.
*/

const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
  Decide, para um Tab preso dentro do modal, qual índice da lista de elementos
  focáveis deve receber o foco — ou `null` quando o Tab pode seguir seu curso
  normal. Função pura para poder ser testada sem DOM.
*/
export function proximoFoco(total, indiceAtivo, shift) {
  if (total <= 0) return null;
  const foraDoModal = indiceAtivo < 0;
  if (shift && (foraDoModal || indiceAtivo === 0)) return total - 1;
  if (!shift && (foraDoModal || indiceAtivo === total - 1)) return 0;
  return null;
}

export function useModalDismiss(aberto, aoFechar, painelRef) {
  const fecharRef = useRef(aoFechar);
  useEffect(() => {
    fecharRef.current = aoFechar;
  });

  useEffect(() => {
    if (!aberto) return undefined;

    const painel = painelRef.current;
    const abridor = document.activeElement;

    const listar = () =>
      painel
        ? [...painel.querySelectorAll(SELETOR_FOCAVEIS)].filter(
            (el) => el.offsetParent !== null || el === document.activeElement,
          )
        : [];

    const iniciais = listar();
    if (iniciais.length) iniciais[0].focus();

    function aoTeclar(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        fecharRef.current();
        return;
      }
      if (event.key !== "Tab" || !painel) return;
      const itens = listar();
      const alvo = proximoFoco(
        itens.length,
        itens.indexOf(document.activeElement),
        event.shiftKey,
      );
      if (alvo !== null) {
        event.preventDefault();
        itens[alvo].focus();
      }
    }

    document.addEventListener("keydown", aoTeclar, true);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      document.body.style.overflow = overflowAntes;
      if (abridor instanceof HTMLElement && document.contains(abridor)) {
        abridor.focus();
      }
    };
  }, [aberto, painelRef]);
}

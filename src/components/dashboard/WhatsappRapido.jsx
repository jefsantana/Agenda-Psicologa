import { useEffect, useRef, useState } from "react";
import SemanaTira from "../agenda/SemanaTira.jsx";
import WhatsappSheet from "../pacientes/WhatsappSheet.jsx";
import { IconeWhatsapp } from "./icons.jsx";
import { buscarAtendimentosParaWhatsapp } from "../../lib/dashboard.js";
import { buscarPacientes } from "../../lib/pacientes.js";
import { formatarHora } from "../../lib/date.js";
import { useModalDismiss } from "../../lib/useModalDismiss.js";
import "./WhatsappRapido.css";

export default function WhatsappRapido({ aberto, aoFechar }) {
  const [dia, setDia] = useState(new Date());
  const [atendimentos, setAtendimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setDia(new Date());
    setBusca("");
    setResultadosBusca([]);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
    const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);
    buscarAtendimentosParaWhatsapp(inicioDia, fimDia)
      .then(setAtendimentos)
      .catch(() => setAtendimentos([]))
      .finally(() => setCarregando(false));
  }, [aberto, dia]);

  useEffect(() => {
    if (!aberto || !busca.trim()) {
      setResultadosBusca([]);
      return;
    }
    setBuscando(true);
    const id = setTimeout(() => {
      buscarPacientes(busca.trim())
        .then((lista) => setResultadosBusca(lista.filter((p) => p.telefone).slice(0, 8)))
        .catch(() => setResultadosBusca([]))
        .finally(() => setBuscando(false));
    }, 200);
    return () => clearTimeout(id);
  }, [busca, aberto]);

  function fechar() {
    setSelecionado(null);
    aoFechar();
  }

  const painelRef = useRef(null);
  useModalDismiss(aberto && !selecionado, fechar, painelRef);

  if (!aberto) return null;

  const buscaAtiva = busca.trim().length > 0;

  return (
    <>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Enviar WhatsApp">
        <button type="button" className="sheet__backdrop" onClick={fechar} aria-label="Fechar" />
        <div className="sheet__painel" ref={painelRef}>
          <span className="sheet__grip" aria-hidden="true" />
          <h2 className="sheet__titulo">
            <span className="whatsapp-rapido__icone">
              <IconeWhatsapp />
            </span>
            Enviar WhatsApp
          </h2>
          <p className="whatsapp-rapido__ajuda">Busque por qualquer paciente ou escolha o dia e o agendado.</p>

          <input
            type="search"
            className="field__input whatsapp-rapido__busca"
            placeholder="Buscar paciente pelo nome…"
            aria-label="Buscar paciente pelo nome"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />

          {!buscaAtiva && <SemanaTira dataSelecionada={dia} onSelecionar={setDia} />}

          <div className="whatsapp-rapido__lista">
            {buscaAtiva ? (
              buscando ? (
                <p className="whatsapp-rapido__vazio">Buscando…</p>
              ) : resultadosBusca.length === 0 ? (
                <p className="whatsapp-rapido__vazio">Nenhum paciente com telefone encontrado.</p>
              ) : (
                <ul>
                  {resultadosBusca.map((paciente) => (
                    <li key={paciente.id}>
                      <button
                        type="button"
                        className="whatsapp-rapido__paciente"
                        onClick={() => setSelecionado({ paciente })}
                      >
                        <span className="whatsapp-rapido__textos">
                          <span className="whatsapp-rapido__nome">{paciente.nome}</span>
                          <span className="whatsapp-rapido__telefone">{paciente.telefone}</span>
                        </span>
                        <IconeWhatsapp className="whatsapp-rapido__seta" />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : carregando ? (
              <p className="whatsapp-rapido__vazio">Carregando…</p>
            ) : atendimentos.length === 0 ? (
              <p className="whatsapp-rapido__vazio">Nenhum paciente com telefone agendado neste dia.</p>
            ) : (
              <ul>
                {atendimentos.map((item) => (
                  <li key={item.atendimentoId}>
                    <button type="button" className="whatsapp-rapido__paciente" onClick={() => setSelecionado(item)}>
                      <span className="whatsapp-rapido__hora">{formatarHora(item.inicio)}</span>
                      <span className="whatsapp-rapido__textos">
                        <span className="whatsapp-rapido__nome">{item.paciente.nome}</span>
                        <span className="whatsapp-rapido__telefone">{item.paciente.telefone}</span>
                      </span>
                      <IconeWhatsapp className="whatsapp-rapido__seta" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sheet__acoes">
            <button type="button" className="sheet__cancelar" onClick={fechar}>
              Fechar
            </button>
          </div>
        </div>
      </div>

      <WhatsappSheet
        aberto={Boolean(selecionado)}
        paciente={selecionado?.paciente}
        proximoAtendimento={selecionado?.inicio}
        aoFechar={() => setSelecionado(null)}
      />
    </>
  );
}

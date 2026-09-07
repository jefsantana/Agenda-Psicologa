import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import WhatsappRapido from "../components/dashboard/WhatsappRapido.jsx";
import { IconeWhatsapp } from "../components/dashboard/icons.jsx";
import { buscarPerfil } from "../lib/perfil.js";
import "./MensagensPage.css";

const MODELOS_DISPONIVEIS = [
  { rotulo: "Lembrete de consulta", exemplo: "passando para lembrar da sua consulta em DD/MM às HH:MM." },
  { rotulo: "Confirmar consulta", exemplo: "podemos confirmar sua consulta em DD/MM às HH:MM?" },
  { rotulo: "Cobrança", exemplo: "passando para lembrar que há um pagamento em aberto." },
  { rotulo: "Mensagem livre", exemplo: "escreva o que quiser para o paciente." },
];

export default function MensagensPage() {
  const [perfil, setPerfil] = useState(null);
  const [whatsappAberto, setWhatsappAberto] = useState(false);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
  }, []);

  return (
    <AppShell perfil={perfil} title="Mensagens" subtitle="Modelos rápidos e conversas por WhatsApp.">
      <div className="mensagens-topo">
        <button type="button" className="mensagens-nova" onClick={() => setWhatsappAberto(true)}>
          <IconeWhatsapp />
          Nova mensagem
        </button>
      </div>

      <section className="mensagens-secao">
        <h2>Modelos rápidos</h2>
        <p className="mensagens-secao__ajuda">
          Ao escolher "Nova mensagem", busque o paciente e selecione um destes modelos — o texto já sai pronto para
          revisar e enviar pelo WhatsApp.
        </p>
        <ul className="mensagens-modelos">
          {MODELOS_DISPONIVEIS.map((modelo) => (
            <li key={modelo.rotulo} className="mensagens-modelo">
              <span className="mensagens-modelo__rotulo">{modelo.rotulo}</span>
              <span className="mensagens-modelo__exemplo">{modelo.exemplo}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mensagens-secao mensagens-secao--aviso">
        <p>Nunca envie conteúdo clínico por mensagem. Apenas horários e avisos.</p>
      </section>

      <section className="mensagens-secao mensagens-secao--indisponivel">
        <h2>Lembretes automáticos e conversas</h2>
        <p>
          Envio automático de lembretes e uma caixa de conversas com o histórico de mensagens exigem uma integração
          com a API oficial do WhatsApp Business, que ainda não está configurada. Por enquanto, cada mensagem é
          aberta manualmente pelo WhatsApp através do botão "Nova mensagem" acima.
        </p>
      </section>

      <WhatsappRapido aberto={whatsappAberto} aoFechar={() => setWhatsappAberto(false)} />
    </AppShell>
  );
}

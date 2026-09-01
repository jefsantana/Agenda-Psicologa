import { Suspense, lazy } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import { useSession } from "./lib/useSession.js";
import { useInactivityLogout } from "./lib/useInactivityLogout.js";

const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const PacientesPage = lazy(() => import("./pages/PacientesPage.jsx"));
const AgendaPage = lazy(() => import("./pages/AgendaPage.jsx"));
const AtendimentosPage = lazy(() => import("./pages/AtendimentosPage.jsx"));
const ProntuarioPage = lazy(() => import("./pages/ProntuarioPage.jsx"));
const ConveniosPage = lazy(() => import("./pages/ConveniosPage.jsx"));
const FinanceiroPage = lazy(() => import("./pages/FinanceiroPage.jsx"));
const ConfiguracoesPage = lazy(() => import("./pages/ConfiguracoesPage.jsx"));
const EmConstrucaoPage = lazy(() => import("./pages/EmConstrucaoPage.jsx"));

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<TelaCarregando />}>
        <Routes>
          <Route path="/" element={<Navigate to="/entrar" replace />} />
          <Route path="/entrar" element={<LoginPage />} />
          <Route
            path="/hoje"
            element={
              <ProtegidaPorLogin>
                <DashboardPage />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/pacientes"
            element={
              <ProtegidaPorLogin>
                <PacientesPage />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtegidaPorLogin>
                <AgendaPage />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/atendimentos"
            element={
              <ProtegidaPorLogin>
                <AtendimentosPage />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/prontuarios"
            element={
              <ProtegidaPorLogin>
                <ProntuarioPage />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/convenios"
            element={
              <ProtegidaPorLogin>
                <ConveniosPage />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/financeiro"
            element={
              <ProtegidaPorLogin>
                <FinanceiroPage />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtegidaPorLogin>
                <ConfiguracoesPage />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtegidaPorLogin>
                <EmConstrucaoPage
                  titulo="Relatórios"
                  descricao="Aqui vão ficar os relatórios de atendimentos, faturamento e convênios para fechamento do mês e envio às operadoras."
                />
              </ProtegidaPorLogin>
            }
          />
          <Route
            path="/mensagens"
            element={
              <ProtegidaPorLogin>
                <EmConstrucaoPage
                  titulo="Mensagens"
                  descricao="Aqui vai ficar a central de mensagens com pacientes — lembretes de sessão, confirmações e conversas por WhatsApp."
                />
              </ProtegidaPorLogin>
            }
          />
          <Route path="*" element={<Navigate to="/entrar" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

function TelaCarregando() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg-app-mobile)",
        color: "var(--text-3)",
        font: "500 0.9rem var(--font-body)",
      }}
    >
      Carregando…
    </div>
  );
}

function ProtegidaPorLogin({ children }) {
  const session = useSession();
  useInactivityLogout(!!session);

  if (session === undefined) return null; // ainda checando a sessão
  if (session === null) return <Navigate to="/entrar" replace />;

  return children;
}

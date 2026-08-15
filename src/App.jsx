import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PacientesPage from "./pages/PacientesPage.jsx";
import AgendaPage from "./pages/AgendaPage.jsx";
import AtendimentosPage from "./pages/AtendimentosPage.jsx";
import ProntuarioPage from "./pages/ProntuarioPage.jsx";
import ConveniosPage from "./pages/ConveniosPage.jsx";
import FinanceiroPage from "./pages/FinanceiroPage.jsx";
import ConfiguracoesPage from "./pages/ConfiguracoesPage.jsx";
import { useSession } from "./lib/useSession.js";

export default function App() {
  return (
    <HashRouter>
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
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    </HashRouter>
  );
}

function ProtegidaPorLogin({ children }) {
  const session = useSession();

  if (session === undefined) return null; // ainda checando a sessão
  if (session === null) return <Navigate to="/entrar" replace />;

  return children;
}

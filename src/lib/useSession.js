import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";

/** Acompanha a sessão de login atual (undefined = ainda carregando). */
export function useSession() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return session;
}

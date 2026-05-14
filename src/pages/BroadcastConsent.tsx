import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function BroadcastConsent() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "accept" | "decline" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Missing token.");
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke("process-broadcast-consent", {
        body: { token },
      });
      if (error || data?.error) {
        setState("error");
        setErrorMsg(data?.error ?? error?.message ?? "Could not process this link.");
        return;
      }
      setState(data.action === "accept" ? "accept" : "decline");
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center shadow-lg">
        {state === "loading" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Processing your response…</p>
          </>
        )}
        {state === "accept" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
            <h1 className="text-2xl font-bold mt-4">You're connected!</h1>
            <p className="text-muted-foreground mt-2">
              The contractor now has your contact info and can follow up directly. We've also unlocked
              their full details for you in your dashboard.
            </p>
            <Link to="/auth" className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">
              Go to my dashboard
            </Link>
          </>
        )}
        {state === "decline" && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold mt-4">Got it — no further messages</h1>
            <p className="text-muted-foreground mt-2">
              We've let the contractor know you're not interested. They won't contact you about this lead again.
            </p>
            <Link to="/" className="inline-block mt-6 px-5 py-2.5 rounded-lg border font-semibold">
              Back to home
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold mt-4">Hmm, that link didn't work</h1>
            <p className="text-muted-foreground mt-2">{errorMsg}</p>
          </>
        )}
      </div>
    </div>
  );
}

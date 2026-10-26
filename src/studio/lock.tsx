import { useState } from "react";

import { AuthShaderPanel } from "@/components/elements/auth-shader-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/utility/theme-toggle";
import { Wordmark } from "./wordmark";

/** The template's sign-in page, used as the Studio's passcode screen. */
export default function LockScreen({
  onUnlock,
  error,
  checking,
}: {
  onUnlock: (pass: string, remember: boolean) => void;
  error: string;
  checking: boolean;
}) {
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="container w-full max-w-sm self-center justify-self-center px-4 py-20 lg:px-0 lg:py-0">
        <div className="mb-6 flex items-center justify-center">
          <Wordmark size="lg" />
        </div>
        <form
          className="bg-card border-border relative flex flex-col rounded-md border p-6 shadow-none lg:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (pass.trim()) onUnlock(pass, remember);
          }}
        >
          <div aria-hidden className="from-chart-1/30 via-chart-2/15 pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r to-transparent" />
          <div className="grid gap-6">
            <p className="text-muted-foreground text-sm">Enter your Studio passcode. It is the value you saved in n8n.</p>
            <div className="grid gap-1.5">
              <Label htmlFor="pass">Passcode</Label>
              <Input
                id="pass"
                type="password"
                autoComplete="current-password"
                required
                placeholder="***********"
                className="bg-input"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                aria-invalid={error ? true : undefined}
              />
              {error ? <p className="text-destructive text-sm">{error}</p> : null}
            </div>
            <label className="text-muted-foreground flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-[var(--primary)] size-4" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember on this device
            </label>
            <Button type="submit" className="w-full shadow-none" disabled={checking}>
              {checking ? "Checking…" : "Open the Studio"}
            </Button>
          </div>
        </form>
        <div className="text-muted-foreground mt-6 flex items-center justify-center gap-3 text-center text-xs">
          <span>Private to Bernie · nothing posts without his OK</span>
          <ThemeToggle />
        </div>
      </div>
      <AuthShaderPanel />
    </div>
  );
}

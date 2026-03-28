import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/mvc/controllers/auth/AuthProvider";

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

function loginErrorMessage(err) {
  const msg = err?.message || "";
  if (!msg) return "Login failed. Check your credentials.";
  if (/captcha|captcha_token|verification required/i.test(msg)) {
    return `${msg} If you enabled Bot Protection in Supabase, add VITE_TURNSTILE_SITE_KEY (Cloudflare Turnstile site key) to .env and restart the dev server.`;
  }
  return msg;
}

export default function LoginView() {
  const navigate = useNavigate();
  const { signIn, isLoading, authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (turnstileSiteKey && !captchaToken) {
      setMessage("Please complete the security check above.");
      return;
    }

    try {
      await signIn(
        email,
        password,
        turnstileSiteKey && captchaToken ? { captchaToken } : undefined,
      );
      navigate("/", { replace: true });
    } catch (err) {
      turnstileRef.current?.reset();
      setCaptchaToken(null);
      setMessage(loginErrorMessage(err));
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {turnstileSiteKey ? (
              <div className="flex justify-center pt-1">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            ) : null}

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>

            {(message || authError) && (
              <p className="text-center text-destructive mt-2">
                {message || authError?.message || "Login error"}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


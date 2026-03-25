import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/mvc/controllers/auth/AuthProvider";

export default function LoginView() {
  const navigate = useNavigate();
  const { signIn, isLoading, authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      await signIn(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err?.message || "Login failed. Check your credentials.";
      setMessage(msg);
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


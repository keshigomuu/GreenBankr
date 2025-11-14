"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [icNumber, setIcNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    if (!icNumber.trim()) {
      setErr("Please enter your IC Number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icNumber: icNumber.trim().toUpperCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Login failed (${res.status})`);
      }

      // data.user should include the standardized customerId (e.g., "0000002737")
      // Keep anything else your route returns (name/email/etc.)
      login({
        customerId: data.user?.customerId,
        icNumber: icNumber.trim().toUpperCase(),
        name: data.user?.name,
        email: data.user?.email,
        raw: data.user,
      });

      router.push("/dashboard");
    } catch (e1) {
      setErr(e1.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to GreenBankr</CardTitle>
            <CardDescription>Login with your IC Number</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="icNumber">IC Number (Certificate No)</Label>
              <Input
                id="icNumber"
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value)}
                placeholder="T55555555T"
                autoFocus
              />
            </div>

            {err && <p className="text-sm text-destructive">{err}</p>}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in…</>) : "Login"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Create one now
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

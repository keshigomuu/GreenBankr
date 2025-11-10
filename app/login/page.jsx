"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Leaf, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [icNumber, setIcNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleIcLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const cleanIc = icNumber.trim().toUpperCase();
      if (!cleanIc) {
        setError("Please enter your IC Number");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icNumber: cleanIc }),
      });

      const ct = res.headers.get("content-type") || "";
      const isJson = ct.toLowerCase().includes("application/json");
      const data = isJson ? await res.json() : { success: false, error: await res.text() };

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Login failed (${res.status})`);
      }

      // data.user is normalized
      const user = data.user;

      // Store in global auth state and localStorage
      login({
        customerId: user.customerId,
        icNumber: user.icNumber,
        name:
          (user.givenName || user.familyName) ?
            `${user.givenName ?? ""} ${user.familyName ?? ""}`.trim() :
            "Customer",
        email: user.email || "",
        phone: user.phone || "",
        raw: user.raw,
      });

      // Go wherever you want post-login; Rewards is fine
      router.push("/rewards");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

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

        <form onSubmit={handleIcLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="icNumber">IC Number (Certificate No)</Label>
              <Input
                id="icNumber"
                type="text"
                placeholder="T55555555T"
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>

        <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking IC…
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

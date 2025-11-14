"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    // Identity - Required
    icNumber: "",
    givenName: "",
    familyName: "",
    dateOfBirth: "2014-12-31",
    gender: "",
    occupation: "",

    // Contact - Required
    emailAddress: "",
    phoneCountryCode: "+65",
    phoneLocalNumber: "",

    // Address - Optional but recommended
    streetAddress: "",
    city: "",
    state: "",
    country: "SG",
    postalCode: "",

    // Account - Required
    preferredUserId: "",
    password: "",
    confirmPassword: "",
    createDepositAccount: true,

    // Employment - Optional
    positionTitle: "",
    yearOfService: 0,
    employerName: "",
    workingInSingapore: false,
    
    // Financial - Optional
    annualSalary: 50000,
    currency: "SGD"
  });

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const testDirectAPI = async () => {
    try {
      console.log("🧪 Testing direct API call...");
      setDebugInfo("Testing direct API call...");
      
      const testPayload = {
        icNumber: form.icNumber || "T99999999T",
        givenName: form.givenName || "TestGiven",
        familyName: form.familyName || "TestFamily",
        emailAddress: form.emailAddress || "test@example.com",
        phoneLocalNumber: form.phoneLocalNumber || "81523286",
        preferredUserId: form.preferredUserId || "testuser123",
        password: form.password || "123456789"
      };
      
      const res = await fetch("/api/test/postman-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload)
      });
      
      const result = await res.json();
      console.log("🧪 Direct API test result:", result);
      setDebugInfo(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error("🧪 Direct API test failed:", error);
      setDebugInfo(`Direct API test failed: ${error.message}`);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setDebugInfo("");

    // Validation
    if (form.password !== form.confirmPassword) {
      setErr("Passwords do not match");
      return;
    }

    if (!agreed) {
      setErr("Please agree to the terms and conditions");
      return;
    }

    if (form.icNumber.length < 9) {
      setErr("IC Number must be at least 9 characters");
      return;
    }

    if (form.password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    try {
      console.log("🚀 === SIGNUP FORM SUBMISSION ===");
      
      // Prepare payload for API
      const payload = {
        // Identity
        icNumber: form.icNumber.trim().toUpperCase(),
        givenName: form.givenName.trim(),
        familyName: form.familyName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        occupation: form.occupation,

        // Contact
        emailAddress: form.emailAddress.trim(),
        phoneCountryCode: form.phoneCountryCode.trim(),
        phoneLocalNumber: form.phoneLocalNumber.trim(),
        countryCode: form.country,

        // Address
        streetAddress: form.streetAddress.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        postalCode: form.postalCode.trim(),

        // Account
        preferredUserId: form.preferredUserId.trim(),
        password: form.password,
        createDepositAccount: form.createDepositAccount,
        currency: form.currency,

        // Employment
        positionTitle: form.positionTitle.trim(),
        yearOfService: parseInt(form.yearOfService) || 0,
        employerName: form.employerName.trim(),
        workingInSingapore: form.workingInSingapore,

        // Financial
        annualSalary: parseInt(form.annualSalary) || 50000
      };

      console.log("📤 Frontend payload:", payload);
      console.log("📤 Payload keys:", Object.keys(payload));

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📡 Response status:", res.status);
      console.log("📡 Response ok:", res.ok);

      let data;
      try {
        const responseText = await res.text();
        console.log("📥 Raw response text:", responseText);
        data = responseText ? JSON.parse(responseText) : {};
        console.log("📥 Parsed response:", data);
      } catch (parseError) {
        console.error("❌ Failed to parse response:", parseError);
        setDebugInfo(`Response parse error: ${parseError.message}`);
        throw new Error("Invalid server response");
      }

      if (!res.ok || !data?.success) {
        console.error("❌ Signup failed:");
        console.error("  - Status:", res.status);
        console.error("  - Data:", data);
        
        setDebugInfo(JSON.stringify({
          status: res.status,
          ok: res.ok,
          data: data
        }, null, 2));
        
        throw new Error(data?.error || `Signup failed (${res.status})`);
      }

      // Login the user immediately
      const userData = {
        customerId: data.user.customerId,
        icNumber: data.user.icNumber,
        name: `${data.user.givenName} ${data.user.familyName}`,
        firstName: data.user.givenName,
        lastName: data.user.familyName,
        email: data.user.email,
        phone: data.user.phone,
        depositAccount: data.user.depositAccount,
        loyaltyPoints: data.user.loyaltyPoints || 0
      };

      console.log("✅ Logging in user:", userData);
      login(userData);
      router.push("/dashboard");

    } catch (error) {
      console.error("❌ Signup error:", error);
      setErr(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Join GreenBankr</CardTitle>
            <CardDescription>Create your sustainable banking account</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={submit}>
          <CardContent className="space-y-6">
            {/* Error Display */}
            {err && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{err}</p>
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div className="p-3 bg-gray-100 border rounded-md">
                <p className="text-xs font-mono whitespace-pre-wrap">{debugInfo}</p>
              </div>
            )}


            {/* Identity Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icNumber">IC Number *</Label>
                  <Input 
                    id="icNumber" 
                    name="icNumber" 
                    value={form.icNumber} 
                    onChange={onChange} 
                    placeholder="S1234567D" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="givenName">Given Name *</Label>
                  <Input 
                    id="givenName" 
                    name="givenName" 
                    value={form.givenName} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="familyName">Family Name *</Label>
                  <Input 
                    id="familyName" 
                    name="familyName" 
                    value={form.familyName} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailAddress">Email Address *</Label>
                  <Input 
                    id="emailAddress" 
                    name="emailAddress" 
                    type="email" 
                    value={form.emailAddress} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneLocalNumber">Phone Number *</Label>
                  <Input 
                    id="phoneLocalNumber" 
                    name="phoneLocalNumber" 
                    value={form.phoneLocalNumber} 
                    onChange={onChange} 
                    placeholder="81234567"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredUserId">Username *</Label>
                  <Input 
                    id="preferredUserId" 
                    name="preferredUserId" 
                    value={form.preferredUserId} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    value={form.password} 
                    onChange={onChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    value={form.confirmPassword} 
                    onChange={onChange} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">Terms and Conditions</Link>
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

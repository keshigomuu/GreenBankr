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
import { useEffect } from "react";


export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Organisation select state
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsError, setOrgsError] = useState("");

  const [form, setForm] = useState({
    // Identity - Required
    icNumber: "",
    familyName: "",
    givenName: "",
    dateOfBirth: "2014-12-31",
    gender: "",

    // Contact - Required
    emailAddress: "",
    countryCode: "65",
    mobileNumber: "",
    phoneCountryCode: "65",

    // Account - Required
    preferredUserId: "",
    currency: "SGD",
    password: "",
    confirmPassword: "",

    // Extra fields for backend
    tenantId: "600",
    customerType: "100",
    annualSalary: 0,
    Preference: false,
    DonationOrg: "",
    // Donation preference UI state
    wantToDonate: false,
    selectedOrganization: ""
  });

  useEffect(() => {
    if (!form.wantToDonate) return;
    setOrgsLoading(true);
    setOrgsError("");
    fetch("/api/organisations")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch organisations");
        const data = await res.json();
        setOrgs(data.organisations || []);
      })
      .catch((e) => setOrgsError(e.message || "Failed to load organizations"))
      .finally(() => setOrgsLoading(false));
  }, [form.wantToDonate]);

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

  // const testDirectAPI = async () => {
  //   try {
  //     console.log("🧪 Testing direct API call...");
  //     setDebugInfo("Testing direct API call...");
      
  //     const testPayload = {
  //       icNumber: form.icNumber || "T99999999T",
  //       givenName: form.givenName || "TestGiven",
  //       familyName: form.familyName || "TestFamily",
  //       emailAddress: form.emailAddress || "test@example.com",
  //       phoneLocalNumber: form.mobileNumber || "81523286",
  //       preferredUserId: form.preferredUserId || "testuser123",
  //       password: form.password || "123456789"
  //     };
      
  //     const res = await fetch("/api/test/postman-compare", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(testPayload)
  //     });
      
  //     const result = await res.json();
  //     console.log("🧪 Direct API test result:", result);
  //     setDebugInfo(JSON.stringify(result, null, 2));
      
  //   } catch (error) {
  //     console.error("🧪 Direct API test failed:", error);
  //     setDebugInfo(`Direct API test failed: ${error.message}`);
  //   }
  // };

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
      // Helper to derive a stable id from varied API fields
      const deriveId = (o) => String(
        o?.id ?? o?.organisationId ?? o?.OrganisationId ?? o?.name ?? o?.organisationName ?? o?.Name ?? ""
      );
      const deriveName = (o) => (
        o?.name ?? o?.organisationName ?? o?.Name ?? "Organisation"
      );

      // Set donation preference and org
      let donationPreference = false;
      let donationOrg = "";
      
      if (form.wantToDonate && form.selectedOrganization) {
        donationPreference = true;
        const selectedOrg = orgs.find(o => deriveId(o) === String(form.selectedOrganization));
        donationOrg = selectedOrg ? deriveName(selectedOrg) : form.selectedOrganization;
      }

      // Prepare payload for API
      const payload = {
        icNumber: form.icNumber.trim().toUpperCase(),
        familyName: form.familyName.trim(),
        givenName: form.givenName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        emailAddress: form.emailAddress.trim(),
        countryCode: form.countryCode,
        mobileNumber: form.mobileNumber.trim(),
        phoneCountryCode: form.countryCode,
        preferredUserld: form.emailAddress.trim(),
        currency: "SGD",
        password: form.password,
        tenantId: "600",
        customerType: "100",
        annualSalary: Number(form.annualSalary) || 0,
        Preference: donationPreference,
        DonationOrg: donationOrg
      };

      console.log(payload);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        const responseText = await res.text();
        data = responseText ? JSON.parse(responseText) : {};
        console.log(data);
      } catch (parseError) {
        setDebugInfo(`Response parse error: ${parseError.message}`);
        throw new Error("Invalid server response");
      }

      if (!res.ok || !data?.success) {
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
      login(userData);
      router.push("/dashboard");
    } catch (error) {
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
            {/* {debugInfo && (
              <div className="p-3 bg-gray-100 border rounded-md">
                <p className="text-xs font-mono whitespace-pre-wrap">{debugInfo}</p>
              </div>
            )} */}


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
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={onChange}
                    required
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input 
                    id="dateOfBirth" 
                    name="dateOfBirth" 
                    type="date" 
                    value={form.dateOfBirth} 
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
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="countryCode" 
                      name="countryCode" 
                      value={form.countryCode} 
                      onChange={onChange} 
                      placeholder="65" 
                      className="w-20"
                      required 
                    />
                    <Input 
                      id="mobileNumber" 
                      name="mobileNumber" 
                      value={form.mobileNumber} 
                      onChange={onChange} 
                      placeholder="81234567" 
                      className="flex-1"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualSalary">Annual Salary *</Label>
                  <Input 
                    id="annualSalary" 
                    name="annualSalary" 
                    type="number" 
                    value={form.annualSalary} 
                    onChange={onChange} 
                    placeholder="15000" 
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

            {/* Donation Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Donation Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="wantToDonate" 
                    checked={form.wantToDonate} 
                    onCheckedChange={(checked) => {
                      setForm(prev => ({ 
                        ...prev, 
                        wantToDonate: checked,
                        selectedOrganization: checked ? prev.selectedOrganization : ""
                      }));
                    }} 
                  />
                  <label htmlFor="wantToDonate" className="text-sm text-muted-foreground">
                    I want to support environmental causes through donations
                  </label>
                </div>

                {form.wantToDonate && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="selectedOrganization">Choose an organization</Label>
                    {orgsLoading ? (
                      <div className="text-xs text-muted-foreground">Loading organizations...</div>
                    ) : orgsError ? (
                      <div className="text-xs text-destructive">{orgsError}</div>
                    ) : (
                      <Select 
                        value={form.selectedOrganization} 
                        onValueChange={(value) => handleSelectChange('selectedOrganization', value)}
                      >
                        <SelectTrigger id="selectedOrganization">
                          <SelectValue placeholder="Select an organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {orgs.map((org, idx) => {
                            const oid = String(
                              org.id ?? org.organisationId ?? org.OrganisationId ?? org.name ?? org.organisationName ?? org.Name ?? idx + 1
                            );
                            const name = org.name ?? org.organisationName ?? org.Name ?? `Organisation ${idx + 1}`;
                            return (
                              <SelectItem key={oid} value={oid}>
                                <div className="flex items-center gap-2">
                                  {org.logo && (
                                    <img src={org.logo} alt="logo" className="h-4 w-4 rounded-full" />
                                  )}
                                  {name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You can make donations to your selected organization after account creation
                    </p>
                  </div>
                )}
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

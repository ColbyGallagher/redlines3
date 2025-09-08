"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
export default function Home() {
  const [email, setEmail] = useState("");
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) console.error(error);
    else alert("Check your email for a login link!");
  };
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <input
        type="email"
        placeholder="Enter your email"
        className="p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleLogin}>Sign In</Button>
    </main>
  );
}
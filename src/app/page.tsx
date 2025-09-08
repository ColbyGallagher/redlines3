"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Analytics } from "@vercel/analytics/next"
import { ModeToggle } from "@/components/mode-toggle";
import LoginPage from "./login/page";
export default function Home() {
  const [email, setEmail] = useState("");
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) console.error(error);
    else alert("Check your email for a login link!");
  };
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <ModeToggle/>
      <LoginPage/>
      
      <Analytics/>
    </main>
  );
}
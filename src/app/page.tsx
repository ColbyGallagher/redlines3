"use client";
import { Analytics } from "@vercel/analytics/next"
import { ModeToggle } from "@/components/mode-toggle";
import PricingSection from "@/components/pricing-section";
import LoginPage from "./login/page";
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col gap-12 pb-16 pt-10">
      <div className="flex w-full max-w-6xl flex-col gap-6 px-6">
        <div className="flex items-center justify-between">
          <ModeToggle />
        </div>
        <LoginPage />
      </div>
      <PricingSection />
      <Analytics />
    </div>
  );
}
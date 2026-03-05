"use client";

import { useMemo, useState } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type QuantityOption = {
  id: string;
  label: string;
  description: string;
  discount: number;
};

type PricingTier = {
  id: string;
  name: string;
  price: number;
  priceSuffix?: string;
  headline?: string;
  ctaLabel: string;
  features: string[];
};

const quantityOptions: QuantityOption[] = [
  {
    id: "standard",
    label: "1-10 users",
    description: "Standard pricing",
    discount: 0,
  },
  {
    id: "team",
    label: "11-100 users",
    description: "Save 10% for growing teams",
    discount: 0.1,
  },
  {
    id: "enterprise",
    label: "100+ users",
    description: "Save 20% on large deployments",
    discount: 0.2,
  },
];

const tiers: PricingTier[] = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    headline: "Get started in minutes",
    ctaLabel: "Start Free Trial",
    features: [
      "Placeholder feature one",
      "Placeholder feature two",
      "Placeholder feature three",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 10,
    priceSuffix: "per user / month",
    headline: "Everything you need to launch",
    ctaLabel: "Choose Basic",
    features: [
      "Placeholder feature one",
      "Placeholder feature two",
      "Placeholder feature three",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 20,
    priceSuffix: "per user / month",
    headline: "Advanced tools for scale",
    ctaLabel: "Choose Pro",
    features: [
      "Placeholder feature one",
      "Placeholder feature two",
      "Placeholder feature three",
    ],
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function PricingSection() {
  const [selectedQuantity, setSelectedQuantity] = useState<QuantityOption>(
    quantityOptions[0]
  );

  const discountCopy = useMemo(() => {
    if (!selectedQuantity.discount) return "";
    return `${Math.round(selectedQuantity.discount * 100)}% bulk discount applied`;
  }, [selectedQuantity]);

  return (
    <section className="w-full max-w-6xl px-6 py-16 md:py-24 mx-auto">
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="text-sm font-semibold tracking-wide text-primary">
          Pricing
        </span>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Flexible plans for every team size
        </h2>
        <p className="max-w-2xl text-balance text-muted-foreground">
          Compare options and tailor your plan with built-in discounts for larger teams.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Select your team size
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[12rem] justify-between">
                <span>{selectedQuantity.label}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              <DropdownMenuLabel>Team size</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quantityOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onSelect={() => setSelectedQuantity(option)}
                  className="flex flex-col items-start gap-0.5"
                  data-state={selectedQuantity.id === option.id ? "checked" : undefined}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {discountCopy && (
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            {discountCopy}
          </span>
        )}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => {
          const discountedPrice = tier.price * (1 - selectedQuantity.discount);
          const formattedPrice = tier.price
            ? currencyFormatter.format(discountedPrice)
            : "Free";
          const shouldShowOriginal = Boolean(
            tier.price && selectedQuantity.discount
          );

          return (
            <Card
              key={tier.id}
              className="relative h-full border-border/60 transition-all hover:shadow-md"
            >
              <CardHeader className="gap-3 text-left">
                <CardTitle className="text-2xl font-semibold">
                  {tier.name}
                </CardTitle>
                {tier.headline && (
                  <CardDescription>{tier.headline}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2 text-4xl font-bold">
                    {formattedPrice}
                    {tier.priceSuffix && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {tier.priceSuffix}
                      </span>
                    )}
                  </div>
                  {shouldShowOriginal && (
                    <span className="text-xs text-muted-foreground">
                      Normally {currencyFormatter.format(tier.price)} per user
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={tier.id === "pro" ? "default" : "outline"}>
                  {tier.ctaLabel}
                </Button>
              </CardFooter>
              {tier.id === "pro" && (
                <CardAction>
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                </CardAction>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}


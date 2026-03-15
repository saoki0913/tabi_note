import Stripe from "stripe";
import { env } from "@/lib/env";

const globalForStripe = globalThis as typeof globalThis & {
  __tabiNoteStripe?: Stripe;
};

export const stripe = env.stripeSecretKey
  ? globalForStripe.__tabiNoteStripe ??
    new Stripe(env.stripeSecretKey, {
      apiVersion: "2026-02-25.clover",
      appInfo: {
        name: "tabi_note",
      },
    })
  : null;

if (stripe && !globalForStripe.__tabiNoteStripe) {
  globalForStripe.__tabiNoteStripe = stripe;
}

export const PRICE_LABELS = {
  monthly: "月額480円",
  yearly: "年額3,900円",
} as const;

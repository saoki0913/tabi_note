"use client";

import posthog from "posthog-js";

let initialized = false;

export const initPostHog = () => {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") {
    return;
  }

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
  });
  initialized = true;
};

export { posthog };

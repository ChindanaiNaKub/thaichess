---
status: accepted
date: 2026-07-31
---

# PostHog free cloud for privacy-friendly analytics

Issue #248 needed measurable traffic and product funnels without Google Analytics. The codebase already had consent-gated Plausible wiring; we chose **PostHog free cloud (US)** instead of Plausible Cloud (paid) or Umami/self-host, so pageviews and a small set of ProductEvents live in one place on the free tier.

We initialize the official JS SDK only after AnalyticsConsent is `analytics`, keep autocapture/session replay off, stay anonymous (no `identify()` / no PII), and document `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` as optional build-time env.

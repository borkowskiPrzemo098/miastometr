# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js on Vercel (App Router, API routes for data fetching/caching). Data from GUS BDL and GIOS fetched server-side and cached/revalidated on a daily schedule since underlying figures change slowly.

## Users

Anyone weighing a relocation, remote-work base, or general "where should I live" decision in Poland: people comparing job offers in different cities, students choosing where to study, people priced out of one city looking at alternatives, and casual visitors who want to see how their own city ranks. No login, no account — pure lookup/comparison tool.

## Product Purpose

An all-in-one Polish city comparator: lets a visitor look up any category (cost of living, average salary, rent/housing prices, air quality, and other available public indicators) across ~100 Polish powiat/voivodeship-level cities, sorted best-to-worst, or compare specific cities side by side. Success = a visitor finds the answer to "which city is better for X" in seconds, without digging through GUS/GIOS raw tables or outdated blog rankings themselves.

## Positioning

No existing Polish tool aggregates official government data sources (GUS BDL for economic/cost data, GIOS for real-time air quality) into one searchable, sortable, per-category city ranking. Existing city-ranking content is either a static blog listicle (stale, not sortable/filterable) or a generic global tool (Numbeo) with thin, crowd-sourced, non-Poland-specific data. This product's differentiator is being built entirely on live official Polish public data, kept current, sortable by any single category the visitor cares about.

## Operating Context

- Primary interaction: pick a category (or several) → get all ~100 cities ranked/sortable by that metric; or pick two-plus cities → see them side by side across all categories.
- Data refresh: daily batch job pulls GUS BDL (economic/cost/housing indicators) and GIOS (live air quality) and caches results; GIOS air-quality figures are the most time-sensitive (can spike seasonally, e.g. autumn/winter smog).
- No user accounts, no personalization, no saved data — a stateless lookup/reference tool.

## Capabilities and Constraints

- Confirmed data sources: GUS BDL (Bank Danych Lokalnych) — free, public, no API key — for salaries, cost-of-living-adjacent indicators, housing/rent prices where available. GIOS — free, public — for air quality index, no key required.
- Coverage: ~100 powiat-level and voivodeship-capital cities on launch (not all ~2500 Polish gminas) — chosen for data completeness/reliability; smaller towns often have gappy GUS figures.
- Undecided/open: exact final list of comparison categories depends on what GUS BDL actually returns cleanly per city at build time (some indicators may only exist at voivodeship/powiat level, not per-city) — to be confirmed once real data is pulled.
- No Google Places, no restaurant data, no paid/card-gated API of any kind — everything must run on free, keyless or no-card government data sources.

## Brand Commitments

None yet — no name, logo, or voice has been decided.

## Evidence on Hand

None yet. No sample GUS/GIOS data has been pulled and inspected for real coverage/completeness — this is the immediate next step before committing to a final category list or visual design.

## Product Principles

1. Trustworthiness over cleverness — every figure traces back to an official public source (GUS/GIOS), never estimated or invented.
2. Any category, sortable — the visitor should never need to know in advance which city is "best"; they pick the metric that matters to them and the ranking does the work.
3. Zero friction — no login, no paywall, no card-gated dependency anywhere in the stack; the product must keep working for free indefinitely.
4. Freshness where it matters — air quality (fast-changing) is refreshed far more eagerly than economic indicators (slow-changing), and the UI should make the visitor aware of how current each figure is.
5. Built for sharing — city-ranking results are the kind of thing people screenshot and send to friends; the output format should hold up well as a shareable result, not just a raw table.

## Accessibility & Inclusion

None established yet beyond standard web accessibility expectations (semantic HTML, keyboard navigation, sufficient contrast) — no specific user need has been raised.

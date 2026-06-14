# Product

## Register

product

## Users

A small, private group of friends playing the FIFA World Cup 2026 prediction
game together. They sign in with Google on their phones (mobile-first), drop in
to predict match winners before kickoff, lock in a single champion pick, and
check back to see where they sit on the leaderboard. Casual context: a few
minutes at a time, often between or just before matches. One or two members act
as admins (whitelisted emails) to sync match data and fix results.

## Product Purpose

A lightweight, private prediction game that turns the World Cup into a friendly
competition with bragging rights. Players predict Home / Draw / Away for every
match (editable until kickoff, then locked) and pick one permanent champion;
they earn 1 point per correct match and climb a shared leaderboard. It is
deliberately **not realtime** — results are synced periodically from
football-data.org. Success = the group keeps coming back to predict and
trash-talk, and the standings stay accurate and trustworthy with near-zero
maintenance.

## Brand Personality

Fun and competitive. Three words: **playful, energetic, sporty**. The voice
leans into rivalry and bragging rights — it should feel like a matchday group
chat, not a corporate tool. Confident and stadium-grade, but warm and personal
since everyone knows each other. Celebrate correct picks, make the leaderboard
feel like it matters, keep friction low.

## Anti-references

- Sterile enterprise dashboards / admin consoles — this is a game, not a BI tool.
- Gambling and betting-site aesthetics (neon odds, aggressive CTAs, dark-pattern
  urgency). The competition is for fun, not money.
- Generic "modern SaaS" blandness with no personality or sense of the sport.

## Design Principles

- **Matchday energy** — the UI should feel alive and sporty (pitch green, crests,
  flags), rewarding correct predictions and making standings feel consequential.
- **Lock-in clarity** — always make it obvious what's still editable vs locked
  (kickoff deadlines), and that the champion pick is permanent. No surprises.
- **Thumb-first** — mobile is the primary surface; primary actions reachable and
  fast, minimal typing, big tap targets.
- **Trustworthy standings** — points and results are authoritative and never feel
  ambiguous; the leaderboard is the source of truth the group argues over.
- **Low friction, low maintenance** — get to a prediction in one or two taps;
  admin upkeep stays minimal and out of players' way.

## Accessibility & Inclusion

Sensible defaults: target WCAG 2.1 AA contrast in both light and dark themes,
full keyboard navigation with visible focus rings, and respect for
`prefers-reduced-motion`. No specialized requirements noted for this group, but
don't rely on color alone to convey prediction state (win/draw/loss, locked).

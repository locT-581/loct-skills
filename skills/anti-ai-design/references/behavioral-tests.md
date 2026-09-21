# Behavioral Tests — Anti-AI-Design Skill

The test scenarios below protect the **nuance** of the skill — ensuring the skill does not become a tool that enforces excessive minimalism, nor overlooks cases where AI-common patterns are genuinely problematic.

Each test case is a fixture that evaluates behavior: if the skill violates the expected behavior of any case, it is a regression.

---

### 1. Brand intentionally uses rounded-2xl + gradients

**Context**: The project's DESIGN.md documents `rounded-2xl` as the brand radius, and gradient as a brand treatment. Brand guidelines exist and are up to date.
**Input**: Agent generates a component with rounded-2xl cards and gradient heading.
**Expected behavior**: KEEP — this is not slop. The pattern matches the documented brand direction. The skill must not flag just because rounded-2xl and gradients appear in the AI-common patterns list — they were actively chosen by the project.
**Why this matters**: The skill must respect project taste over model taste (Invariant 2 — Project Taste > Model Taste). Not every `rounded-2xl` is an AI default — when brand evidence exists, the pattern becomes an intentional choice.

---

### 2. Admin dashboard using conventional KPI cards

**Context**: The register is admin/operational. The task is a monitoring dashboard for 50+ numeric KPIs — users need to scan quickly, compare deltas, and spot anomalies.
**Input**: Agent generates an icon-box + big number + delta × 4 cards layout.
**Expected behavior**: May be valid — an admin/operational register has different taste pressure than marketing. Conventional patterns (icon-box KPI cards) can be appropriate when the goal is density and predictability. The agent should verify whether this representation fits the monitoring task (50+ KPIs in icon-box × 4 may lack density), but the pattern itself is not automatically flagged.
**Why this matters**: UI Register Gate — admin surfaces have different standards. Taste pressure for operational dashboards comes from workflow efficiency and information density, not brand uniqueness.

---

### 3. Landing page receives purple+bento+Sparkles with no brand evidence

**Context**: No DESIGN.md, no brand docs, no color tokens. User says "create landing page" — no design direction provided.
**Input**: Agent generates purple gradient + bento grid + Sparkles/Zap/Shield icons + copy "Unlock powerful insights".
**Expected behavior**: REVISE — cumulative slop cluster (Purple SaaS Starter Pack) with zero brand grounding. The agent needs to ask about brand direction before choosing aesthetics. Individual patterns may be acceptable on their own, but the combination of purple + bento + decorative icons + generic copy creates a clear fingerprint of AI-generated design.
**Why this matters**: Cumulative Slop (Invariant 9) + Project Taste (Invariant 2) — this is the canonical AI-slop case. The skill must detect clusters, not just individual patterns.

---

### 4. Project officially uses Lucide

**Context**: `package.json` includes `lucide-react`. Multiple components import from Lucide. No other icon library exists in the project.
**Input**: Agent uses Lucide icons in a new component.
**Expected behavior**: Correct library choice (project standard) — the Contract Gate does NOT fire for using the project's own library. However, decorative icon proliferation is still flagged: icons before every heading, icon-box syndrome (icons in colored circles used as decoration), icons as filler instead of functional signifiers. The distinction is clear: **using Lucide** is correct, **abusing Lucide for decoration** is slop.
**Why this matters**: Icon Monoculture detection distinguishes HOW (how icons are used — decorative vs functional) from WHETHER (whether that library is used at all). The skill flags behavior, not tools.

---

### 5. User requests brutalist/maximalist design

**Context**: User says "I want a bold brutalist design with heavy borders, mixed typefaces, and dense layout" — clear, intentional direction.
**Input**: Agent generates UI with thick borders, multiple typefaces, high density, raw aesthetic.
**Expected behavior**: ALLOW — this is intentional direction. Multiple borders/colors/typefaces are not violations when they are controlled design direction. The agent should implement the aesthetic faithfully as requested. The skill does not flag because brutalist design may violate "conventional taste" — the skill enforces intent, not minimalism.
**Why this matters**: Restraint Is Active Design (Invariant 10) cuts both ways — restraint means "selecting with intention", not "always reducing". When the user intentionally chooses maximalism, the skill must respect that.

---

### 6. Audit-only request — no mutation

**Context**: User says "audit this page for AI patterns" or "review this component" — only analysis is requested.
**Input**: Agent reads code and identifies patterns.
**Expected behavior**: AUDIT MODE — read-only. Report findings in audit table format. Absolutely do not create/modify DESIGN.md, do not edit code, do not persist decisions. Analysis authorization ≠ mutation authorization. The agent returns an analysis table with severity, pattern detected, and recommendation — but does not execute the recommendation itself.
**Why this matters**: Separation of operating modes — the same lesson as with the technical-advisor skill. Analysis authority does not imply authority to change. The user may want to review before deciding on action.

---

### 7. DESIGN.md conflicts with runtime tokens

**Context**: DESIGN.md states `border-radius: 4px`, but `tailwind.config.ts` has `borderRadius: { DEFAULT: '12px' }`. Components in the codebase are using `rounded-xl`.
**Input**: Agent needs to decide which radius to use.
**Expected behavior**: REPORT DRIFT — report that design intent (DESIGN.md) and runtime implementation (tailwind config + existing components) conflict. Do NOT silently pick one side. Ask the user which is the current authority, or note in the audit that the design system has drift that needs resolution.
**Why this matters**: Context precedence detects drift, does not silently resolve it (Invariant 6 — existing pattern is evidence, not authority). The skill helps the user see inconsistency rather than hiding it.

---

### 8. Utility settings screen fails Brand-Off test

**Context**: Settings page with forms, toggles, table. Clean, conventional layout. Could work for any SaaS — Brand-Off test "fails".
**Input**: Agent audits the page and notes the Brand-Off test failure.
**Expected behavior**: NOT AUTOMATICALLY a problem — register is admin/operational. Specificity for utility screens comes from workflow (domain-specific form flows), domain vocabulary (labels, terminology reflecting the business), information density (layout optimized for specific tasks), and data relationships — not decorative uniqueness. The Brand-Off test applies weakly here.
**Why this matters**: UI Register Gate — the Brand-Off test is not universal. Utility screens serve efficiency, not brand impression. Forcing brand uniqueness onto a settings page is over-engineering and may break usability.

---

### 9. Redesigning the color system

**Context**: User clearly states "we're redesigning our color palette" or "switch to a new brand color" — explicit authorization to change the design system.
**Input**: Agent introduces new colors not present in current tokens.
**Expected behavior**: ALLOW — Contract Gate override is explicitly authorized. The agent should update design context (tokens/DESIGN.md) alongside the visual change, ensuring the source of truth is updated at the same time as the implementation.
**Why this matters**: The Contract Gate can be overridden with explicit authorization — the skill blocks unconscious changes (agent unilaterally changing colors), not deliberate ones (user actively redesigning). Distinguish between "model self-selecting" and "user commanding a change".

### 10. Intentional emoji — product language

**Context**: The product is a mood tracker. Emoji are documented as semantic states: 😊 = good, 😐 = neutral, 😢 = bad. DESIGN.md records emoji as first-class UI semantics.
**Input**: Agent uses emoji in status indicators.
**Expected behavior**: KEEP — emoji is intentional product language, not AI using emoji as a substitute for an icon system. The Contract Gate does not fire because the product explicitly treats emoji as semantic UI.
**Why this matters**: Emoji are not hard-banned outright. The real issue is AI using 🚀📊⚙️ as a default icon system — not every emoji in UI is wrong.

### 11. Local contract exception — one-off hero

**Context**: The project has brand blue in tokens. User says: "Use a special red accent for this hero campaign."
**Input**: Agent uses a red color not in the tokens for the hero section.
**Expected behavior**: ALLOW locally — this is a local exception, not a global system redesign. Do NOT automatically update global tokens or DESIGN.md. If the red accent starts appearing in many other places → suggest promoting it into the system.
**Why this matters**: Override scope: local exception ≠ durable system change. A single hero should not trigger a global token update.

### 12. Durable contract change — global brand update

**Context**: User says "Change the brand blue to teal across the entire system."
**Input**: Agent changes the primary color from blue to teal.
**Expected behavior**: ALLOW + update durable design context. Change tokens, DESIGN.md, and affected components. This is a durable system change, not a local exception.
**Why this matters**: Distinguish scope: a local exception leaves the system intact, a durable change updates the system. Both are Contract Gate overrides but with different behaviors.

### 13. Workflow register — long checkout flow

**Context**: The task is to create a multi-step checkout flow (4 steps: cart → shipping → payment → confirmation).
**Input**: Agent creates a long form flow with no single prominent focal element.
**Expected behavior**: ACCEPTABLE — workflow surfaces follow progression hierarchy. Primary attention follows task progression; a hero-like focal point is not needed. Evaluate by progression clarity: the user knows where they are and what the next step is.
**Why this matters**: The attention model has 3 types: focal (narrative), distributed (peer-data), progression (workflow). Do not force focal hierarchy onto form flows.

### 14. User brief supplies palette — greenfield

**Context**: No DESIGN.md, no tokens. User says: "Build a landing page for a craft beer brand, use cobalt blue + warm sand + matte black."
**Input**: Agent implements the cobalt + sand + black palette.
**Expected behavior**: ACCEPTABLE — the user brief is the highest authority in design context resolution. No need to ask "what colors do you want?" when the user has already given clear direction. The agent derives the palette from the brief.
**Why this matters**: "No tokens" does not mean "always ask the user what color". The current brief itself may already have sufficient authority.

---

## Using These Tests

These fixtures protect the most important quality of the skill: **nuance**. Run through them when modifying skill rules to ensure changes do not create false positives (flagging intentional design as slop) or false negatives (missing genuine AI defaults).

A rule change that breaks any of the above cases almost certainly creates a regression. The value of the skill is not in catching patterns — but in knowing **when a pattern is intentional and when it is merely a model reflex**.

# Anti AI Design — Audit Guide

Detailed guide for the agent when auditing UI code — self-audit before submitting or audit upon user request.

> **Version 2.1** — Register-conditional Brand-Off Test, qualitative-only assessment, drift detection, operating modes.

---

## 1. One-Second Test

Purpose: Check visual hierarchy.

How to perform:
- Look at the UI/mockup/code output for 1 second
- Ask: "Where does the eye go first?"

Result:
- If the answer is immediate → hierarchy works
- If "not sure, 3-4 things compete equally" → hierarchy fail
- If the eye goes to the least important element → hierarchy is misordered

Common causes:
- Multiple elements with the same size + weight + color intensity
- CTA button competing with gradient heading
- Icon boxes with the same visual weight as content
- Too much bold text

Fix direction:
- Identify the primary focal anchor for the viewport/section
- Subordinate remaining elements using: size, weight, color, contrast, position
- A section should have only 1 primary action

---

## 2. Effect Subtraction Test

Purpose: Check whether each visual effect serves a function.

Applies to: gradient, shadow, blur, border, icon box, decorative graphic, animation, texture.

How to perform:
For each effect, imagine removing it. Ask:

```
Remove this effect:
1. Does hierarchy change?
2. Is meaning lost?
3. Does usability decrease?
4. Is brand identity affected?
```

If all 4 answers are "no" → that effect needs to justify its existence.

This does not mean always delete. It means:

> **Decoration carries the burden of proof.**

Examples:
- Shadow on dropdown menu → keep (encodes elevation, helps identify floating layer)
- Shadow on every card in a flat list → question (is the card floating? or just decoration?)
- Gradient background → question (brand direction? or AI default?)
- Border around a group → question (does the group need a visual boundary? or is spacing enough?)
- Fade-up animation → question (transition state? or just "for looks"?)

---

## 3. Brand-Off Test

Purpose: Check whether the design has identity or is too generic.

**This test is register-conditional** — applied differently depending on the surface type.

### Expressive / brand-defining surfaces (marketing, landing, product identity)

How to perform:
- Imagine replacing the current logo with a competitor's logo
- Does the UI still make perfect sense?

If **yes** → design is too generic, it doesn't belong to this product yet.

Example fail:
```
SaaS A and SaaS B both have:
- purple gradient hero
- rounded-2xl cards
- Zap / Shield / Sparkles icons
- Inter font
- bento feature grid
- "Unlock powerful insights"
```
→ Swap the logo, nobody notices the difference.

### Utility surfaces (admin, settings, CRUD, operational)

Brand-Off Test in the decorative sense **does not apply strongly**. An admin panel using `white + gray + Inter + Lucide + borders` is not automatically AI slop — if the task is scanning 500 invoices as fast as possible, boring conventional design is sometimes **more correct than** distinctive design.

Instead, test **product/domain specificity**:

| Specificity dimension | Ask |
|---|---|
| Workflow | Does the UI reflect the actual workflow of the product, or is it a generic CRUD template? |
| Domain vocabulary | Do labels, headings, empty states use domain-specific language? |
| Information density | Is density appropriate for the task? (monitoring dashboard ≠ onboarding wizard) |
| Data relationships | Does the UI express relationships between entities in a product-specific way? |
| Interaction model | Does the user flow reflect how users actually work? |

Specificity in utility surfaces comes from workflow, domain vocabulary, information density, data relationships — not colors or shapes.

### Design identity can come from

```
typography choice & usage
information density
data visualization language
interaction model
illustration style
material / texture
layout geometry
content voice & tone
color relationship (not just color choice)
spacing rhythm
```

It does not necessarily require strong decoration or effects.

---

## 4. Icon Necessity Test

Purpose: Check whether icons serve a function.

> Project-standard icon library answers **HOW** an icon is drawn. It does not answer **WHETHER** an icon is needed.

Before adding an icon, ask:

```
Does this icon help recognize the action/content faster?
Or does it just fill empty space?
```

Valid icons:
```
Search     + search icon          ✅ (universal recognition)
Back       + arrow               ✅ (direction cue)
Delete     + trash (icon-only)   ✅ (action recognition without label)
Close      + X                   ✅ (standard interaction)
External link + arrow-up-right   ✅ (behavioral cue)
```

Icons to question:
```
"Analytics" + BarChart in every card heading   ⚠️ (decorative?)
"Fast"      + Zap                               ⚠️ (AI vocabulary)
"Secure"    + Shield                             ⚠️ (AI vocabulary)
"Flexible"  + Sparkles                           ⚠️ (AI vocabulary)
"AI"        + Sparkles/Wand                      ⚠️ (cliché)
```

The trio `Sparkles / Zap / Shield` is a very common AI-card vocabulary. They are not wrong — but when they co-appear on feature cards, that is a clear AI aesthetic signal.

### Icon Monoculture

Using the same outline-icon vocabulary for every concept because the library is available is visual filler. Example:

```
Database   → Database icon
Speed      → Zap icon
Security   → Shield icon
AI         → Sparkles icon
Growth     → Rocket icon
```

Each icon individually is not wrong. But when every concept is assigned an outline icon of the same style, same size, in the same tinted box — that is monoculture. Icons no longer encode distinct meaning; they become visual rhythm filler.

Signs of monoculture:
- Every list item / card has an icon, none is missing
- Icon size, style, container are uniform regardless of content type
- Remove the icons, users still understand 100% of the content
- Icons do not help differentiate items — they only create a visual pattern

---

## 5. AI Cluster Detection

Purpose: Identify when a design falls into an aesthetic cluster common in AI output.

No hard-ban on clusters. But if the design direction can be applied almost verbatim to 20 unrelated products → it is not grounded enough.

Common clusters:

| Cluster | Signature |
|---|---|
| Purple SaaS | purple/indigo gradient + rounded-2xl + Sparkles + Inter + bento |
| Cream Editorial | cream/beige + serif + terracotta + hairline borders |
| Dark Hacker | near-black + neon green/red + monospace |
| Glass Dashboard | glassmorphism + backdrop-blur + dark + translucent |
| Geo Sans Bento | huge geometric sans + bento + bold colors |
| Minimal Corporate | white + gray + Inter + Lucide + cards + subtle shadows |

### Cluster review trigger

When multiple signatures from the same cluster co-appear with enough strength that the design could transfer verbatim to an unrelated product → trigger cluster review.

Do not use a hardcoded threshold (e.g. "≥3 elements"). Instead, the agent evaluates:
- Do the signature elements co-occur with **enough density** to form an aesthetic gestalt?
- Could the design swap logos to another product and still make sense?
- Is there evidence that the cluster direction is intentional (brand docs, DESIGN.md, user authorization)?

If the cluster direction is intentional and documented → do not flag. The problem is cluster **by default**, not cluster by choice.

---

## 6. Cumulative Slop Assessment

Purpose: Assess the overall degree of "AI-ification", not individual patterns in isolation.

### Internal scoring model

> **Scoring is an INTERNAL mental model for the agent. NEVER expose numeric score in audit output.**

Conceptual weights (only used in the agent's head):
```
Taste Signal (minor)     ≈ light
AI-Slop Warning (strong) ≈ heavier
Hard Gate violation       = block (must fix immediately, not counted in accumulation)
```

Example audit of a screen (internal reasoning):
```
gradient heading          → signal
bento layout              → signal
Sparkles/Zap icons        → signal
rounded-2xl everywhere    → warning (radius inflation)
generic SaaS copy         → warning
background blobs          → warning
fade-up every section     → warning
```

The problem is not each one individually. The problem is:

> **Too many AI-default decisions co-occurring without a shared design concept.**

### Qualitative assessment

The agent uses internal reasoning to produce a qualitative assessment:

| Assessment | Meaning |
|---|---|
| **Clean** | Few/no AI-default patterns. Design choices have evidence. |
| **Acceptable** | Patterns present but isolated, may have intent, do not form cluster gestalt. |
| **Review needed** | Cumulative density is notable. Multiple defaults co-occurring. |
| **Revise direction** | Too many ungrounded defaults. Design does not belong to the product yet. |

The agent uses this assessment to decide when to self-revise before submitting, and to report in audit output.

---

## 7. Color Precedence Hierarchy

When deciding on colors, the agent follows this priority order:

```
1. Brand/design documentation (brand docs, style guide)
         ↓
2. DESIGN.md / design tokens
         ↓
3. Runtime theme (theme provider, CSS custom properties)
         ↓
4. Canonical shared components (check what colors the component currently uses)
         ↓
5. Consistent existing UI (patterns in use — but verify they are not legacy slop)
         ↓
6. User clarification (ask the user)
         ↓
7. New proposed palette (present 2–3 art direction territories with rationale, let user decide)
```

**Existing UI (level 5) is not automatically authoritative.** It may itself be old AI slop. Verify by checking whether the pattern is consistent, documented, and maintained.

### Drift Detection

When design intent and runtime implementation do not match — **surface the drift, do not silently pick one side.**

Distinguish 3 sources of authority:

| Source | Role | Example |
|---|---|---|
| **Design intent** | Brand direction, original design intention | Brand docs, maintained DESIGN.md |
| **Runtime implementation** | The actual system currently running | Tokens, theme config, canonical components |
| **Observed evidence** | The actual UI on screen | Existing screens, patterns in use |

When conflict between sources:
- DESIGN.md says primary color is `blue-600` but tokens define `brand-primary: purple-500` → **surface drift**
- Brand docs say "clean, minimal" but existing screens are full of gradient + glassmorphism → **surface drift**
- Tokens define a spacing scale but canonical components hardcode different values → **surface drift**

The agent must:
1. Record the specific conflict in audit output
2. Not pick a side when the conflict is material
3. Suggest the user resolve — or escalate if in GENERATE mode

### Color cluster avoidance

If there is no color system yet, the AI should not immediately default to common clusters:
```
purple + blue
indigo + emerald
cream + terracotta
black + acid green
```

Instead, present 2–3 **art direction territories with rationale**, and let the user decide. Each territory should explain:
- Why it fits the product character
- The mood / personality it creates
- Practical considerations (contrast, accessibility, dark mode feasibility)

---

## 8. Audit Output Format

When auditing UI (self-audit or upon request), use the table format:

| Finding | Evidence | Why it reads generic | Keep / Revise | Better direction |
|---|---|---|---|---|
| Nested cards | 3 surfaces around the same content | boundaries do not encode structure | Revise | spacing + one divider |
| Lucide icon boxes | icon before every heading in a tinted square | repeated AI vocabulary | Revise | retain only functional icons |
| Purple gradient | hero gradient, no brand source | default SaaS cluster | Revise | derive palette from token/brand |
| Uppercase eyebrow | `FEATURES`, `WHY US` labels | decorative, no info encoded | Remove | let heading carry hierarchy |
| Fade-up animation | every section fades up on scroll | motion does not encode state/causality | Revise | only animate meaningful transitions |
| Rounded-2xl cards | every card rounded-2xl | radius does not follow a system | Revise | match project radius scale |
| Generic copy | "Powerful insights", "Seamless" | not product-specific | Revise | describe what product actually does |

Most important column: **Why it reads generic**

This column teaches the agent to understand *why* the design reads as AI-generated, not just *what* is wrong. It also helps the user understand the rationale and arrive at a better direction.

### Summary Block

After the table, summarize:

```
Register: [marketing / product / admin / design-system / signature]
Contract conflicts: [count]
Slop warnings: [count with brief list]
Taste signals: [count]
Cluster detected: [name if applicable]
Overall: [Clean / Acceptable / Review needed / Revise direction]
Rationale: [1-2 sentences]
```

> **Never include a numeric slop score in output.** Use qualitative assessment (Clean / Acceptable / Review needed / Revise direction) with a brief rationale.

### Ask discipline

Only ask the user when there are unresolved decisions that **materially affect the current surface**. Do not ask about full typography + elevation + brand personality when the task is just creating a compact settings row. Derive from the existing system if evidence is sufficient.

Principles:
- Scope questions to the surface being worked on
- Prefer deriving from available context before asking
- Group related questions, do not ask them one by one
- If a decision is not material to the current surface → do not ask, note it for later

---

## 9. Design Rationale — Where It Belongs

Design rationale **does not belong in code comments**. Do not generate:

```tsx
{/* border because this separates groups */}
{/* rounded-lg because brand uses soft radius */}
```

throughout the codebase — that is also noise.

Design rationale belongs in:

| Location | When |
|---|---|
| **DESIGN.md** | Durable design decisions (color, typography, spacing, visual language) |
| **Design plan / brief** | Project-level design direction |
| **PR description** | Explaining design choices in a code change |
| **Audit output** | When audit identifies issues |
| **Source comment** | Only when rationale cannot be inferred from code AND maintainer needs to know |

---

## 10. Operating Modes

This audit guide is used differently depending on the operating mode. Refer to `SKILL.md` §3 for full details.

| Mode | Audit guide usage |
|---|---|
| **AUDIT** | Read-only. Run all tests, report findings. Do not modify code, do not persist design decisions. Do not create/edit DESIGN.md. |
| **GENERATE / MODIFY** | Apply design gate before submitting code. Self-audit. Implement within authorized task scope. |
| **DESIGN-SYSTEM DECISION** | User confirms a durable decision. May persist to DESIGN.md / tokens if implementation is authorized. |

> **Analysis authorization ≠ mutation authorization.** Permission to audit does not mean permission to modify. When the user says "audit this page", the skill inspects and reports — it does not create/edit `DESIGN.md` or refactor code on its own.

When in GENERATE/MODIFY mode, the agent self-audits before submitting:
1. Run Effect Subtraction, Brand-Off (register-appropriate), Icon Necessity
2. Assess cumulative slop (internal)
3. If assessment is "Review needed" or higher → self-revise before submitting
4. If drift is detected between design intent and runtime → surface it to the user, do not resolve on its own

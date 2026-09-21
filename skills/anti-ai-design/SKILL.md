---
name: "anti-ai-design"
version: "2.2.0"
description: "Design-intent gate and AI-slop auditor for UI code. Enforces intentional visual decisions over AI defaults via invariants, register classification, and cumulative detection."
triggers:
  globs:
    - "**/*.tsx"
    - "**/*.jsx"
    - "**/*.vue"
    - "**/*.svelte"
    - "**/*.html"
    - "**/*.css"
  intents:
    - "generate UI component"
    - "create page layout"
    - "design user interface"
    - "audit UI for AI patterns"
  default_mode: "auto"
dependencies: []
---

# Anti AI Design

AI must not choose a visual pattern simply because it is the default, easiest to generate, or prevalent in training data. Every notable visual decision must be grounded in product, brand, content, interaction, or design direction. This skill does not oppose "many effects" — it opposes **unintentional defaults**.

## 1. Core Invariants

1. **Intent Over Default** — Every visual choice must have a reason. "The AI defaults to this" is not a reason. If you cannot articulate a specific intent for a visual decision, the decision is not ready.

2. **Project Taste Before Model Taste** — The project/brand system always overrides AI preference. Color, typography, spacing, radius, icon library — draw from project context, not from the model's training distribution.

3. **Content Before Container** — Content hierarchy determines structure. Do not start with "which card to use" and then stuff content into it. Understand the content first, choose a container (if needed) second.

4. **Clear Attention Model** — Every surface needs a clear attention model. Narrative and decision surfaces typically have a primary focal anchor. Peer-data surfaces (data grids, product listings) may intentionally distribute emphasis. Workflow surfaces (forms, editors, checkout flows) follow progression hierarchy. If a surface lacks a clear model and the eye has nowhere to go — hierarchy fails.

5. **Effects Carry the Burden of Proof** — Border, shadow, gradient, blur, animation — each effect must justify its functional value or identity value. Imagine removing it: if hierarchy, meaning, usability, and brand character do not change, the effect needs a reason to exist.

6. **Existing Pattern Is Evidence, Not Authority** — Current code is evidence of convention, not automatically correct. It may be legacy AI slop. Do not replicate a pattern just because "the codebase already uses it."

7. **System Before Local Styling** — Recurring/shared visual decisions must come from the design system/tokens. Do not hardcode local values for things that repeat. If the project has no system yet, propose creating one. Intentional one-off values (hero art direction, signature elements) are allowed when genuinely local and consistent with the broader direction. If a local decision starts repeating, promote it into the system.

8. **Specificity Over Template Familiarity** — The design must belong to this product. Specificity can come from typography, density, visualization language, interaction model, illustration, content voice, color relationships — not necessarily decoration.

9. **Cumulative Slop Matters** — A single AI-default pattern may be valid. A cluster of defaults is what triggers concern. When multiple signatures co-occur strongly enough that the design could transfer unchanged to an unrelated product, it needs review.

10. **Restraint Is Active Design** — Do not add elements just to make the screen "less empty." Whitespace, simplicity, and absence of decoration are all active design decisions.

## 2. UI Register Gate

Classify the UI surface before applying taste pressure. Anti-AI for a marketing homepage and an enterprise settings screen are not the same.

| Register | Priority | Taste pressure |
|---|---|---|
| **Marketing / Brand** | Identity, art direction, memorability, specificity | High — Brand-Off Test applies strongly |
| **Product / SaaS** | Usability, hierarchy, consistency, product identity | Medium — product specificity, not decoration |
| **Admin / Operational** | Density, speed, predictability, canonical patterns | Low — conventional boring design may be exactly right |
| **Design-system primitive** | System consistency, accessibility, composability | Minimal — follow system rules, not taste |
| **Signature / Experimental** | Intentional visual expression | Varies — must be explicitly authorized |

An admin/operational surface using `white + gray + Inter + Lucide + borders` is not automatically AI slop — if the task is scanning 500 invoices quickly, boring conventional design is sometimes **more correct** than distinctive design. Specificity here comes from workflow, domain vocabulary, information density, data relationships — not from color or shape.

## 3. Operating Modes

| Mode | Behavior | Persistence |
|---|---|---|
| **AUDIT** | Read-only. Inspect and report. Do not modify code or persist design decisions | Never |
| **GENERATE / MODIFY** | Apply the design gate. Implement within authorized task scope | Code only |
| **DESIGN-SYSTEM DECISION** | User confirms a durable design decision. Persist to DESIGN.md / tokens if implementation is authorized | DESIGN.md / tokens |

Analysis authorization ≠ mutation authorization. When a user says "audit this page," the skill inspects and reports — it does not create or modify `DESIGN.md` or code.

## 4. Severity Tiers

### Non-negotiable Gate — always block

Violations that cannot be overridden:
- Breaking accessibility (contrast, semantic markup, keyboard nav)
- Illegible text / unusable interaction
- Security-relevant UI deception

### Contract Gate — block unless explicitly authorized

Violations of the existing design contract. Blocked by default, but the user may authorize:
- Using colors outside documented tokens/palette
- Importing a new icon library when the project already has an icon system
- Replacing canonical project components
- Changing the radius/elevation language
- Using emoji in place of functional icons when the project has an icon system

Override authorization has two scopes:
- **Local exception** — applies only to the current surface; do not promote into the global system. Example: a campaign hero using a special red accent.
- **Durable system change** — update DESIGN.md / tokens / canonical components. Example: replacing the brand color system-wide.

Repetition promotes an exception into a system candidate; one-off intent does not.

### AI-Slop Warning — flag + require rationale

Patterns that may be valid but are typically AI defaults. The agent must state a design reason. Examples: glassmorphism, gradients, bento grids, icon boxes, radius inflation, decorative eyebrows, fade-up animations.

### Taste Signal — track, cumulative triggers review

Not an error in isolation. Multiple signals together create an "AI aesthetic." Example: rounded cards + purple + Sparkles + generic copy + bento + gradient heading + fade-up — co-occurring without a shared design concept → needs review.

> [!TIP]
> Full catalog of ~40 anti-patterns: `.skills/anti-ai-design/references/anti-patterns.md`

## 5. Design Context Resolution

Before generating or modifying UI, the agent follows this order:

1. **Check explicit current brief** — has the user given direction in the current request? ("warm industrial orange + charcoal", "minimalist", "dense data view") → this is the highest authority; do not ask again.
2. **Read brand/design docs** — DESIGN.md, brand guidelines, style guide
3. **Read design tokens** — `tailwind.config`, `theme.ts`, `tokens.css`, CSS custom properties
4. **Read runtime theme** — theme provider, color mode config
5. **Inspect canonical components** — shared UI components, design system library
6. **Inspect 1–2 representative screens** — existing UI patterns, density, rhythm
7. **Resolve design direction** — synthesize and identify the visual language

**Drift detection**: If design intent (DESIGN.md/brand docs) and runtime implementation (tokens/theme) conflict — surface the drift; do not silently pick one side.

**Ask discipline**: Only ask the user when there are unresolved decisions that **materially affect the current surface**. Do not ask about full typography + elevation + brand personality when the task is just creating a compact settings row. Derive from the existing system when there is sufficient evidence.

**Icon awareness**: Check the project icon library. A project-standard icon library answers **HOW** an icon is drawn. It does not answer **WHETHER** an icon is needed. Using Lucide because the project chose Lucide is correct. Scattering Lucide into every heading/card/button because it is convenient is slop.

## 6. Self-Audit Protocol

Before submitting UI code, the agent self-audits according to the register:

1. **Effect Subtraction Test** — for each gradient/shadow/blur/border/icon-box/animation: remove it — does the UI lose anything?
2. **Brand-Off Test** *(marketing/brand surfaces)* — swap in a competitor's logo; does the UI still make sense? For utility surfaces, test product/domain specificity rather than decorative uniqueness.
3. **Icon Necessity Test** — does the icon help recognize the action faster, or is it just filling space?
4. **Attention Model Check** — does the surface have a clear attention model? (focal for narrative, distributed for peer-data, progression for workflow)
5. **Cumulative Slop Check** — multiple AI-default patterns co-occurring without a shared concept → needs revision

Design rationale **does not belong in code comments**. It belongs in: DESIGN.md, the design plan, PR descriptions, or audit output. Use source comments only when the rationale cannot be inferred from the code AND the maintainer needs to know.

## 7. Audit Output

When auditing, use a table format with a **Why it reads generic** column:

| Finding | Evidence | Why it reads generic | Keep / Revise | Better direction |
|---|---|---|---|---|
| Nested cards | 3 surfaces around the same content | boundaries don't encode structure | Revise | spacing + one divider |
| Icon boxes | icon before every heading | repeated AI vocabulary | Revise | keep functional icons only |

Summary uses qualitative assessment, not a numeric score:

```
Register: [marketing / product / admin / ...]
Contract conflicts: [count]
Slop warnings: [count with brief list]
Taste signals: [count]
Cluster detected: [name if applicable]
Overall: [Clean / Acceptable / Review needed / Revise direction]
Rationale: [1-2 sentences why]
```

```tsx
// ❌ AI-slop cluster — ungrounded decisions
<div className="bg-gradient-to-br from-purple-500 to-blue-600">
  <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8">
    <span className="uppercase tracking-widest text-xs">✨ FEATURES</span>
    <h2 className="text-4xl font-bold bg-clip-text text-transparent
      bg-gradient-to-r from-white to-purple-200">Powerful Tools</h2>
  </div>
</div>

// ✅ Intent-driven — decisions traceable to design context
<section className="space-y-6">
  <h2 className="text-heading-lg">What you can do</h2>
  <dl className="grid gap-4 sm:grid-cols-2">
    {features.map(f => (
      <div key={f.id} className="flex gap-3">
        <Icon name={f.icon} size="md" />
        <div>
          <dt className="text-label font-medium">{f.title}</dt>
          <dd className="text-body-sm text-muted">{f.description}</dd>
        </div>
      </div>
    ))}
  </dl>
</section>
```

> [!TIP]
> Detailed audit guide, tests, scoring model: `.skills/anti-ai-design/references/audit-guide.md`
> Extended code examples: `.skills/anti-ai-design/references/examples.md`
> Behavioral evaluation fixtures: `.skills/anti-ai-design/references/behavioral-tests.md`

> [!IMPORTANT]
> This skill is not a minimalism enforcer. A maximalist UI is fine if it is a controlled direction. The standard is **intent**, not quantity. This skill has one job: **veto unconscious model defaults**.

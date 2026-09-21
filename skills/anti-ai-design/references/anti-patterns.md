# Anti AI Design — Anti-Pattern Catalog

Complete list of AI-generated UI anti-patterns. No pattern is absolutely forbidden — but when one appears, the agent must have a clear design intent. Patterns are classified by severity tier:

- **NG** (Non-negotiable Gate) — accessibility, contrast, keyboard → always block
- **CG** (Contract Gate) — violates existing design contract → block unless user explicitly authorizes
- **W** (AI-Slop Warning) — requires rationale → flag
- **S** (Taste Signal) — isolated OK, cumulative → audit

---

## Visual Structure

| Pattern | AI Default | Why Generic | When Valid | Tier |
|---|---|---|---|---|
| **Border overload** | Nests border/rounded/shadow at multiple levels around the same content | Boundaries don't encode structure — they just "look like a card" | Each boundary represents: grouping, interaction boundary, state boundary, elevation, focus, ownership | Warning |
| **Cardification** | Turns all content into cards with border+shadow+radius | Information architecture is forced into a component shape | Data truly consists of discrete visual items (products, portfolios) | Warning |
| **Bento syndrome** | Every landing page becomes a bento grid | Layout template doesn't reflect content hierarchy | Heterogeneous information truly needs modular presentation | Warning |
| **Equal-emphasis layout** | All sections/cards have the same visual weight | No focal hierarchy — 5 things all screaming equally | When items are truly equivalent (photo grid, product listing) | Warning |
| **Everything centered** | Hero, headings, CTA, stats all text-center | Alignment doesn't serve reading flow | Short-form content, hero with single CTA, landing headline | Warning |
| **Perfect symmetry** | Every block is excessively balanced, grid always uses even columns | Monotonous rhythm, no visual interest | Grid data is truly uniform | Signal |
| **Separator addiction** | Border/divider between every row/section | Visual noise — spacing and alignment are usually sufficient | When items need hard boundaries (different data types, dense tables) | Signal |

## Color & Surface

| Pattern | AI Default | Why Generic | When Valid | Tier |
|---|---|---|---|---|
| **AI color invention** | Self-selects blue-500, indigo-600, emerald-500 without following tokens | Colors don't belong to the brand, only to the AI training distribution | When the project has no color system AND the user has approved the palette or the current brief has provided direction | CG (when tokens exist) / W (greenfield) |
| **Gradient text** | Headline gradient by default | Decoration has no brand source | Brand/art direction explicitly requests it | Warning |
| **Background blobs** | Blurred purple/blue decorative blobs | Atmospheric decoration not tied to any concept | Brand visual language includes organic shapes | Warning |
| **Mesh/noise texture** | Noise, grain, dots to create a "premium" feel | Texture doesn't belong to the visual language | When texture is part of brand identity | Signal |
| **Fake dimensionality** | Gradient + border + shadow + blur all at once on a single element | Too many hierarchy devices competing with each other | Usually one device is sufficient | Warning |
| **AI color clusters** | purple+blue SaaS, cream+terracotta editorial, dark+neon hacker | Recognizable common AI aesthetic cluster | When that cluster truly is the brand direction with rationale | Signal |

## Typography

| Pattern | AI Default | Why Generic | When Valid | Tier |
|---|---|---|---|---|
| **Uppercase abuse** | Uppercase for headings, long button labels, body text | Content feels like shouting, harder to read | Short utility labels where scanability and typographic role justify it, badges, overline text with typographic intent — judge by role and measure, not word count | Warning |
| **Weight abuse** | `font-bold` on nearly every heading/metric, lacking weight variation | Hierarchy relies solely on bold, monotonous | When the type scale has sufficient size contrast, bold reinforces structure | Signal |
| **Tracking abuse** | `uppercase` + `tracking-widest` on every label/section header | Has become a common AI vocabulary pattern | When letterspacing serves a specific typographic intent | Warning |
| **Default font stack** | Inter/Geist/Manrope for every brand without distinction | Font choice doesn't reflect product character | When the project has chosen a font with rationale | Signal |
| **Display font misuse** | Adds a display/decorative font just to "look more designer" | Font doesn't come from brand/content/audience need | Font selection from brand, content type, audience, product character | Warning |
| **Type scale chaos** | Random font-size jumps (42px, 27px, 15px, 11px) | No system, each element gets a self-selected size | When using an established type scale (major third, perfect fourth...) | Warning |

## Icons & Decoration

| Pattern | AI Default | Why Generic | When Valid | Tier |
|---|---|---|---|---|
| **Emoji as UI element** | 🚀 Deploy, 📊 Dashboard, ⚙️ Settings, ✅ Active | Emoji are not icons — hard to control cross-platform, unprofessional when used as a system default | User-generated content, inline decoration with intent, or product language explicitly treats emoji as first-class UI semantics (reaction picker, mood tracker, kids education) | CG (when project has icon system) / W (otherwise) |
| **Icon-box syndrome** | Icon sits inside a square/rounded tinted background before every heading | Decorative container serves no function | When the icon box encodes category/type information | Warning |
| **AI icon vocabulary** | Sparkles (AI/magic), Zap (fast), Shield (secure), Rocket (launch) for every feature card | The same icon set repeating across all AI-generated SaaS UIs | When the icon truly represents a specific action/concept of the product | Warning |
| **Floating visual noise** | Sparkles, dots, mini stars, rings, circles as decoration | Decorative marks don't belong to any concept | When decoration is part of an intentional visual language | Signal |
| **Decorative eyebrows** | `FEATURES`, `WHY US`, `01`, `02`, `03` before every section | Label/number doesn't encode real information | When the label represents real categorical information ("API", "SDK") | Warning |
| **Icon library invasion** | Imports lucide-react/heroicons by default without checking the project | Adds unnecessary dependency, breaks icon consistency | When the project officially uses that library | CG (when project has icon system) |
| **Icon monoculture** | Uses the same generic outline-icon vocabulary (Database, Zap, Shield, Sparkles, Rocket, BarChart, BrainCircuit) for every concept because the library is readily available | A project-standard library answers HOW icons are drawn, not WHETHER an icon is needed. Scattering icons into every heading/card/button for convenience is visual filler | When the icon genuinely helps recognize an action/concept faster than text alone | Warning |

## Layout Templates

| Pattern | AI Default | Why Generic | When Valid | Tier |
|---|---|---|---|---|
| **Generic hero** | Badge → huge headline → subtext → 2 CTA → screenshot | Hero template looks like every SaaS landing | The hero is the product's own thesis, layout reflects content | Warning |
| **Template section order** | Hero → logos → features → stats → testimonials → pricing → CTA | Copies a marketing template, doesn't reflect the product narrative | When the information architecture truly follows this flow because of the content | Warning |
| **Uniform section rhythm** | Every section `py-24`, same pattern: title + subtitle + grid | Monotonous, no narrative variation | When content is truly uniform (repeated category pages) | Signal |
| **KPI-card dashboard** | Icon box + large number + delta % + caption × 4 cards | Default dashboard representation for every data overview | When the task is truly monitoring numeric KPIs | Warning |
| **CTA multiplication** | Every section has a button | Every section screams CTA when the user has no decision point yet | When there is a real decision/action at that context | Warning |
| **Card grid for everything** | `grid grid-cols-3 gap-6` for user list, settings, logs... | Grid doesn't suit the data type | Data truly consists of visual/discrete items | Warning |

## Components

| Pattern | AI Default | Why Generic | When Valid | Tier |
|---|---|---|---|---|
| **Radius inflation** | `rounded-xl`, `rounded-2xl` on nearly every surface | Rounds everything to look "modern", not following a system | Radius follows a design system and semantics | Warning |
| **Pillification** | Label, nav, filter, button, badge all become pill shapes | Shape doesn't differentiate control types | Pill represents an appropriate control type/state (tags, filters) | Signal |
| **Shadow inflation** | Every card gets `shadow-sm/md/lg`, shadow doesn't encode meaning | Decorative elevation, doesn't encode layer/depth | Shadow encodes actual layer/depth/interaction state | Warning |
| **Badge/chip overload** | All metadata turned into badges/chips | Visual noise — not all data needs to stand out | Badge for categorical/state information that needs visual distinction | Warning |
| **Over-padding** | `p-6`/`p-8` everywhere, interface feels too airy | Density doesn't suit the task and information density | When the content type needs breathing room (editorial, hero) | Signal |

## Motion & Polish

| Pattern | AI Default | Why Generic | When Valid | Tier |
|---|---|---|---|---|
| **Motion everywhere** | Fade-up on every section on scroll, stagger delay on every card | Animation doesn't explain causality/state/orientation | Motion serves: feedback, orientation, state change, delight | Warning |
| **Generic loading polish** | Shimmer/skeleton on every component | Loading pattern isn't based on latency/content structure | When skeleton preserves content geometry during meaningful wait, improves perceived stability | Signal |

## Content

| Pattern | AI Default | Why Generic | When Valid | Tier |
|---|---|---|---|---|
| **Generic copy** | "Unlock powerful insights", "Seamless experience", "Cutting-edge" | Copy isn't product-specific, not concrete | Copy specifically describes what the product does for whom. Note: utility UI copy ("Save changes", "Cancel", "Delete invoice") should be **specific and useful**, doesn't need to be clever — boring but clear is good | Warning |

---

## AI Aesthetic Clusters

AI tends to converge on a handful of aesthetic clusters regardless of the brief. Recognizing a cluster doesn't mean banning it — but if a design direction could be applied nearly verbatim to 20 unrelated products, it isn't sufficiently grounded.

> These clusters are **examples, not a closed taxonomy**. Detect emerging repetition by structure, not only by matching names in this list. AI default aesthetics shift over time.

| Cluster | Signature elements | Commonly seen in |
|---|---|---|
| **Purple SaaS** | Purple/indigo gradient, rounded-2xl cards, Sparkles/Zap icons, Inter, bento | SaaS landing, AI product pages |
| **Cream Editorial** | Cream/beige + editorial serif + terracotta accents, hairline borders | Portfolio, agency, editorial |
| **Dark Hacker** | Near-black + neon green/red, monospace accents, terminal aesthetic | Developer tools, crypto |
| **Glass Dashboard** | Glassmorphism, backdrop-blur, dark + translucent cards, gradient borders | Analytics, monitoring |
| **Geo Sans Bento** | Huge geometric sans-serif, bento grid, bold colors, asymmetric layout | Modern SaaS, startup landing |
| **Minimal Corporate** | White + gray + Inter + Lucide + cards + subtle shadows | Enterprise SaaS, B2B |

---

## Cooperation Contract

`anti-ai-design` has one mission: **veto unconscious model defaults**. It doesn't need to become a mega-skill that does everything. When other skills are available:

| Skill | Owns | Relationship |
|---|---|---|
| `frontend-design` | Positive creative direction | anti-ai-design gates, frontend-design guides |
| `frontend-design-premium` | Durable product UX, behavior, accessibility | Complementary — different concern |
| `anti-ai-design` | Anti-default / specificity gate | This skill |
| `Designly Taste Engine` | Reference-to-rule extraction | Supplies transferable visual rules |
| `Designly Composition Director` | Focal hierarchy / spatial structure | Overlaps with Invariant 4 |
| `Designly Visual QA` | Independent final visual review | Complementary final check |
| `Designly Brand Intelligence` | Documented brand locks | Supplies brand context for Contract Gate |

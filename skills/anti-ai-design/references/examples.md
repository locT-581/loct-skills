# Anti AI Design — Code Examples

Code examples organized by the 10 Core Invariants. Each example shows AI default vs intentional design, with reasoning for why the pattern reads generic.

---

## Invariant 1: Intent Over Default

Every visual choice must have a reason.

```tsx
// ❌ AI default — each element has an effect that no one asked why
<div className="bg-gradient-to-br from-purple-500 to-blue-600 min-h-screen">
  <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl">
    <span className="uppercase tracking-widest text-xs text-purple-200">✨ FEATURES</span>
    <h2 className="text-4xl font-bold bg-clip-text text-transparent
      bg-gradient-to-r from-white to-purple-200 mt-2">Powerful Tools</h2>
    <p className="text-white/70 mt-4">Unlock seamless experiences</p>
  </div>
</div>
// Why generic: gradient (no brand source), glass (no functional reason),
// uppercase+tracking (decorative), emoji (not an icon), gradient text (no brand),
// generic copy ("powerful tools", "seamless experiences")

// ✅ Intent-driven — each decision traceable to design context
<section className="bg-surface py-section">
  <h2 className="text-heading-lg text-foreground">What you can build</h2>
  <p className="text-body text-muted mt-2">Ship production APIs in minutes, not weeks</p>
</section>
// Why better: tokens from project (bg-surface, text-heading-lg),
// copy describes actual product capability, no decorative effects
```

---

## Invariant 2: Project Taste Before Model Taste

```tsx
// ❌ AI picks colors from training distribution
<button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
  Get Started
</button>
<div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
  <span className="text-emerald-700">Success</span>
</div>
// Why generic: indigo-600, emerald-50 are AI's favorite palette.
// No connection to project brand.

// ✅ Use project tokens
<button className="bg-primary hover:bg-primary-hover text-on-primary rounded-button">
  Get Started
</button>
<div className="bg-success-subtle border border-success-border rounded-feedback p-3">
  <span className="text-success">Success</span>
</div>
// Why better: colors from design tokens, radius from system (rounded-button,
// rounded-feedback), spacing from scale
```

Before writing code, find the design context:
```bash
# Find color tokens
grep -r "colors\|--color" tailwind.config.* src/ --include="*.ts" --include="*.js" --include="*.css" | head -20
# Find existing theme
find . -name "tokens.*" -o -name "theme.*" -o -name "DESIGN.md" | head -10
```

---

## Invariant 3: Content Before Container

```tsx
// ❌ Container-first thinking — card grid for user list
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {users.map(user => (
    <div className="border rounded-xl shadow-lg p-6 text-center
      hover:shadow-xl transition-shadow">
      <img className="rounded-full mx-auto w-16 h-16" src={user.avatar} />
      <h3 className="font-bold mt-3">{user.name}</h3>
      <p className="text-gray-500 text-sm">{user.email}</p>
      <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800
        rounded-full text-xs">{user.role}</span>
    </div>
  ))}
</div>
// Why generic: user data is records, not visual items.
// Card grid forces portrait layout on tabular data.

// ✅ Content-first — table for record data
<table className="w-full">
  <thead>
    <tr className="border-b text-left text-caption text-muted">
      <th className="pb-2">Name</th>
      <th>Email</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-border">
    {users.map(user => (
      <tr key={user.id}>
        <td className="py-3 flex items-center gap-3">
          <Avatar src={user.avatar} size="sm" />
          <span className="text-body font-medium">{user.name}</span>
        </td>
        <td className="text-body text-muted">{user.email}</td>
        <td><Badge variant="neutral">{user.role}</Badge></td>
      </tr>
    ))}
  </tbody>
</table>
// Why better: table matches data type (records with attributes).
// Information scannable, dense, functional.
```

---

## Invariant 4: One Primary Focal Point

```tsx
// ❌ Equal emphasis — everything competes
<section className="text-center py-24">
  <span className="uppercase tracking-wider text-sm text-primary font-bold">
    INTRODUCING PLATFORM X
  </span>
  <h1 className="text-6xl font-black mt-4 bg-clip-text text-transparent
    bg-gradient-to-r from-blue-500 to-purple-500">
    The Future of Analytics
  </h1>
  <p className="text-xl text-gray-500 mt-6 max-w-2xl mx-auto">
    Powerful insights for modern teams
  </p>
  <div className="flex gap-4 justify-center mt-8">
    <button className="bg-gradient-to-r from-blue-500 to-purple-500
      text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg">
      Start Free Trial
    </button>
    <button className="border-2 border-gray-300 px-8 py-4 rounded-full
      text-lg font-bold">Learn More</button>
  </div>
  <div className="mt-12 grid grid-cols-4 gap-8">
    {stats.map(s => (
      <div className="text-center">
        <div className="text-4xl font-black text-primary">{s.value}</div>
        <div className="uppercase tracking-wider text-xs mt-1">{s.label}</div>
      </div>
    ))}
  </div>
</section>
// Why generic: badge, gradient heading, generic copy, 2 CTAs, stats — 
// all compete for attention. No clear focal anchor.

// ✅ Clear hierarchy — headline is focal, rest subordinates
<section className="py-section">
  <h1 className="text-display max-w-prose">
    See what's happening across your entire stack
  </h1>
  <p className="text-body-lg text-muted mt-3 max-w-prose">
    One query, every service. No more switching between 5 dashboards.
  </p>
  <div className="mt-6">
    <Button size="lg">Start monitoring</Button>
  </div>
</section>
// Why better: headline is specific and clearly primary.
// One CTA. Copy describes actual value. No decorative competition.
```

---

## Invariant 5: Effects Carry the Burden of Proof

```tsx
// ❌ Effects without function
<div className="bg-gradient-to-br from-slate-900 to-slate-800
  rounded-3xl p-8 shadow-2xl border border-white/10">
  <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500
      to-purple-500 flex items-center justify-center shadow-lg">
      <Sparkles className="text-white" />
    </div>
    <h3 className="text-white font-bold text-xl mt-4">AI Insights</h3>
    <p className="text-white/60 mt-2">Unlock powerful insights</p>
  </div>
</div>
// Effect Subtraction Test:
// - Remove gradient bg → same meaning ✂️
// - Remove backdrop-blur → same usability ✂️
// - Remove shadow-2xl → no depth info lost ✂️
// - Remove icon gradient box → heading already labels it ✂️
// - Remove border-white/10 → no structural meaning lost ✂️
// Result: 5 effects, 0 functional. All carry no burden of proof.

// ✅ Effects with purpose
<div className="p-4">
  <h3 className="text-heading-sm">Usage analytics</h3>
  <p className="text-body-sm text-muted mt-1">
    Track API calls by endpoint and response time
  </p>
</div>

// ✅ Effect with clear function — dropdown shadow encodes floating layer
<div className="absolute top-full mt-1 bg-surface rounded-md shadow-lg
  border border-border py-1 z-50">
  {options.map(opt => (
    <button className="w-full text-left px-3 py-2 hover:bg-muted">
      {opt.label}
    </button>
  ))}
</div>
// Shadow + border justified: element is floating, needs elevation cue
```

---

## Invariant 7: System Before Local Styling

```tsx
// ❌ Local styling — spacing, radius, colors all invented
<div style={{ padding: '13px 17px', marginBottom: '23px' }}>
  <div className="p-[11px] mt-[7px] gap-[9px] rounded-[14px] bg-[#6366f1]">
    <p className="mb-[5px] text-[15px]">Arbitrary values everywhere</p>
  </div>
</div>
// Why generic: no system — every value is a one-off decision.
// Maintenance nightmare, inconsistency guaranteed.

// ✅ System values — from project's design tokens
<div className="p-4 mb-6">
  <div className="p-3 mt-2 gap-2 rounded-card bg-primary">
    <p className="mb-1 text-body">Consistent with project system</p>
  </div>
</div>
// Why better: spacing from scale, radius from system token,
// color from design tokens. Project changes one token → updates everywhere.
```

Spacing rule: Use the project's spacing system. **Do not invent a new numeric rhythm locally.** If the project uses a 5px base, 8px base, fluid scale, or semantic tokens — follow that. Only propose a new system if the project doesn't have one yet.

---

## Invariant 8: Specificity Over Template Familiarity

```tsx
// ❌ Template landing page — works for any SaaS
<>
  {/* Hero */}
  <section className="text-center py-32 bg-gradient-to-b from-indigo-50">
    <span className="pill bg-indigo-100">New Release ✨</span>
    <h1 className="text-6xl font-black mt-4">The Platform for Modern Teams</h1>
    <p className="text-xl text-gray-500 mt-4">Streamline your workflow</p>
    <div className="flex gap-4 justify-center mt-8">
      <Button>Get Started Free</Button>
      <Button variant="outline">Book a Demo</Button>
    </div>
  </section>
  {/* Logos */}
  <section className="py-16 border-y"><LogoCloud /></section>
  {/* Features */}
  <section className="py-24 text-center">
    <span className="uppercase tracking-wider text-sm">FEATURES</span>
    <h2 className="text-4xl font-bold mt-2">Everything you need</h2>
    <div className="grid grid-cols-3 gap-8 mt-12">
      {features.map(f => (
        <div className="p-6">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 mx-auto">
            <f.icon className="text-indigo-600" />
          </div>
          <h3 className="font-bold mt-4">{f.title}</h3>
          <p className="text-gray-500 mt-2">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
</>
// Brand-Off Test: swap logo → still works for any SaaS. Fail.

// ✅ Product-specific — structure reflects this product's story
<>
  <section className="py-section">
    <h1 className="text-display max-w-2xl">
      Monitor every microservice from one query
    </h1>
    <p className="text-body-lg text-muted mt-3 max-w-xl">
      Write PromQL-compatible queries that span Kubernetes clusters,
      Lambda functions, and bare-metal servers. One syntax, full coverage.
    </p>
    <div className="mt-6 flex items-center gap-4">
      <Button>Connect your first cluster</Button>
      <span className="text-body-sm text-muted">Free for up to 3 services</span>
    </div>
  </section>
  <section className="mt-section">
    <QueryPlayground defaultQuery="sum(rate(http_requests_total[5m]))" />
    {/* Product-specific interactive demo, not generic feature grid */}
  </section>
</>
// Why better: copy is concrete (PromQL, Kubernetes, Lambda),
// hero shows product's actual capability, no template structure.
```

---

## Invariant 9: Cumulative Slop Matters

```tsx
// ❌ Each pattern alone is OK — together they scream "AI generated"
<div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
  {/* rounded-2xl: could be fine */}
  <div className="rounded-2xl border border-white/10 p-8">
    {/* Sparkles: could be intentional */}
    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
      <Sparkles className="text-purple-400" />
    </div>
    {/* gradient text: could be brand */}
    <h3 className="bg-clip-text text-transparent bg-gradient-to-r
      from-white to-purple-200 font-bold text-xl mt-4">AI-Powered Analytics</h3>
    {/* generic copy: could be placeholder */}
    <p className="text-slate-400 mt-2">Unlock powerful insights with cutting-edge technology</p>
  </div>
  {/* Cluster: dark + purple + Sparkles + gradient text + glass + generic copy
     = 6 AI signals co-occurring with no shared design concept */}
</div>

// ✅ Same dark theme — but with product identity
<div className="bg-slate-950">
  <div className="p-6">
    <code className="text-sm font-mono text-emerald-400">anomaly.detect()</code>
    <h3 className="text-white font-medium text-lg mt-3">
      Catch regressions before your users do
    </h3>
    <p className="text-slate-400 mt-1 text-sm">
      Compares p99 latency against your defined SLOs every 30 seconds
    </p>
  </div>
</div>
// Why better: dark theme is valid for dev tools.
// But identity comes from code snippet, concrete copy, no decorative effects.
// Design choices are product-grounded, not aesthetic-cluster-driven.
```

---

## Common AI Patterns — Quick Reference

### KPI Card Dashboard

```tsx
// ❌ AI default — icon box + big number + delta × 4
<div className="grid grid-cols-4 gap-6">
  {kpis.map(kpi => (
    <div className="bg-white rounded-xl border p-6">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
        <kpi.icon className="text-blue-600" />
      </div>
      <div className="text-3xl font-bold mt-4">{kpi.value}</div>
      <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
      <span className="text-green-500 text-sm">↑ {kpi.delta}%</span>
    </div>
  ))}
</div>

// ✅ Choose representation based on task
// If user needs to MONITOR → keep tiles but with system tokens
// If user needs to ANALYZE → chart/table is better
// If user needs to COMPARE → small multiples / sparklines
```

### Icon-Box Syndrome

```tsx
// ❌ Every heading gets a decorative icon in a tinted box
<div className="flex gap-3">
  <div className="w-10 h-10 shrink-0 rounded-lg bg-violet-100
    flex items-center justify-center">
    <BarChart className="w-5 h-5 text-violet-600" />
  </div>
  <div>
    <h3 className="font-semibold">Analytics</h3>
    <p className="text-sm text-gray-500">Track your metrics</p>
  </div>
</div>

// ✅ Icon only when it adds recognition value
<div>
  <h3 className="text-heading-sm">Analytics</h3>
  <p className="text-body-sm text-muted">Track API calls by endpoint and response time</p>
</div>
```

### Bento Grid

```tsx
// ❌ Bento for everything
<div className="grid grid-cols-4 grid-rows-3 gap-4">
  <div className="col-span-2 row-span-2 bg-gradient-to-br from-purple-500 to-blue-500
    rounded-2xl p-8">
    <h3 className="text-white text-2xl font-bold">Main Feature</h3>
  </div>
  <div className="bg-gray-100 rounded-2xl p-6"><h4>Feature 2</h4></div>
  <div className="bg-gray-100 rounded-2xl p-6"><h4>Feature 3</h4></div>
  <div className="col-span-2 bg-gray-100 rounded-2xl p-6"><h4>Feature 4</h4></div>
</div>

// ✅ Bento only when heterogeneous content needs modular presentation
// Otherwise: simple list, definition list, or prose
<dl className="space-y-6">
  <div>
    <dt className="text-heading-sm">Real-time sync</dt>
    <dd className="text-body text-muted mt-1">
      Changes propagate to all connected clients within 50ms via WebSocket.
    </dd>
  </div>
  <div>
    <dt className="text-heading-sm">Conflict resolution</dt>
    <dd className="text-body text-muted mt-1">
      Operational transforms handle concurrent edits without data loss.
    </dd>
  </div>
</dl>
```

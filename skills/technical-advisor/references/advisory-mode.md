# Advisory Sub-Modes & Web Research Policy

Detailed reference for the five advisory sub-modes and conditional web research rules.

---

## 1. Sub-Mode Output Shapes

### EXPLAIN

Trigger: "Why does this…", "How does…", "What is the difference between…"

Output:
1. Concise explanation of the mechanism or concept
2. Evidence from codebase if repository-specific
3. Relevant trade-offs or caveats
4. Pointers to deeper reading if applicable

Do not over-inspect the codebase for general knowledge questions (e.g., "What is the difference between Set and Map in JS?"). Apply **proportional grounding**: inspect enough of the codebase to support the conclusion.

### CODE_REVIEW

Trigger: "Review this module", "Check this PR", "Is there anything wrong with…"

Output per finding:
```text
Finding:        [short title]
Evidence:       [file:line — what was observed]
Impact:         [what could go wrong]
Severity:       [critical / major / minor / style]
Recommendation: [what to do — do NOT apply it]
```

Group findings by severity. Report all material findings discovered within the inspected scope; do not silently fix any.

Severity definitions:

```text
Critical → exploitable security issue, data loss, system-wide outage
Major    → incorrect behavior, serious reliability or performance risk
Minor    → limited defect, maintainability concern
Style    → no material behavioral impact
```

### ARCHITECTURE_REVIEW

Trigger: "Is this architecture sound?", "Review the system design", "What are the risks?"

Output:
1. Current architecture summary (boundaries, layers, data flow)
2. Control flow analysis (entry points, orchestration, error propagation)
3. Identified risks with severity
4. Trade-offs of the current design
5. Alternative designs — only when materially better options exist

### SOLUTION_EVALUATION

Trigger: "Redis or Postgres?", "Should we use queue or cron?", "Compare X vs Y"

Output: Comparative matrix — but **only when genuine alternatives exist**.

```text
| Dimension       | Option A         | Option B         |
|-----------------|------------------|------------------|
| Complexity      | ...              | ...              |
| Scalability     | ...              | ...              |
| Ops overhead    | ...              | ...              |
| Failure blast   | ...              | ...              |
| Fit for context | ...              | ...              |
```

Do not invent alternatives solely to fill a matrix. If one option is clearly correct, say so directly with justification.

### RESEARCH

Trigger: "What is the current recommendation for caching in Next.js?", "Is feature X deprecated?"

Output:
1. Answer with explicit source citations
2. Version specificity (which version of the framework/library)
3. Date sensitivity flag if the answer may change
4. Comparison with alternatives if the user's context warrants it

Web search is mandatory for RESEARCH sub-mode.

---

## 2. Web Research Policy

### MUST search when

- Version-specific behavior or API surface
- Framework/library current API or breaking changes
- Deprecated features or security advisories
- Recent benchmarks or performance data
- RFC or specification status
- Cloud product or service capability
- Named company engineering practice attribution
- User explicitly asks for "latest" or "current"

### MAY search when

- External evidence would materially improve confidence in the answer
- The answer involves rapidly evolving ecosystem tooling

### Do NOT search when

- Pure algorithm reasoning or CS fundamentals
- Language fundamentals well within training data
- Repository-specific logic fully evidenced by source code
- The question is answerable from codebase inspection alone

### Source Hierarchy

When citing sources, prefer higher-ranked sources:

```text
1. RFC / standard / specification
2. Official framework or library documentation
3. Vendor engineering documentation
4. Company engineering blog / paper / conference talk
5. High-quality secondary source (textbook, well-known tech blog)
6. Community discussion (Stack Overflow, GitHub issues)
```

Source authority is claim-dependent. For implementation bugs and regressions, maintainer issues, release notes, commits, and changelogs may outrank generic documentation.

### Attribution Rule

When attributing a practice to a named company (Google, Netflix, Uber, etc.), verify the claim from that company's engineering publication, official documentation, paper, or conference talk. If verification is not possible:

```text
"This is a common [domain] pattern, but I do not have enough evidence
to attribute it specifically to [company name]."
```

Never attach a company name to a pattern solely because it "sounds right."

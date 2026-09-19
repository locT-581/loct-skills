import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { CursorAdapter } from "../src/adapters/cursor.js";
import { ClaudeAdapter } from "../src/adapters/claude.js";
import { WindsurfAdapter } from "../src/adapters/windsurf.js";
import { GenericAdapter } from "../src/adapters/generic.js";
import { compileToTargets, removeFromTargets } from "../src/adapters/index.js";
import { parseSkillContent } from "../src/schemas/skill.schema.js";

describe("Universal Adapters", () => {
  let tempDir: string;

  const mockSkillRaw = `---
name: "sample-skill"
version: "1.0.0"
description: "Sample test skill for adapters"
triggers:
  globs:
    - "src/**/*.ts"
  intents:
    - "test intent"
  default_mode: "auto"
dependencies: []
---

# Sample Skill Header

This is the rule content.
`;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-test-adapters-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("CursorAdapter should compile valid .cursor/rules/<name>.mdc", async () => {
    const adapter = new CursorAdapter();
    const parsed = parseSkillContent(mockSkillRaw);

    await adapter.compile(parsed, tempDir);

    const mdcPath = path.join(tempDir, ".cursor", "rules", "sample-skill.mdc");
    const content = await fs.readFile(mdcPath, "utf-8");

    expect(content).toContain('globs: "src/**/*.ts"');
    expect(content).toContain('description: "Sample test skill for adapters"');
    expect(content).toContain(".skills/sample-skill/SKILL.md");
    expect(content).toContain("This is the rule content.");

    // Remove test
    await adapter.remove("sample-skill", tempDir);
    const cursorExists = await fs.access(mdcPath).then(() => true).catch(() => false);
    expect(cursorExists).toBe(false);
  });

  it("ClaudeAdapter should compile .claude/skills/<name>/SKILL.md", async () => {
    const adapter = new ClaudeAdapter();
    const parsed = parseSkillContent(mockSkillRaw);

    await adapter.compile(parsed, tempDir);

    const skillPath = path.join(tempDir, ".claude", "skills", "sample-skill", "SKILL.md");
    const content = await fs.readFile(skillPath, "utf-8");

    expect(content).toContain('name: "sample-skill"');
    expect(content).toContain("Canonical Skill Package: `.skills/sample-skill/`");
    expect(content).toContain("This is the rule content.");

    // Remove test
    await adapter.remove("sample-skill", tempDir);
    const claudeExists = await fs.access(skillPath).then(() => true).catch(() => false);
    expect(claudeExists).toBe(false);
  });

  it("WindsurfAdapter should insert and update rule block in .windsurfrules", async () => {
    const adapter = new WindsurfAdapter();
    const parsed = parseSkillContent(mockSkillRaw);

    await adapter.compile(parsed, tempDir);

    const rulesPath = path.join(tempDir, ".windsurfrules");
    let content = await fs.readFile(rulesPath, "utf-8");

    expect(content).toContain("<!-- SKILL:sample-skill:START -->");
    expect(content).toContain('<rule name="sample-skill"');
    expect(content).toContain('globs="src/**/*.ts"');
    expect(content).toContain("<!-- SKILL:sample-skill:END -->");

    // Recompile test: Should not duplicate block
    await adapter.compile(parsed, tempDir);
    content = await fs.readFile(rulesPath, "utf-8");
    const matches = content.match(/<!-- SKILL:sample-skill:START -->/g);
    expect(matches?.length).toBe(1);

    // Remove test
    await adapter.remove("sample-skill", tempDir);
    content = await fs.readFile(rulesPath, "utf-8");
    expect(content).not.toContain("<!-- SKILL:sample-skill:START -->");
  });

  it("GenericAdapter should insert and update rule block in AGENTS.md", async () => {
    const adapter = new GenericAdapter();
    const parsed = parseSkillContent(mockSkillRaw);

    await adapter.compile(parsed, tempDir);

    const agentsMdPath = path.join(tempDir, "AGENTS.md");
    let content = await fs.readFile(agentsMdPath, "utf-8");

    expect(content).toContain("<!-- SKILL:sample-skill:START -->");
    expect(content).toContain("## Skill: sample-skill (v1.0.0)");
    expect(content).toContain("<!-- SKILL:sample-skill:END -->");

    // Remove test
    await adapter.remove("sample-skill", tempDir);
    content = await fs.readFile(agentsMdPath, "utf-8");
    expect(content).not.toContain("<!-- SKILL:sample-skill:START -->");
  });

  it("compileToTargets and removeFromTargets should orchestrate multiple adapters", async () => {
    const parsed = parseSkillContent(mockSkillRaw);
    const targets = ["cursor", "claude", "generic"];

    await compileToTargets(parsed, targets, tempDir);

    const mdcPath = path.join(tempDir, ".cursor", "rules", "sample-skill.mdc");
    const claudePath = path.join(tempDir, ".claude", "skills", "sample-skill", "SKILL.md");
    const agentsMdPath = path.join(tempDir, "AGENTS.md");

    expect(await fs.access(mdcPath).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(claudePath).then(() => true).catch(() => false)).toBe(true);
    expect((await fs.readFile(agentsMdPath, "utf-8"))).toContain("## Skill: sample-skill");

    await removeFromTargets("sample-skill", targets, tempDir);

    expect(await fs.access(mdcPath).then(() => true).catch(() => false)).toBe(false);
    expect(await fs.access(claudePath).then(() => true).catch(() => false)).toBe(false);
    expect((await fs.readFile(agentsMdPath, "utf-8"))).not.toContain("## Skill: sample-skill");
  });
});

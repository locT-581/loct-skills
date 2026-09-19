import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { initCommand } from "../src/commands/init.js";
import { addCommand } from "../src/commands/add.js";
import { diffCommand } from "../src/commands/diff.js";
import { updateCommand } from "../src/commands/update.js";
import { readLockfile } from "../src/core/lockfile.js";

describe("CLI Commands Integration", () => {
  let projectDir: string;
  let mockRegistryDir: string;

  beforeEach(async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-test-proj-"));
    mockRegistryDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-test-reg-"));

    // Create a sample skill in mockRegistryDir
    const skillDir = path.join(mockRegistryDir, "test-skill");
    await fs.mkdir(path.join(skillDir, "templates"), { recursive: true });
    await fs.writeFile(
      path.join(skillDir, "SKILL.md"),
      `---
name: "test-skill"
version: "1.0.0"
description: "Integration test skill"
triggers:
  globs: ["src/**/*.ts"]
dependencies: []
---
# Content of test-skill
`
    );
    await fs.writeFile(
      path.join(skillDir, "templates", "demo.ts"),
      "export const demo = 123;"
    );
  });

  afterEach(async () => {
    await fs.rm(projectDir, { recursive: true, force: true });
    await fs.rm(mockRegistryDir, { recursive: true, force: true });
  });

  it("should run init command and create .skills.json", async () => {
    await initCommand({ cwd: projectDir, yes: true });

    const lockfile = await readLockfile(projectDir);
    expect(lockfile).not.toBeNull();
    expect(lockfile?.installed).toEqual({});
  });

  it("should add a skill with targets and write lockfile", async () => {
    await addCommand("test-skill", {
      cwd: projectDir,
      targets: "cursor,generic",
      yes: true,
      registry: mockRegistryDir,
    });

    // Verify package in .skills/
    const installedSkillMd = path.join(projectDir, ".skills", "test-skill", "SKILL.md");
    const templatePath = path.join(projectDir, ".skills", "test-skill", "templates", "demo.ts");
    expect(await fs.readFile(installedSkillMd, "utf-8")).toContain("Content of test-skill");
    expect(await fs.readFile(templatePath, "utf-8")).toContain("demo = 123");

    // Verify generated projections
    const cursorMdc = path.join(projectDir, ".cursor", "rules", "test-skill.mdc");
    const agentsMd = path.join(projectDir, "AGENTS.md");
    expect(await fs.readFile(cursorMdc, "utf-8")).toContain("Rule: test-skill");
    expect(await fs.readFile(agentsMd, "utf-8")).toContain("## Skill: test-skill");

    // Verify lockfile
    const lockfile = await readLockfile(projectDir);
    expect(lockfile?.installed["test-skill"]).toBeDefined();
    expect(lockfile?.installed["test-skill"].targets).toEqual(["cursor", "generic"]);
    expect(lockfile?.installed["test-skill"].contentHash.length).toBe(64);
  });

  it("should detect diff and update correctly", async () => {
    await addCommand("test-skill", {
      cwd: projectDir,
      targets: "cursor",
      yes: true,
      registry: mockRegistryDir,
    });

    // Initial diff must be clean
    await diffCommand("test-skill", { cwd: projectDir });

    // Modify local file in .skills/
    const installedSkillMd = path.join(projectDir, ".skills", "test-skill", "SKILL.md");
    await fs.appendFile(installedSkillMd, "\n# Locally modified line");

    // Run update with --force to overwrite and restore
    await updateCommand("test-skill", {
      cwd: projectDir,
      force: true,
      registry: mockRegistryDir,
    });

    const restoredContent = await fs.readFile(installedSkillMd, "utf-8");
    expect(restoredContent).not.toContain("Locally modified line");
    expect(restoredContent).toContain("Content of test-skill");
  });

  it("should restore missing skill directory on update without false local modification error", async () => {
    await addCommand("test-skill", {
      cwd: projectDir,
      targets: "cursor",
      yes: true,
      registry: mockRegistryDir,
    });

    // Delete local skill directory to simulate missing directory
    const installedSkillDir = path.join(projectDir, ".skills", "test-skill");
    await fs.rm(installedSkillDir, { recursive: true, force: true });

    // Run update with yes: true (should restore missing directory, not skip)
    await updateCommand("test-skill", {
      cwd: projectDir,
      yes: true,
      registry: mockRegistryDir,
    });

    const restoredSkillMd = path.join(projectDir, ".skills", "test-skill", "SKILL.md");
    expect(await fs.readFile(restoredSkillMd, "utf-8")).toContain("Content of test-skill");
  });

  it("should install peer dependencies when adding a skill", async () => {
    // Create base dependency skill in mockRegistryDir
    const depSkillDir = path.join(mockRegistryDir, "dep-skill");
    await fs.mkdir(depSkillDir, { recursive: true });
    await fs.writeFile(
      path.join(depSkillDir, "SKILL.md"),
      `---
name: "dep-skill"
version: "1.0.0"
description: "Base dependency skill"
triggers:
  globs: ["src/**/*.ts"]
dependencies: []
---
# Content of dep-skill
`
    );

    // Create main skill with dependency on dep-skill
    const mainSkillDir = path.join(mockRegistryDir, "main-skill");
    await fs.mkdir(mainSkillDir, { recursive: true });
    await fs.writeFile(
      path.join(mainSkillDir, "SKILL.md"),
      `---
name: "main-skill"
version: "1.0.0"
description: "Main skill requiring dep-skill"
triggers:
  globs: ["src/**/*.ts"]
dependencies:
  - "dep-skill"
---
# Content of main-skill
`
    );

    await addCommand("main-skill", {
      cwd: projectDir,
      targets: "generic",
      yes: true,
      registry: mockRegistryDir,
    });

    const lockfile = await readLockfile(projectDir);
    expect(lockfile?.installed["dep-skill"]).toBeDefined();
    expect(lockfile?.installed["main-skill"]).toBeDefined();

    const depSkillMd = path.join(projectDir, ".skills", "dep-skill", "SKILL.md");
    const mainSkillMd = path.join(projectDir, ".skills", "main-skill", "SKILL.md");
    expect(await fs.readFile(depSkillMd, "utf-8")).toContain("Content of dep-skill");
    expect(await fs.readFile(mainSkillMd, "utf-8")).toContain("Content of main-skill");
  });

  it("should handle circular dependencies without infinite loop or crash", async () => {
    // Create self-referential skill
    const cycleSkillDir = path.join(mockRegistryDir, "cycle-skill");
    await fs.mkdir(cycleSkillDir, { recursive: true });
    await fs.writeFile(
      path.join(cycleSkillDir, "SKILL.md"),
      `---
name: "cycle-skill"
version: "1.0.0"
description: "Self-referencing skill"
triggers:
  globs: []
dependencies:
  - "cycle-skill"
---
# Cycle content
`
    );

    await addCommand("cycle-skill", {
      cwd: projectDir,
      targets: "generic",
      yes: true,
      registry: mockRegistryDir,
    });

    const lockfile = await readLockfile(projectDir);
    expect(lockfile?.installed["cycle-skill"]).toBeDefined();
  });

  it("should validate targets and reject installation when all targets are invalid", async () => {
    await addCommand("test-skill", {
      cwd: projectDir,
      targets: "invalid-target-xyz",
      yes: true,
      registry: mockRegistryDir,
    });

    const lockfile = await readLockfile(projectDir);
    // Lockfile installed list should NOT include test-skill
    expect(lockfile?.installed["test-skill"]).toBeUndefined();
  });

  it("should filter out invalid targets and compile valid ones", async () => {
    await addCommand("test-skill", {
      cwd: projectDir,
      targets: "cursor,invalid-target-xyz",
      yes: true,
      registry: mockRegistryDir,
    });

    const lockfile = await readLockfile(projectDir);
    expect(lockfile?.installed["test-skill"]).toBeDefined();
    expect(lockfile?.installed["test-skill"].targets).toEqual(["cursor"]);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fetchSkill, listAvailableSkills } from "../src/core/fetcher.js";

describe("fetcher Module", () => {
  let tempRegistryDir: string;
  let tempDestDir: string;

  beforeEach(async () => {
    tempRegistryDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-fetcher-reg-"));
    tempDestDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-fetcher-dest-"));

    // Set up a mock skill in tempRegistryDir
    const skillDir = path.join(tempRegistryDir, "alpha-skill");
    await fs.mkdir(path.join(skillDir, "templates"), { recursive: true });
    await fs.writeFile(
      path.join(skillDir, "SKILL.md"),
      `---
name: "alpha-skill"
version: "1.0.0"
description: "Alpha skill description"
triggers:
  globs: ["**/*.ts"]
dependencies: []
---
# Alpha Skill Content
`
    );
    await fs.writeFile(
      path.join(skillDir, "templates", "index.ts"),
      "export const alpha = 1;"
    );
  });

  afterEach(async () => {
    await fs.rm(tempRegistryDir, { recursive: true, force: true });
    await fs.rm(tempDestDir, { recursive: true, force: true });
  });

  it("should list available skills from a specified local registry path", async () => {
    const skills = await listAvailableSkills({ localRegistryPath: tempRegistryDir });
    expect(skills).toContain("alpha-skill");
  });

  it("should return empty list when local registry path does not exist", async () => {
    const skills = await listAvailableSkills({ localRegistryPath: "/path/to/nonexistent/registry" });
    expect(skills).toEqual([]);
  });

  it("should fetch a skill package to destination directory and return parsed skill", async () => {
    const destSkillDir = path.join(tempDestDir, ".skills", "alpha-skill");
    const parsed = await fetchSkill("alpha-skill", destSkillDir, {
      localRegistryPath: tempRegistryDir,
    });

    expect(parsed.frontmatter.name).toBe("alpha-skill");
    expect(parsed.frontmatter.version).toBe("1.0.0");
    expect(parsed.content).toContain("# Alpha Skill Content");

    // Verify files copied to destination
    const copiedTemplate = path.join(destSkillDir, "templates", "index.ts");
    expect(await fs.readFile(copiedTemplate, "utf-8")).toBe("export const alpha = 1;");
  });

  it("should throw a clean error when remote skill cannot be fetched (simulated 404)", async () => {
    const destSkillDir = path.join(tempDestDir, ".skills", "nonexistent-skill");

    await expect(
      fetchSkill("nonexistent-skill", destSkillDir, {
        repository: "invalid-user/invalid-repo-404",
      })
    ).rejects.toThrow("Could not find skill \"nonexistent-skill\" in repository");
  });

  it("should discover local skills relative to cwd option", async () => {
    // Structure: tempProjectDir/skills/custom-skill
    const tempProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-fetcher-cwd-"));
    const skillPath = path.join(tempProjectDir, "skills", "cwd-skill");
    await fs.mkdir(skillPath, { recursive: true });
    await fs.writeFile(
      path.join(skillPath, "SKILL.md"),
      `---
name: "cwd-skill"
version: "1.0.0"
description: "CWD relative skill"
triggers:
  globs: []
dependencies: []
---
# CWD Skill
`
    );

    const destSkillDir = path.join(tempDestDir, ".skills", "cwd-skill");
    const parsed = await fetchSkill("cwd-skill", destSkillDir, {
      cwd: tempProjectDir,
    });

    expect(parsed.frontmatter.name).toBe("cwd-skill");
    await fs.rm(tempProjectDir, { recursive: true, force: true });
  });
});

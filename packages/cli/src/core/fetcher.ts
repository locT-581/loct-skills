import fs from "node:fs/promises";
import path from "node:path";
import { parseSkillContent, ParsedSkill } from "../schemas/skill.schema.js";

export interface FetchOptions {
  repository?: string;
  localRegistryPath?: string;
  cwd?: string;
}

/**
 * Recursively copy directory
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Search for local skills directory (when running in monorepo or dev)
 */
async function findLocalSkillPath(
  skillName: string,
  customPath?: string,
  cwd?: string
): Promise<string | null> {
  const candidates: string[] = [];

  if (customPath) {
    candidates.push(path.join(customPath, skillName));
  }

  if (process.env.SKILLS_REGISTRY_PATH) {
    candidates.push(path.join(process.env.SKILLS_REGISTRY_PATH, skillName));
  }

  // Search parent directories (e.g. monorepo root: ../../skills/<skillName>)
  let cur = cwd || process.cwd();
  for (let i = 0; i < 4; i++) {
    candidates.push(path.join(cur, "skills", skillName));
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  for (const p of candidates) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        const skillMd = path.join(p, "SKILL.md");
        await fs.access(skillMd);
        return p;
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null;
}

/**
 * Fetch a skill package to destination directory .skills/<name> in project
 */
export async function fetchSkill(
  skillName: string,
  destSkillDir: string,
  options: FetchOptions = {}
): Promise<ParsedSkill> {
  const localSrc = await findLocalSkillPath(
    skillName,
    options.localRegistryPath,
    options.cwd
  );

  if (localSrc) {
    // Local Registry / Monorepo mode
    await fs.rm(destSkillDir, { recursive: true, force: true });
    await copyDir(localSrc, destSkillDir);
  } else {
    // Remote GitHub mode
    const repo = options.repository || "username/my-skills";
    const rawUrl = `https://raw.githubusercontent.com/${repo}/main/skills/${skillName}/SKILL.md`;

    const res = await fetch(rawUrl);
    if (!res.ok) {
      throw new Error(
        `Could not find skill "${skillName}" in repository ${repo} (HTTP ${res.status}).`
      );
    }

    const skillMdContent = await res.text();
    await fs.mkdir(destSkillDir, { recursive: true });
    await fs.writeFile(path.join(destSkillDir, "SKILL.md"), skillMdContent, "utf-8");
  }

  // Read and validate recently saved SKILL.md
  const skillMdPath = path.join(destSkillDir, "SKILL.md");
  const rawSkillMd = await fs.readFile(skillMdPath, "utf-8");
  return parseSkillContent(rawSkillMd);
}

/**
 * Get list of available skills in registry
 */
export async function listAvailableSkills(options: FetchOptions = {}): Promise<string[]> {
  const localDir = await (async () => {
    if (options.localRegistryPath) return options.localRegistryPath;
    if (process.env.SKILLS_REGISTRY_PATH) return process.env.SKILLS_REGISTRY_PATH;

    let cur = options.cwd || process.cwd();
    for (let i = 0; i < 4; i++) {
      const cand = path.join(cur, "skills");
      try {
        const stat = await fs.stat(cand);
        if (stat.isDirectory()) return cand;
      } catch {}
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
    return null;
  })();

  if (localDir) {
    try {
      const entries = await fs.readdir(localDir, { withFileTypes: true });
      const skills: string[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            await fs.access(path.join(localDir, entry.name, "SKILL.md"));
            skills.push(entry.name);
          } catch {}
        }
      }
      return skills;
    } catch {
      return [];
    }
  }

  return [];
}

import fs from "node:fs/promises";
import path from "node:path";
import { TargetAdapter } from "./types.js";
import { ParsedSkill } from "../schemas/skill.schema.js";

export class ClaudeAdapter implements TargetAdapter {
  readonly name = "claude";
  readonly displayName = "Claude Code (.claude/skills/<name>/SKILL.md)";

  async detect(projectRoot: string): Promise<boolean> {
    try {
      const dir = path.join(projectRoot, ".claude");
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      try {
        const file = path.join(projectRoot, "CLAUDE.md");
        const stat = await fs.stat(file);
        return stat.isFile();
      } catch {
        return false;
      }
    }
  }

  async compile(skill: ParsedSkill, projectRoot: string): Promise<void> {
    const fm = skill.frontmatter;
    const destDir = path.join(projectRoot, ".claude", "skills", fm.name);
    await fs.mkdir(destDir, { recursive: true });

    const targetFile = path.join(destDir, "SKILL.md");

    const content = [
      "---",
      `name: ${JSON.stringify(fm.name)}`,
      `description: ${JSON.stringify(fm.description)}`,
      "---",
      "",
      `# Skill: ${fm.name}`,
      "",
      `> [!NOTE]`,
      `> Canonical Skill Package: \`.skills/${fm.name}/\``,
      "",
      skill.content,
      "",
    ].join("\n");

    await fs.writeFile(targetFile, content, "utf-8");
  }

  async remove(skillName: string, projectRoot: string): Promise<void> {
    const destDir = path.join(projectRoot, ".claude", "skills", skillName);
    try {
      await fs.rm(destDir, { recursive: true, force: true });
    } catch {}
  }
}

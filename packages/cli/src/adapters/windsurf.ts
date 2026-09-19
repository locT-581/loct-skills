import fs from "node:fs/promises";
import path from "node:path";
import { TargetAdapter } from "./types.js";
import { ParsedSkill } from "../schemas/skill.schema.js";

export class WindsurfAdapter implements TargetAdapter {
  readonly name = "windsurf";
  readonly displayName = "Windsurf (.windsurfrules)";

  async detect(projectRoot: string): Promise<boolean> {
    try {
      await fs.access(path.join(projectRoot, ".windsurfrules"));
      return true;
    } catch {
      try {
        const stat = await fs.stat(path.join(projectRoot, ".windsurf"));
        return stat.isDirectory();
      } catch {
        return false;
      }
    }
  }

  async compile(skill: ParsedSkill, projectRoot: string): Promise<void> {
    const rulesPath = path.join(projectRoot, ".windsurfrules");
    const fm = skill.frontmatter;

    let existingContent = "";
    try {
      existingContent = await fs.readFile(rulesPath, "utf-8");
    } catch {
      existingContent = "# Windsurf Rules\n\n";
    }

    const startTag = `<!-- SKILL:${fm.name}:START -->`;
    const endTag = `<!-- SKILL:${fm.name}:END -->`;

    const globsAttr = fm.triggers.globs.length > 0 ? ` globs="${fm.triggers.globs.join(",")}"` : "";

    const blockContent = [
      startTag,
      `<rule name="${fm.name}" description="${fm.description}"${globsAttr}>`,
      `# ${fm.name} (Canonical: .skills/${fm.name}/SKILL.md)`,
      skill.content,
      `</rule>`,
      endTag,
    ].join("\n");

    const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`, "g");
    let updatedContent: string;
    if (regex.test(existingContent)) {
      updatedContent = existingContent.replace(regex, blockContent);
    } else {
      updatedContent = existingContent.trimEnd() + "\n\n" + blockContent + "\n";
    }

    await fs.writeFile(rulesPath, updatedContent, "utf-8");
  }

  async remove(skillName: string, projectRoot: string): Promise<void> {
    const rulesPath = path.join(projectRoot, ".windsurfrules");
    try {
      const existingContent = await fs.readFile(rulesPath, "utf-8");
      const startTag = `<!-- SKILL:${skillName}:START -->`;
      const endTag = `<!-- SKILL:${skillName}:END -->`;
      const regex = new RegExp(`\\n?${startTag}[\\s\\S]*?${endTag}\\n?`, "g");
      const updated = existingContent.replace(regex, "\n").trimEnd() + "\n";
      await fs.writeFile(rulesPath, updated, "utf-8");
    } catch {}
  }
}

import fs from "node:fs/promises";
import path from "node:path";
import { TargetAdapter } from "./types.js";
import { ParsedSkill } from "../schemas/skill.schema.js";

export class GenericAdapter implements TargetAdapter {
  readonly name = "generic";
  readonly displayName = "Generic AGENTS.md (Terminal agents, Copilot)";

  async detect(projectRoot: string): Promise<boolean> {
    try {
      await fs.access(path.join(projectRoot, "AGENTS.md"));
      return true;
    } catch {
      return false;
    }
  }

  async compile(skill: ParsedSkill, projectRoot: string): Promise<void> {
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");
    const fm = skill.frontmatter;

    let existingContent = "";
    try {
      existingContent = await fs.readFile(agentsMdPath, "utf-8");
    } catch {
      existingContent = "# Project Agent Guidelines & Conventions\n\n";
    }

    const startTag = `<!-- SKILL:${fm.name}:START -->`;
    const endTag = `<!-- SKILL:${fm.name}:END -->`;

    const blockContent = [
      startTag,
      `## Skill: ${fm.name} (v${fm.version})`,
      `*${fm.description}*`,
      "",
      `> [!NOTE]`,
      `> - **Canonical Source**: \`.skills/${fm.name}/SKILL.md\``,
      `> - **Templates** (if any): \`.skills/${fm.name}/templates/\``,
      `> - **Verification** (if any): \`bash .skills/${fm.name}/scripts/verify.sh\``,
      "",
      skill.content,
      "",
      endTag,
    ].join("\n");

    const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`, "g");
    let updatedContent: string;
    if (regex.test(existingContent)) {
      updatedContent = existingContent.replace(regex, blockContent);
    } else {
      updatedContent = existingContent.trimEnd() + "\n\n" + blockContent + "\n";
    }

    await fs.writeFile(agentsMdPath, updatedContent, "utf-8");
  }

  async remove(skillName: string, projectRoot: string): Promise<void> {
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");
    try {
      const existingContent = await fs.readFile(agentsMdPath, "utf-8");
      const startTag = `<!-- SKILL:${skillName}:START -->`;
      const endTag = `<!-- SKILL:${skillName}:END -->`;
      const regex = new RegExp(`\\n?${startTag}[\\s\\S]*?${endTag}\\n?`, "g");
      const updated = existingContent.replace(regex, "\n").trimEnd() + "\n";
      await fs.writeFile(agentsMdPath, updated, "utf-8");
    } catch {}
  }
}

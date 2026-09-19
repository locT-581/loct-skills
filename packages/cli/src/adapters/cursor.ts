import fs from "node:fs/promises";
import path from "node:path";
import { TargetAdapter } from "./types.js";
import { ParsedSkill } from "../schemas/skill.schema.js";

export class CursorAdapter implements TargetAdapter {
  readonly name = "cursor";
  readonly displayName = "Cursor (.cursor/rules/*.mdc)";

  async detect(projectRoot: string): Promise<boolean> {
    try {
      const p = path.join(projectRoot, ".cursor");
      const stat = await fs.stat(p);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async compile(skill: ParsedSkill, projectRoot: string): Promise<void> {
    const rulesDir = path.join(projectRoot, ".cursor", "rules");
    await fs.mkdir(rulesDir, { recursive: true });

    const fm = skill.frontmatter;
    const globsStr = fm.triggers.globs.length > 0 ? fm.triggers.globs.join(", ") : "";
    const alwaysApply = fm.triggers.default_mode === "always";

    const targetFile = path.join(rulesDir, `${fm.name}.mdc`);

    const mdcHeader = [
      "---",
      `description: ${JSON.stringify(fm.description)}`,
      globsStr ? `globs: ${JSON.stringify(globsStr)}` : 'globs: ""',
      `alwaysApply: ${alwaysApply}`,
      "---",
      "",
    ].join("\n");

    const mdcBody = [
      mdcHeader,
      `# Rule: ${fm.name} (v${fm.version})`,
      "",
      `> [!NOTE]`,
      `> - **Canonical Source**: \`.skills/${fm.name}/SKILL.md\``,
      `> - **Templates** (if any): \`.skills/${fm.name}/templates/\``,
      `> - **Verification** (if any): \`bash .skills/${fm.name}/scripts/verify.sh\``,
      "",
      skill.content,
      "",
    ].join("\n");

    await fs.writeFile(targetFile, mdcBody, "utf-8");
  }

  async remove(skillName: string, projectRoot: string): Promise<void> {
    const targetFile = path.join(projectRoot, ".cursor", "rules", `${skillName}.mdc`);
    try {
      await fs.unlink(targetFile);
    } catch {}
  }
}

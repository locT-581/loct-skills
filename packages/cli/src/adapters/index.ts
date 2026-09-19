import { TargetAdapter } from "./types.js";
import { CursorAdapter } from "./cursor.js";
import { ClaudeAdapter } from "./claude.js";
import { WindsurfAdapter } from "./windsurf.js";
import { GenericAdapter } from "./generic.js";
import { ParsedSkill } from "../schemas/skill.schema.js";

export * from "./types.js";

export const adapters: Record<string, TargetAdapter> = {
  cursor: new CursorAdapter(),
  claude: new ClaudeAdapter(),
  windsurf: new WindsurfAdapter(),
  generic: new GenericAdapter(),
};

export function getAdapter(name: string): TargetAdapter | undefined {
  return adapters[name.toLowerCase()];
}

export function getAllAdapters(): TargetAdapter[] {
  return Object.values(adapters);
}

/**
 * Compile a skill across multiple platform targets
 */
export async function compileToTargets(
  skill: ParsedSkill,
  targets: string[],
  projectRoot: string
): Promise<string[]> {
  const compiled: string[] = [];
  for (const targetName of targets) {
    const adapter = getAdapter(targetName);
    if (adapter) {
      await adapter.compile(skill, projectRoot);
      compiled.push(adapter.name);
    }
  }
  return compiled;
}

/**
 * Remove thin projections of a skill from targets
 */
export async function removeFromTargets(
  skillName: string,
  targets: string[],
  projectRoot: string
): Promise<void> {
  for (const targetName of targets) {
    const adapter = getAdapter(targetName);
    if (adapter) {
      await adapter.remove(skillName, projectRoot);
    }
  }
}

import path from "node:path";
import fs from "node:fs/promises";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { readLockfile, LOCKFILE_NAME } from "../core/lockfile.js";
import { hashDirectory } from "../core/hasher.js";

export interface DiffOptions {
  cwd?: string;
  registry?: string;
}

export async function diffCommand(skillName?: string, options: DiffOptions = {}): Promise<void> {
  const projectRoot = options.cwd ? path.resolve(options.cwd) : process.cwd();

  p.intro(pc.bgCyan(pc.black(" skills diff - Check Skill Status & Integrity ")));

  const lockfile = await readLockfile(projectRoot);
  if (!lockfile) {
    p.log.error(`Could not find ${LOCKFILE_NAME}. Please run "skills init" or "skills add" first.`);
    return;
  }

  const skillsToCheck = skillName
    ? [skillName]
    : Object.keys(lockfile.installed);

  if (skillsToCheck.length === 0) {
    p.log.info("No skills currently installed in this project.");
    p.outro("Done.");
    return;
  }

  for (const name of skillsToCheck) {
    const record = lockfile.installed[name];
    if (!record) {
      p.log.warn(`Skill "${name}" is not registered in ${LOCKFILE_NAME}.`);
      continue;
    }

    const localSkillDir = path.join(projectRoot, ".skills", name);
    try {
      await fs.access(localSkillDir);
    } catch {
      p.log.error(
        `❌ [BROKEN] Directory .skills/${name} does not exist on disk! Run "skills update ${name}" to restore.`
      );
      continue;
    }

    const currentHash = await hashDirectory(localSkillDir);

    if (currentHash !== record.contentHash) {
      p.log.warn(
        `⚠️  ${pc.yellow(pc.bold(name))} [LOCAL MODIFIED]: Local content modifications detected!\n` +
        `   - Installed hash: ${record.contentHash.slice(0, 12)}...\n` +
        `   - Current hash:   ${currentHash.slice(0, 12)}...\n` +
        `   - Location: .skills/${name}/`
      );
    } else {
      p.log.success(
        `✅ ${pc.green(pc.bold(name))} (v${record.version}) [CLEAN]: Local content matches lockfile 100% (Targets: ${record.targets.join(", ")})`
      );
    }
  }

  p.outro(pc.cyan("Diff check complete."));
}

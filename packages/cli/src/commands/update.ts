import path from "node:path";
import fs from "node:fs/promises";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { readLockfile, writeLockfile, LOCKFILE_NAME } from "../core/lockfile.js";
import { hashDirectory } from "../core/hasher.js";
import { fetchSkill } from "../core/fetcher.js";
import { compileToTargets } from "../adapters/index.js";

export interface UpdateOptions {
  cwd?: string;
  force?: boolean;
  yes?: boolean;
  registry?: string;
}

export async function updateCommand(skillName?: string, options: UpdateOptions = {}): Promise<void> {
  const projectRoot = options.cwd ? path.resolve(options.cwd) : process.cwd();

  p.intro(pc.bgCyan(pc.black(" skills update - Update Skills & Rebuild Projections ")));

  const lockfile = await readLockfile(projectRoot);
  if (!lockfile) {
    p.log.error(`Could not find ${LOCKFILE_NAME}.`);
    return;
  }

  const skillsToUpdate = skillName
    ? [skillName]
    : Object.keys(lockfile.installed);

  if (skillsToUpdate.length === 0) {
    p.log.info("No skills currently installed in this project.");
    p.outro("Done.");
    return;
  }

  for (const name of skillsToUpdate) {
    const record = lockfile.installed[name];
    if (!record) {
      p.log.warn(`Skill "${name}" is not registered in ${LOCKFILE_NAME}.`);
      continue;
    }

    const localSkillDir = path.join(projectRoot, ".skills", name);
    let isLocalModified = false;

    try {
      await fs.access(localSkillDir);
      const currentHash = await hashDirectory(localSkillDir);
      isLocalModified = currentHash !== record.contentHash;
    } catch {
      // Directory missing
      isLocalModified = false;
    }

    if (isLocalModified && !options.force) {
      if (options.yes) {
        p.log.warn(`[SKIP] Skipping "${name}" due to local modifications (use --force to overwrite).`);
        continue;
      }

      const choice = await p.select({
        message: `Detected local changes in .skills/${name}! How would you like to proceed?`,
        options: [
          { value: "skip", label: "Skip (Keep my local changes)" },
          { value: "backup", label: "Backup (Back up to .skills/<name>.backup then update)" },
          { value: "overwrite", label: "Overwrite (Discard local modifications, fetch upstream)" },
        ],
      });

      if (p.isCancel(choice) || choice === "skip") {
        p.log.info(`Skipped update for "${name}".`);
        continue;
      }

      if (choice === "backup") {
        const backupDir = path.join(projectRoot, ".skills", `${name}.backup-${Date.now()}`);
        await fs.cp(localSkillDir, backupDir, { recursive: true });
        p.log.info(`Created backup at: ${backupDir}`);
      }
    }

    const s = p.spinner();
    s.start(`Updating skill "${name}"...`);

    let parsedSkill;
    try {
      parsedSkill = await fetchSkill(name, localSkillDir, {
        repository: lockfile.repository,
        localRegistryPath: options.registry,
        cwd: projectRoot,
      });
    } catch (err: any) {
      s.stop(pc.red(`Failed to update "${name}": ${err.message}`));
      continue;
    }

    // Rebuild projections
    await compileToTargets(parsedSkill, record.targets, projectRoot);

    const newHash = await hashDirectory(localSkillDir);
    record.version = parsedSkill.frontmatter.version;
    record.contentHash = newHash;
    record.installedAt = new Date().toISOString();

    s.stop(pc.green(`Successfully updated "${name}" (v${record.version}) & rebuilt projections!`));
  }

  await writeLockfile(projectRoot, lockfile);
  p.outro(pc.green("Update complete!"));
}

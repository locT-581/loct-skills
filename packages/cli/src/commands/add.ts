import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { readLockfile, writeLockfile } from "../core/lockfile.js";
import { detectTargets } from "../core/detector.js";
import { fetchSkill } from "../core/fetcher.js";
import { hashDirectory } from "../core/hasher.js";
import { compileToTargets, getAllAdapters } from "../adapters/index.js";

export interface AddOptions {
  targets?: string;
  all?: boolean;
  cwd?: string;
  yes?: boolean;
  registry?: string;
  _visiting?: Set<string>;
}

export async function addCommand(skillName: string, options: AddOptions = {}): Promise<void> {
  const projectRoot = options.cwd ? path.resolve(options.cwd) : process.cwd();

  const visiting = options._visiting || new Set<string>();
  if (visiting.has(skillName)) {
    return;
  }
  visiting.add(skillName);

  p.intro(pc.bgCyan(pc.black(` skills add - Install skill: ${skillName} `)));

  let lockfile = await readLockfile(projectRoot);
  if (!lockfile) {
    p.log.info(".skills.json not found, initializing automatically...");
    lockfile = {
      $schema: "https://raw.githubusercontent.com/username/my-skills/main/schema.json",
      repository: "username/my-skills",
      installed: {},
    };
    await writeLockfile(projectRoot, lockfile);
  }

  // 1. Determine platform targets
  let selectedTargets: string[] = [];
  const allAdapters = getAllAdapters();

  if (options.all) {
    selectedTargets = allAdapters.map((a) => a.name);
  } else if (options.targets) {
    const rawTargets = options.targets
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const validTargetNames = new Set(allAdapters.map((a) => a.name));
    const invalidTargets = rawTargets.filter((t) => !validTargetNames.has(t));
    if (invalidTargets.length > 0) {
      p.log.warn(
        `Unknown target platform(s): ${invalidTargets.join(", ")}. Supported platforms: ${Array.from(validTargetNames).join(", ")}`
      );
    }
    selectedTargets = rawTargets.filter((t) => validTargetNames.has(t));
    if (selectedTargets.length === 0) {
      p.log.error("No valid target platforms specified. Aborting installation.");
      return;
    }
  } else if (options.yes) {
    const detected = await detectTargets(projectRoot);
    selectedTargets = allAdapters.filter((a) => (detected as any)[a.name]).map((a) => a.name);
    if (selectedTargets.length === 0) selectedTargets = ["generic"];
  } else {
    // Interactive multi-select
    const detected = await detectTargets(projectRoot);
    const choices = allAdapters.map((a) => ({
      value: a.name,
      label: a.displayName,
      hint: (detected as any)[a.name] ? "Detected in project" : undefined,
    }));

    const initialValues = allAdapters
      .filter((a) => (detected as any)[a.name])
      .map((a) => a.name);

    const selection = await p.multiselect({
      message: "Select target platforms to generate Thin Projections for this skill:",
      options: choices,
      initialValues: initialValues.length > 0 ? initialValues : ["generic"],
      required: true,
    });

    if (p.isCancel(selection)) {
      p.cancel("Installation cancelled.");
      return;
    }

    selectedTargets = selection as string[];
  }

  // 2. Fetch skill package into .skills/<name>
  const s = p.spinner();
  s.start(`Downloading skill "${skillName}"...`);

  const destDir = path.join(projectRoot, ".skills", skillName);
  let parsedSkill;
  try {
    parsedSkill = await fetchSkill(skillName, destDir, {
      repository: lockfile.repository,
      localRegistryPath: options.registry,
      cwd: projectRoot,
    });
    s.stop(pc.green(`Downloaded skill package to .skills/${skillName}`));
  } catch (err: any) {
    s.stop(pc.red(`Error downloading skill: ${err.message}`));
    return;
  }

  // 3. Check Flat Peer Dependencies
  const deps = parsedSkill.frontmatter.dependencies;
  if (deps && deps.length > 0) {
    for (const dep of deps) {
      if (!lockfile.installed[dep] && !visiting.has(dep) && dep !== skillName) {
        let installDep = options.yes;
        if (!options.yes) {
          const answer = await p.confirm({
            message: `Skill "${skillName}" works best with "${pc.yellow(dep)}". Would you like to install it now?`,
            initialValue: true,
          });
          if (!p.isCancel(answer)) {
            installDep = answer;
          }
        }

        if (installDep) {
          p.log.info(`Installing peer dependency: ${dep}...`);
          await addCommand(dep, {
            ...options,
            targets: options.targets || selectedTargets.join(","),
            yes: true,
            _visiting: visiting,
          });
          // Refresh lockfile
          const reloaded = await readLockfile(projectRoot);
          if (reloaded) lockfile = reloaded;
        }
      }
    }
  }

  // 4. Generate Thin Projections via Adapters
  s.start("Compiling Thin Projections for target platforms...");
  const compiledTargets = await compileToTargets(parsedSkill, selectedTargets, projectRoot);
  s.stop(pc.green(`Successfully compiled for: ${compiledTargets.join(", ")}`));

  // 5. Calculate SHA-256 hash for integrity protection
  const contentHash = await hashDirectory(destDir);

  // 6. Update .skills.json
  lockfile.installed[skillName] = {
    version: parsedSkill.frontmatter.version,
    commit: "local",
    contentHash,
    targets: compiledTargets,
    installedAt: new Date().toISOString(),
  };

  await writeLockfile(projectRoot, lockfile);

  p.note(
    [
      `📦 Canonical Source: .skills/${skillName}/SKILL.md`,
      `🎯 Generated Projections: ${compiledTargets.join(", ")}`,
      `🔑 SHA-256 Hash: ${contentHash.slice(0, 16)}...`,
      `⚠️ Remember to commit .skills/ and .skills.json to Git!`,
    ].join("\n"),
    "Installation Details"
  );

  p.outro(pc.green(`Successfully installed "${skillName}"!`));
}

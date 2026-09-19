import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { readLockfile, writeLockfile, LOCKFILE_NAME } from "../core/lockfile.js";
import { detectTargets } from "../core/detector.js";

export interface InitOptions {
  cwd?: string;
  yes?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const projectRoot = options.cwd ? path.resolve(options.cwd) : process.cwd();

  p.intro(pc.bgCyan(pc.black(" skills init - Initialize Agent Skills Manifest ")));

  const existingLockfile = await readLockfile(projectRoot);
  if (existingLockfile) {
    p.log.warn(`Project already has a ${pc.cyan(LOCKFILE_NAME)} file. Skipping initialization.`);
    p.outro(pc.green("Ready to use!"));
    return;
  }

  const detected = await detectTargets(projectRoot);
  const detectedList: string[] = [];
  if (detected.cursor) detectedList.push("Cursor (.cursor)");
  if (detected.claude) detectedList.push("Claude Code (.claude)");
  if (detected.windsurf) detectedList.push("Windsurf (.windsurf / .windsurfrules)");
  if (detected.agentsMd) detectedList.push("Generic (AGENTS.md)");

  if (detectedList.length > 0) {
    p.log.info(`Detected environment: ${pc.yellow(detectedList.join(", "))}`);
  } else {
    p.log.info("No specific IDE configuration detected. Using Generic AGENTS.md by default.");
  }

  const initialLockfile = {
    $schema: "https://raw.githubusercontent.com/username/my-skills/main/schema.json",
    repository: "username/my-skills",
    installed: {},
  };

  await writeLockfile(projectRoot, initialLockfile);

  p.log.success(`Successfully created ${pc.green(LOCKFILE_NAME)}!`);
  p.outro(pc.cyan("You can now install your first skill using: npx skills add <name>"));
}

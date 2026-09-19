import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { diffCommand } from "./commands/diff.js";
import { updateCommand } from "./commands/update.js";

const program = new Command();

program
  .name("skills")
  .description("Universal AI Agent Skills Manager - Modular, Agnostic & Zero-Friction")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize .skills.json file and detect IDE configurations in project")
  .option("-y, --yes", "Automatically accept default configurations")
  .option("--cwd <path>", "Target working directory")
  .action(async (options) => {
    await initCommand(options);
  });

program
  .command("add <name>")
  .description("Install skill from repository into project and generate Thin Projections")
  .option("-t, --targets <targets>", "Comma-separated list of target platforms (cursor, claude, windsurf, generic)")
  .option("-a, --all", "Apply to all supported platforms")
  .option("-y, --yes", "Automatic mode, no interactive prompts")
  .option("--cwd <path>", "Target working directory")
  .option("--registry <path>", "Local skill registry path for testing")
  .action(async (name, options) => {
    await addCommand(name, options);
  });

program
  .command("diff [name]")
  .description("Check SHA-256 integrity of installed skills against lockfile")
  .option("--cwd <path>", "Target working directory")
  .action(async (name, options) => {
    await diffCommand(name, options);
  });

program
  .command("update [name]")
  .description("Update skills and recompile Thin Projections")
  .option("-f, --force", "Overwrite without confirmation if local changes exist")
  .option("-y, --yes", "Skip skills with local changes without prompting")
  .option("--cwd <path>", "Target working directory")
  .option("--registry <path>", "Local skill registry path for testing")
  .action(async (name, options) => {
    await updateCommand(name, options);
  });

program.parse(process.argv);

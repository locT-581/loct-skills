import fs from "node:fs/promises";
import path from "node:path";

export interface DetectedTargets {
  cursor: boolean;
  claude: boolean;
  windsurf: boolean;
  generic: boolean;
  agentsMd?: boolean;
}

async function isDir(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function isFile(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function detectTargets(projectRoot: string): Promise<DetectedTargets> {
  const [cursorDir, claudeDir, claudeFile, windsurfRules, windsurfDir, agentsMd] =
    await Promise.all([
      isDir(path.join(projectRoot, ".cursor")),
      isDir(path.join(projectRoot, ".claude")),
      isFile(path.join(projectRoot, "CLAUDE.md")),
      isFile(path.join(projectRoot, ".windsurfrules")),
      isDir(path.join(projectRoot, ".windsurf")),
      isFile(path.join(projectRoot, "AGENTS.md")),
    ]);

  const isCursor = cursorDir;
  const isClaude = claudeDir || claudeFile;
  const isWindsurf = windsurfRules || windsurfDir;

  return {
    cursor: isCursor,
    claude: isClaude,
    windsurf: isWindsurf,
    generic: agentsMd || (!isCursor && !isClaude && !isWindsurf), // Default to generic if unclear
    agentsMd,
  };
}

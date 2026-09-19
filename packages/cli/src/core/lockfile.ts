import fs from "node:fs/promises";
import path from "node:path";
import { Lockfile, LockfileSchema } from "../schemas/lockfile.schema.js";

export const LOCKFILE_NAME = ".skills.json";

export async function readLockfile(projectRoot: string): Promise<Lockfile | null> {
  const filePath = path.join(projectRoot, LOCKFILE_NAME);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw);
    return LockfileSchema.parse(json);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return null;
    }
    throw new Error(`Failed to parse ${LOCKFILE_NAME}: ${err.message}`);
  }
}

/**
 * Atomically write .skills.json (write to temporary file then rename)
 * to prevent file corruption if the process is terminated abruptly.
 */
export async function writeLockfile(projectRoot: string, lockfile: Lockfile): Promise<void> {
  await fs.mkdir(projectRoot, { recursive: true });
  const targetPath = path.join(projectRoot, LOCKFILE_NAME);
  const tempPath = path.join(projectRoot, `${LOCKFILE_NAME}.tmp-${Date.now()}`);

  const content = JSON.stringify(lockfile, null, 2) + "\n";

  await fs.writeFile(tempPath, content, "utf-8");
  await fs.rename(tempPath, targetPath);
}

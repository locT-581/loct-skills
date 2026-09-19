import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Calculate SHA-256 of a file.
 */
export async function hashFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Calculate deterministic SHA-256 for an entire directory.
 * Recursively traverses all files, sorts by relative path,
 * and hashes sequentially (relative_path + file_bytes).
 */
export async function hashDirectory(dirPath: string): Promise<string> {
  const fileEntries: { relPath: string; fullPath: string }[] = [];

  async function walk(currentDir: string, baseDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, baseDir);
      } else if (entry.isFile()) {
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
        fileEntries.push({ relPath, fullPath });
      }
    }
  }

  try {
    await walk(dirPath, dirPath);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return "";
    }
    throw err;
  }

  // Sort consistently to ensure deterministic hash across all operating systems
  fileEntries.sort((a, b) => a.relPath.localeCompare(b.relPath));

  const hash = crypto.createHash("sha256");
  for (const entry of fileEntries) {
    hash.update(entry.relPath);
    const fileBuf = await fs.readFile(entry.fullPath);
    hash.update(fileBuf);
  }

  return hash.digest("hex");
}

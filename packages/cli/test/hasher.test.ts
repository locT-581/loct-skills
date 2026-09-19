import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { hashDirectory, hashFile } from "../src/core/hasher.js";

describe("Hasher Core Module", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-test-hasher-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should calculate deterministic SHA-256 for a single file", async () => {
    const filePath = path.join(tempDir, "test.txt");
    await fs.writeFile(filePath, "hello world", "utf-8");

    const hash1 = await hashFile(filePath);
    const hash2 = await hashFile(filePath);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex string
  });

  it("should calculate deterministic SHA-256 for a directory", async () => {
    await fs.mkdir(path.join(tempDir, "sub"), { recursive: true });
    await fs.writeFile(path.join(tempDir, "a.txt"), "A content", "utf-8");
    await fs.writeFile(path.join(tempDir, "sub", "b.txt"), "B content", "utf-8");

    const hash1 = await hashDirectory(tempDir);
    const hash2 = await hashDirectory(tempDir);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it("should change hash when directory contents are modified", async () => {
    const fileA = path.join(tempDir, "a.txt");
    await fs.writeFile(fileA, "A content", "utf-8");

    const hashBefore = await hashDirectory(tempDir);

    // Modify content
    await fs.writeFile(fileA, "A modified content", "utf-8");
    const hashAfter = await hashDirectory(tempDir);

    expect(hashBefore).not.toBe(hashAfter);
  });

  it("should change hash when a new file is added", async () => {
    await fs.writeFile(path.join(tempDir, "a.txt"), "A content", "utf-8");
    const hashBefore = await hashDirectory(tempDir);

    await fs.writeFile(path.join(tempDir, "b.txt"), "B content", "utf-8");
    const hashAfter = await hashDirectory(tempDir);

    expect(hashBefore).not.toBe(hashAfter);
  });
});

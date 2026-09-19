import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { detectTargets } from "../src/core/detector.js";

describe("detectTargets Environment Detector", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-test-detector-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should default to generic when no specific IDE or AGENTS.md exists", async () => {
    const result = await detectTargets(tempDir);
    expect(result).toEqual({
      cursor: false,
      claude: false,
      windsurf: false,
      generic: true,
      agentsMd: false,
    });
  });

  it("should detect Cursor via .cursor directory without generic fallback", async () => {
    await fs.mkdir(path.join(tempDir, ".cursor"));
    const result = await detectTargets(tempDir);
    expect(result.cursor).toBe(true);
    expect(result.claude).toBe(false);
    expect(result.windsurf).toBe(false);
    expect(result.generic).toBe(false);
  });

  it("should detect Claude Code via .claude directory without generic fallback", async () => {
    await fs.mkdir(path.join(tempDir, ".claude"));
    const result = await detectTargets(tempDir);
    expect(result.cursor).toBe(false);
    expect(result.claude).toBe(true);
    expect(result.windsurf).toBe(false);
    expect(result.generic).toBe(false);
  });

  it("should detect Claude Code via CLAUDE.md file without false generic fallback", async () => {
    await fs.writeFile(path.join(tempDir, "CLAUDE.md"), "# Claude guidelines\n");
    const result = await detectTargets(tempDir);
    expect(result.cursor).toBe(false);
    expect(result.claude).toBe(true);
    expect(result.windsurf).toBe(false);
    expect(result.generic).toBe(false);
  });

  it("should detect Windsurf via .windsurfrules file without generic fallback", async () => {
    await fs.writeFile(path.join(tempDir, ".windsurfrules"), "# Windsurf rules\n");
    const result = await detectTargets(tempDir);
    expect(result.cursor).toBe(false);
    expect(result.claude).toBe(false);
    expect(result.windsurf).toBe(true);
    expect(result.generic).toBe(false);
  });

  it("should detect Windsurf via .windsurf directory without generic fallback", async () => {
    await fs.mkdir(path.join(tempDir, ".windsurf"));
    const result = await detectTargets(tempDir);
    expect(result.cursor).toBe(false);
    expect(result.claude).toBe(false);
    expect(result.windsurf).toBe(true);
    expect(result.generic).toBe(false);
  });

  it("should enable generic when AGENTS.md explicitly exists alongside an IDE", async () => {
    await fs.mkdir(path.join(tempDir, ".cursor"));
    await fs.writeFile(path.join(tempDir, "AGENTS.md"), "# Agent guidelines\n");
    const result = await detectTargets(tempDir);
    expect(result.cursor).toBe(true);
    expect(result.generic).toBe(true);
    expect(result.agentsMd).toBe(true);
  });

  it("should not detect .cursor if it is a regular file rather than a directory", async () => {
    await fs.writeFile(path.join(tempDir, ".cursor"), "not a directory");
    const result = await detectTargets(tempDir);
    expect(result.cursor).toBe(false);
    expect(result.generic).toBe(true);
  });

  it("should not detect CLAUDE.md if it is a directory rather than a file", async () => {
    await fs.mkdir(path.join(tempDir, "CLAUDE.md"));
    const result = await detectTargets(tempDir);
    expect(result.claude).toBe(false);
    expect(result.generic).toBe(true);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { register } from "../instrumentation";

describe("instrumentation register", () => {
  const originalRuntime = process.env.NEXT_RUNTIME;
  const originalSecret = process.env.SESSION_SECRET;

  afterEach(() => {
    process.env.NEXT_RUNTIME = originalRuntime;
    process.env.SESSION_SECRET = originalSecret;
  });

  it("refuses to start when SESSION_SECRET is missing", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    delete process.env.SESSION_SECRET;
    await expect(register()).rejects.toThrow(/SESSION_SECRET is not set/);
  });

  it("refuses to start when SESSION_SECRET is too short", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    process.env.SESSION_SECRET = "short";
    await expect(register()).rejects.toThrow(/at least 32 bytes/);
  });

  it("starts normally with a valid SESSION_SECRET", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    process.env.SESSION_SECRET = "a".repeat(32);
    await expect(register()).resolves.toBeUndefined();
  });

  it("skips validation on non-node runtimes", async () => {
    process.env.NEXT_RUNTIME = "edge";
    delete process.env.SESSION_SECRET;
    await expect(register()).resolves.toBeUndefined();
  });
});

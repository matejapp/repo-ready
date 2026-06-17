import { describe, expect, it, vi } from "vitest";
import { createProgram } from "../src/cli/index.js";

describe("CLI", () => {
  it("registers the documented commands and scan options", () => {
    const program = createProgram();
    expect(program.commands.map((command) => command.name())).toEqual([
      "scan",
      "init",
      "checks",
    ]);
    const scan = program.commands.find((command) => command.name() === "scan");
    expect(scan?.options.map((option) => option.long)).toEqual([
      "--config",
      "--json",
    ]);
  });

  it("lists available checks without running diagnostics", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await createProgram().parseAsync(["node", "repoready", "checks"]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("node-version"));
    log.mockRestore();
  });
});

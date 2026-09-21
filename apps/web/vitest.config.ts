/**
 * VITEST.CONFIG.TS
 * ------------------
 * This is the settings file for Vitest — the tool that runs the "unit
 * tests" in `src/**\/*.test.ts` (see lib/*.test.ts for the actual tests).
 *
 * WHAT'S A "UNIT TEST", IN PLAIN TERMS?
 * ----------------------------------------
 * A unit test checks one small, self-contained piece of logic in
 * isolation — no browser, no server, no database — just "if I give this
 * function these inputs, do I get exactly the output I expect back?" I
 * write these for the parts of BuildAI that have real, checkable rules
 * behind them (e.g. "a brand-new account should always start with zero
 * projects," or "restoring a version should never lose the file count").
 * They run in a couple of seconds and catch a whole class of mistakes
 * before I ever have to click around the app by hand to notice them.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});

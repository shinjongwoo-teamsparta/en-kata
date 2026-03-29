import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm"],
  dts: false,
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  noExternal: ["@en-kata/core"],
  external: ["ink", "react"],
  jsx: "automatic",
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
});

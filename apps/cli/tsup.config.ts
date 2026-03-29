import { defineConfig } from "tsup";

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
});

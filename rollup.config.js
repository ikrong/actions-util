import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
// import terser from "@rollup/plugin-terser";
import rm from "rimraf";

rm.sync(`./dist`);

/**@type {import('rollup').RollupOptions} */
export default {
  input: `src/index.ts`,
  output: [
    {
      file: `dist/index.js`,
      name: `create-thing`,
      format: "esm",
      esModule: true,
      inlineDynamicImports: true,
      plugins: [
        // terser()
      ],
    },
  ],
  onwarn() {},
  plugins: [
    typescript({
      compilerOptions: {
        module: "esnext",
      },
    }),
    commonjs(),
    json(),
    resolve({
      exportConditions: ["node"],
      preferBuiltins: true,
    }),
  ],
};

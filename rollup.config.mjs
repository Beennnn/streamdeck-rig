import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

// One plugin, one bundle: src/plugin.ts → com.beennnn.rig.sdPlugin/bin/plugin.js.
// The Stream Deck Node runtime has no node_modules, so everything is inlined.
const sdPlugin = "com.beennnn.rig.sdPlugin";

export default {
	input: "src/plugin.ts",
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		format: "es",
		sourcemap: true,
		sourcemapPathTransform: (rel, map) => `file://${new URL(rel, `file://${map}`).pathname}`,
	},
	plugins: [
		typescript({ tsconfig: "./tsconfig.json", outDir: `${sdPlugin}/bin`, sourceMap: true }),
		nodeResolve({ browser: false, exportConditions: ["node"], preferBuiltins: true }),
		commonjs(),
	],
	external: ["node:child_process"],
};

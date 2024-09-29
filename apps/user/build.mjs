import { build } from "esbuild";
import { glob } from "glob";

const files = await glob("graphql/**/*.ts");

await build({
  sourcemap: "inline",
  sourcesContent: false,
  format: "esm",
  target: "esnext",
  platform: "node",
  external: ["@aws-appsync/utils"],
  outdir: "graphql/build",
  entryPoints: files,
  bundle: true,
});

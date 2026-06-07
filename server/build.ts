import path from "node:path";
import fs from "node:fs";

const outPath = path.resolve("..", "build");

const targets = [
  { target: "bun-linux-x64", outfile: "server-linux-x64" },
  { target: "bun-darwin-arm64", outfile: "server-macos-arm64" },
  { target: "bun-windows-x64", outfile: "server-windows-x64.exe" },
] as const;

if (!fs.existsSync(outPath)) {
  fs.mkdirSync(outPath, { recursive: true });
}

for (const { target, outfile } of targets) {
  const outFile = path.join(outPath, outfile);
  console.log(`\n→ Building for ${target} → ${outfile}`);

  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    compile: {
      target,
      outfile: outFile,
    },
  });

  if (!result.success) {
    console.error(`✗ Build failed for ${target}`);
    process.exit(1);
  }

  console.log(`✓ Done: ${outFile}`);
}

console.log("\n✅ All builds complete.");

fs.cpSync(path.resolve("./public"), path.join(outPath, "public"), {
  recursive: true,
});

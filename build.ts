import path from "node:path";
import fs from "node:fs";

const outPath = path.resolve("./", "build");

const targets = [
  { target: "bun-linux-x64", outfile: "server-linux-x64" },
  { target: "bun-darwin-arm64", outfile: "server-macos-arm64" },
  { target: "bun-windows-x64", outfile: "server-windows-x64.exe" },
] as const;

// ── Prepare output dir ──────────────────────────────────────────────────────
if (!fs.existsSync(outPath)) {
  fs.mkdirSync(outPath, { recursive: true });
}

// ── Build for each OS ───────────────────────────────────────────────────────
for (const { target, outfile } of targets) {
  const binaryPath = path.join(outPath, outfile);

  // Compile binary
  console.log(`\n→ Building ${target} → ${outfile}`);

  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    compile: {
      autoloadTsconfig: true,
      autoloadPackageJson: true,

      target,
      outfile: binaryPath,
    },
    minify: true,
    bytecode: true,
  });

  if (!result.success) {
    console.error(`✗ Build failed for ${target}`);
    process.exit(1);
  }

  console.log(`  ✓ Binary: ${binaryPath}`);
}

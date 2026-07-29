import path from "node:path";
import fs from "node:fs";

const outPath = path.resolve("..", "build");

const targets = [
  { target: "bun-linux-x64", outfile: "server-linux-x64" },
  { target: "bun-darwin-arm64", outfile: "server-macos-arm64" },
  { target: "bun-windows-x64", outfile: "server-windows-x64.exe" },
] as const;

// ── Prepare output dir ──────────────────────────────────────────────────────
if (!fs.existsSync(outPath)) {
  fs.mkdirSync(outPath, { recursive: true });
}

// ── Copy shared assets into build/ ─────────────────────────────────────────
console.log("→ Copying public/ and .env …");

fs.cpSync(path.resolve("./public"), path.join(outPath, "public"), {
  recursive: true,
});

fs.cpSync(path.resolve("./.env"), path.join(outPath, ".env"));

// ── Build + zip each target ─────────────────────────────────────────────────
for (const { target, outfile } of targets) {
  const binaryPath = path.join(outPath, outfile);
  const zipName = outfile.replace(/\.exe$/, "") + ".zip";
  const zipPath = path.join(outPath, zipName);

  // 1. Compile binary
  console.log(`\n→ Building ${target} → ${outfile}`);

  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    compile: {
      target,
      outfile: binaryPath,
    },
  });

  if (!result.success) {
    console.error(`✗ Build failed for ${target}`);
    process.exit(1);
  }

  console.log(`  ✓ Binary: ${binaryPath}`);

  // 2. Zip binary + shared assets
  //    We run zip from inside outPath so paths inside the archive are relative.
  console.log(`  → Zipping → ${zipName}`);

  const zipResult = await Bun.$`zip -r ${zipPath} ${outfile}1 public .env`.cwd(
    outPath,
  );

  if (zipResult.exitCode !== 0) {
    console.error(`✗ zip failed for ${target}`);
    process.exit(zipResult.exitCode);
  }

  console.log(`  ✓ Archive: ${zipPath}`);

  // 3. Remove the loose binary (keep public/ and .env for the next iteration)
  fs.rmSync(binaryPath);
  console.log(`  ✓ Cleaned up binary: ${outfile}`);
}

// ── Remove shared assets that were only needed inside the zip ───────────────
fs.rmSync(path.join(outPath, "public"), { recursive: true, force: true });
fs.rmSync(path.join(outPath, ".env"), { force: true });

console.log("\n✅ All builds complete.\n");
console.log("Output:");
for (const f of fs.readdirSync(outPath)) {
  const size = fs.statSync(path.join(outPath, f)).size;
  console.log(`  ${f}  (${(size / 1024 / 1024).toFixed(1)} MB)`);
}

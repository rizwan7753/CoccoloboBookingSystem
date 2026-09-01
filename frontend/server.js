// cPanel/LiteSpeed (LSNode) entry point. This requires a JS file it can load
// directly — it can't run npm scripts — so this execs `next start` on
// whatever port the platform assigns.
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// TEMP DEBUG: dump exactly what LSNode hands this process at launch, since
// the intended port wasn't showing up in an activated-venv interactive
// shell's `env` output. Remove this block once the real port var is found.
try {
  fs.writeFileSync(
    path.join(__dirname, "env-debug.log"),
    `argv: ${JSON.stringify(process.argv)}\n\nenv:\n${JSON.stringify(process.env, null, 2)}\n`
  );
} catch {
  // ignore — debug-only
}

const port = process.env.PORT || 3000;
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  stdio: "inherit",
  cwd: __dirname,
});

next.on("exit", (code) => process.exit(code ?? 0));

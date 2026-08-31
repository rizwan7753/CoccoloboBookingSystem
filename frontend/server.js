// cPanel/Passenger entry point. Passenger requires a JS file it can load
// directly — it can't run npm scripts — so this just execs `next start`
// on whatever port Passenger assigns via process.env.PORT.
const { spawn } = require("child_process");

const port = process.env.PORT || 3000;
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  stdio: "inherit",
  cwd: __dirname,
});

next.on("exit", (code) => process.exit(code ?? 0));

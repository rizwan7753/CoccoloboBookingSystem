// cPanel/LiteSpeed (LSNode) entry point.
//
// LSNode doesn't hand the app a PORT — it expects the process to listen
// directly on a Unix domain socket path given via LSNODE_SOCKET (LiteSpeed's
// proxy connects to that socket, not a TCP port). `next start -p <port>`
// only binds a TCP port, so a plain CLI spawn can never satisfy this — we
// need Next's programmatic custom-server API instead, which can listen on
// any http.Server target: a socket path here, or a TCP port as a fallback
// for other hosts (e.g. plain Passenger) that do use PORT.
const fs = require("fs");
const { createServer } = require("http");
const next = require("next");

const app = next({ dev: process.env.NODE_ENV !== "production", dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const socketPath = process.env.LSNODE_SOCKET;

  if (socketPath) {
    try {
      fs.unlinkSync(socketPath);
    } catch {
      // no stale socket file — fine
    }
    server.listen(socketPath, () => {
      // eslint-disable-next-line no-console
      console.log(`Ready on socket ${socketPath}`);
    });
  } else {
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Ready on port ${port}`);
    });
  }
});

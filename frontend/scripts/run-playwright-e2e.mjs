import net from "node:net";
import { spawn } from "node:child_process";
import process from "node:process";

const START_PORT = 5173;
const MAX_ATTEMPTS = 200;

function canListen(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once("error", () => resolve(false));
        server.once("listening", () => {
            server.close(() => resolve(true));
        });
        server.listen(port, "127.0.0.1");
    });
}

async function findFreePort() {
    for (let offset = 0; offset < MAX_ATTEMPTS; offset += 1) {
        const port = START_PORT + offset;
        if (await canListen(port)) {
            return port;
        }
    }
    throw new Error(`No free port found between ${START_PORT} and ${START_PORT + MAX_ATTEMPTS - 1}`);
}

async function main() {
    const port = await findFreePort();
    const env = {
        ...process.env,
        PORT: String(port),
        VITE_PORT: String(port),
    };

    const child = spawn("pnpm exec playwright test", {
        cwd: process.cwd(),
        stdio: "inherit",
        env,
        shell: true,
    });

    child.on("error", (err) => {
        console.error("Failed to start Playwright:", err.message);
        if (err.code === "ENOENT") {
            console.error("Ensure pnpm and playwright are installed and on PATH.");
        }
        process.exit(1);
    });

    const code = await new Promise((resolve) => {
        child.on("exit", (exitCode, signal) => {
            if (signal) {
                process.kill(process.pid, signal);
                return;
            }
            resolve(exitCode ?? 1);
        });
    });

    process.exit(code);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

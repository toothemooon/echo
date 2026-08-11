import { execFileSync, spawn } from "node:child_process";
import { request } from "node:http";

const projectRoot = process.cwd();
const deviceName = process.env.ECHO_IOS_DEVICE ?? "iPhone 17";
const port = 8082;
const bundleUrl = `http://127.0.0.1:${port}`;
const launcherUrl = `echo://expo-development-client/?url=${encodeURIComponent(bundleUrl)}`;

function commandOutput(command, args) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function listeningPids() {
  try {
    return commandOutput("lsof", ["-tiTCP:8082", "-sTCP:LISTEN"])
      .split(/\s+/)
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
}

function processCommand(pid) {
  try {
    return commandOutput("ps", ["-p", String(pid), "-o", "command="]);
  } catch {
    return "";
  }
}

function stopProjectMetro() {
  for (const pid of listeningPids()) {
    const command = processCommand(pid);
    if (!command.includes(projectRoot) || !command.includes("expo start")) {
      throw new Error(
        `Port 8082 is occupied by another project (PID ${pid}). Stop it manually; refusing to terminate unrelated work.`,
      );
    }
    process.kill(pid, "SIGINT");
  }
}

function waitForPortToBeFree() {
  const deadline = Date.now() + 10_000;
  return new Promise((resolve, reject) => {
    const poll = () => {
      if (listeningPids().length === 0) {
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error("Port 8082 did not become available."));
        return;
      }
      setTimeout(poll, 250);
    };
    poll();
  });
}

function waitForBundle() {
  const endpoint = `${bundleUrl}/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true`;

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 180_000;
    const poll = () => {
      const req = request(endpoint, { method: "GET" }, (response) => {
        response.resume();
        if (response.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(2_000, () => {
        req.destroy();
        retry();
      });
      req.end();
    };
    const retry = () => {
      if (Date.now() >= deadline) {
        reject(new Error(`Metro did not expose the iOS bundle at ${endpoint}`));
        return;
      }
      setTimeout(poll, 500);
    };
    poll();
  });
}

function runNativeBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      [
        "expo",
        "run:ios",
        "--no-build-cache",
        "--no-bundler",
        "--device",
        deviceName,
      ],
      { cwd: projectRoot, stdio: "inherit" },
    );
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`iOS build exited with ${signal ?? code}`));
    });
  });
}

async function main() {
  stopProjectMetro();
  await waitForPortToBeFree();
  await runNativeBuild();

  const metro = spawn(
    "npx",
    ["expo", "start", "--dev-client", "--host", "lan", "--port", String(port)],
    {
      cwd: projectRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        REACT_NATIVE_PACKAGER_HOSTNAME: "127.0.0.1",
      },
    },
  );

  try {
    await waitForBundle();
    execFileSync("xcrun", ["simctl", "openurl", "booted", launcherUrl], {
      cwd: projectRoot,
      stdio: "inherit",
    });
    console.log(`ECHO is connected to ${bundleUrl}`);
  } catch (error) {
    metro.kill("SIGINT");
    throw error;
  }

  const shutdown = () => metro.kill("SIGINT");
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

const { parentPort, workerData } = require("worker_threads");
const { execFileSync, spawnSync } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

function cleanupFiles(...files) {
    files.forEach((file) => {
        try {
            fs.unlinkSync(file);
        } catch (err) {
            // Ignore errors during cleanup
        }
    });
}

(async () => {
    const { code, input } = workerData;

    const tmpDir = os.tmpdir();
    const sourceFile = path.join(tmpDir, `temp_${Date.now()}.js`); // Ensure it’s a JS file
    const executable = path.join(tmpDir, `temp_${Date.now()}.exe`);

    try {
        // Write the code to the source file
        fs.writeFileSync(sourceFile, code);

        // For Node.js code, just execute the JS file instead of compiling it with Clang
        const runProcess = spawnSync("node", [sourceFile], {
            input,
            encoding: "utf-8",
            timeout: 5000, // Timeout after 5 seconds
        });

        cleanupFiles(sourceFile, executable);

        if (runProcess.error || runProcess.stderr) {
            const error = runProcess.stderr || runProcess.error.message;
            console.error("Error executing code:", error); // Log the error
            return parentPort.postMessage({
                error: { fullError: `Runtime Error:\n${error}` },
            });
        }

        return parentPort.postMessage({
            output: runProcess.stdout || "No output received!",
        });
    } catch (err) {
        cleanupFiles(sourceFile, executable);
        console.error("Worker error:", err.message); // Log the error
        return parentPort.postMessage({
            error: { fullError: `Server error: ${err.message}` },
        });
    }
})();

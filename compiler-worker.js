const { parentPort, workerData } = require("worker_threads");
const { VM } = require("vm2");

(async () => {
    const { code, input } = workerData;

    try {
        // Use a secure VM to run untrusted JavaScript code
        const vm = new VM({
            timeout: 5000, // Timeout after 5 seconds
            sandbox: { input }, // Provide the input as a sandbox variable
        });

        // Execute the code and get the result
        const result = vm.run(`
            const input = sandbox.input;
            ${code}
        `);

        // Return the result to the main thread
        parentPort.postMessage({ output: result || "No output!" });
    } catch (error) {
        // Catch and send any runtime errors
        parentPort.postMessage({
            error: { fullError: `Runtime Error:\n${error.message}` },
        });
    }
})();

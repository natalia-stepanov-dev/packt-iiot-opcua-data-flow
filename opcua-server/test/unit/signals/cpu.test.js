const { describe, test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { cpuUsagePercent, readCpuTemperature } = require("../../../src/signals/cpu");
const { assertClose } = require("../assert-close");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

describe("cpuUsagePercent", () => {
    test("is 20 when the CPU was idle 800 of 1000 ms", () => {
        const previous = { idle: 1000, total: 4000 };
        const current = { idle: 1800, total: 5000 };
        assertClose(cpuUsagePercent(previous, current), 20);
    });

    test("is 0 when the CPU was idle all the time", () => {
        const previous = { idle: 1000, total: 4000 };
        const current = { idle: 2000, total: 5000 };
        assertClose(cpuUsagePercent(previous, current), 0);
    });

    test("is 100 when the CPU was never idle", () => {
        const previous = { idle: 1000, total: 4000 };
        const current = { idle: 1000, total: 5000 };
        assertClose(cpuUsagePercent(previous, current), 100);
    });

    test("is null when no time has passed", () => {
        const snapshot = { idle: 1000, total: 4000 };
        assert.equal(cpuUsagePercent(snapshot, snapshot), null);
    });
});

describe("readCpuTemperature", () => {
    let root;

    // A fresh folder for each test, so sensors of one test do not leak into the next
    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), "hwmon-"));
    });
    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    function addSensor(dirName, files) {
        const dir = path.join(root, dirName);
        fs.mkdirSync(dir);
        for (const [name, text] of Object.entries(files)) {
            fs.writeFileSync(path.join(dir, name), `${text}\n`);
        }
    }

    test("uses coretemp and ignores other drivers", () => {
        addSensor("hwmon0", { name: "acpitz", temp1_input: 52000 });
        addSensor("hwmon4", { name: "thinkpad", temp1_input: 90000 });
        addSensor("hwmon5", { name: "coretemp", temp1_input: 53000 });
        assert.equal(readCpuTemperature(root), 53);
    });

    // The hotter sensor comes first. Abug that keeps the last one would fail
    test("uses the hottest of 2 CPUs", () => {
        addSensor("hwmon1", { name: "coretemp", temp1_input: 61500 });
        addSensor("hwmon2", { name: "coretemp", temp1_input: 53000 });
        assert.equal(readCpuTemperature(root), 61.5);
    });

    test("is null when there is no hwmon folder", () => {
        const missing = path.join(root, "missing");
        assert.equal(readCpuTemperature(missing), null);
    });

    test("is null when the driver has no temp1_input", () => {
        addSensor("hwmon0", { name: "k10temp" });
        assert.equal(readCpuTemperature(root), null);
    });
});

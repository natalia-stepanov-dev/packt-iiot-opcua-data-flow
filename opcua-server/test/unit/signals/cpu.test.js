const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { cpuUsagePercent } = require("../../../src/signals/cpu");
const { assertClose } = require("../assert-close");

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

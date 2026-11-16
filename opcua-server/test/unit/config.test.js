const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { loadConfig } = require("../../src/config");

// A valid set. Each test changes one variable to show what it checks
const VALID_ENV = { OPCUA_USER: "gateway", OPCUA_PASSWORD: "secret" };

describe("loadConfig", () => {
    test("uses port 26543 when OPCUA_PORT is not set", () => {
        assert.deepEqual(loadConfig(VALID_ENV), {
            port: 26543,
            user: "gateway",
            password: "secret",
        });
    });

    test("reads the port from OPCUA_PORT", () => {
        const config = loadConfig({ ...VALID_ENV, OPCUA_PORT: "4841" });
        assert.equal(config.port, 4841);
    });

    test("refuses a port that is not a whole number", () => {
        for (const bad of ["abc", "1e3", "80.5", " 80 "]) {
            assert.throws(
                () => loadConfig({ ...VALID_ENV, OPCUA_PORT: bad }),
                /must be a whole number/,
                `"${bad}" was accepted`,
            );
        }
    });

    // 0 means "any free port" to the OS. 65535 is the TCP maximum
    test("refuses a port outside 1 to 65535", () => {
        for (const bad of ["0", "65536", "70000"]) {
            assert.throws(
                () => loadConfig({ ...VALID_ENV, OPCUA_PORT: bad }),
                /must be from 1 to 65535/,
                `"${bad}" was accepted`,
            );
        }
    });

    test("refuses a missing or empty user or password", () => {
        for (const name of ["OPCUA_USER", "OPCUA_PASSWORD"]) {
            for (const bad of [undefined, ""]) {
                assert.throws(
                    () => loadConfig({ ...VALID_ENV, [name]: bad }),
                    new RegExp(`${name} must be set`),
                    `${name}=${JSON.stringify(bad)} was accepted`,
                );
            }
        }
    });
});

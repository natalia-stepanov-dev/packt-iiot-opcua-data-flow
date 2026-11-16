const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { createUserManager } = require("../../../src/opcua/user-manager");

describe("createUserManager", () => {
    const users = createUserManager("gateway", "secret");

    test("accepts the right user and password", () => {
        assert.equal(users.isValidUser("gateway", "secret"), true);
    });

    test("refuses a wrong user with the right password", () => {
        assert.equal(users.isValidUser("admin", "secret"), false);
    });

    // Hashing makes all lengths equal. Without it timingSafeEqual throws
    test("refuses passwords of any other length without an error", () => {
        for (const bad of ["", "s", "secret-but-much-longer"]) {
            assert.equal(users.isValidUser("gateway", bad), false, `"${bad}" was accepted`);
        }
    });
});

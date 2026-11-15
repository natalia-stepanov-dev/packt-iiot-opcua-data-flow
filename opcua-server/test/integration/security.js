const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { OPCUAClient, MessageSecurityMode, SecurityPolicy } = require("node-opcua");
const { ENDPOINT } = require("./setup");

// Not the shared session. This test needs its own security settings
async function openSession(securityMode, securityPolicy) {
    const client = OPCUAClient.create({
        endpointMustExist: false,
        connectionStrategy: { maxRetry: 0 },
        securityMode,
        securityPolicy,
    });
    // Also on failure. An open connection keeps the test run going forever
    try {
        await client.connect(ENDPOINT);
        const session = await client.createSession();
        await session.close();
    } finally {
        await client.disconnect();
    }
}

describe("Security", () => {
    test("refuses a session without encryption", async () => {
        await assert.rejects(openSession(MessageSecurityMode.None, SecurityPolicy.None));
    });

    test("refuses Sign without Encrypt", async () => {
        await assert.rejects(openSession(MessageSecurityMode.Sign, SecurityPolicy.Basic256Sha256));
    });
});

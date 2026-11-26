const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

process.env.OPCUA_PASSWORD = "Secret-42";
process.env.GATEWAY_DEVICE = "test-device";

const settings = require("../settings.js");

test("the log handler hides the OPC UA password", () => {
  const hide = settings.logging.redact.handler();
  const entry = { msg: "check username: gateway and password: Secret-42" };

  hide(entry);

  assert.equal(entry.msg, "check username: gateway and password: ***");
});

test("the password is hidden before the console writes the log", () => {
  assert.deepEqual(Object.keys(settings.logging), ["redact", "console"]);
});

test("function nodes get the line protocol module", () => {
  // The flow reads it with global.get("lineProtocol")
  assert.equal(
    settings.functionGlobalContext.lineProtocol,
    require("../lib/to-line-protocol.js"),
  );
});

test("Node-RED does not start without GATEWAY_DEVICE", () => {
  // A new process: this file has already loaded settings.js with a valid name
  const env = { ...process.env };
  delete env.GATEWAY_DEVICE;

  const result = spawnSync(
    process.execPath,
    ["-e", 'require("./settings.js")'],
    {
      cwd: path.join(__dirname, ".."),
      env,
      encoding: "utf8",
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /GATEWAY_DEVICE/);
});

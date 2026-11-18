const { test } = require("node:test");
const assert = require("node:assert/strict");

process.env.OPCUA_PASSWORD = "Secret-42";
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

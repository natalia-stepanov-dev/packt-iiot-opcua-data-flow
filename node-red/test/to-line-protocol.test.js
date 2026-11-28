const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  toLineProtocol,
  namespaceIndexOf,
  createStaleCounter,
  createWriteFailureCounter,
} = require("../lib/to-line-protocol.js");

// A real message from the OPC UA client node (25.11.2026)
const cpuMessage = {
  topic: "ns=2;s=Gateway.Cpu.Usage",
  payload: 9.84009840098401,
  statusCode: { value: 0 },
  serverTimestamp: new Date("2026-11-25T11:32:35.665Z"),
  sourceTimestamp: new Date("2026-11-25T11:32:35.665Z"),
};

test("a Good value becomes one line with value, status and source time", () => {
  const line = toLineProtocol(cpuMessage, { device: "laptop" });

  assert.equal(
    line,
    "gateway,device=laptop,signal=Gateway.Cpu.Usage value=9.84009840098401,status=0i 1795606355665",
  );
});

test("a Bad value keeps only the status, the 0 from the server is not a value", () => {
  // Right after the start the server sends 0 with this status
  const message = {
    ...cpuMessage,
    payload: 0,
    statusCode: { value: 0x80320000 }, // BadWaitingForInitialData
    sourceTimestamp: new Date("2026-11-25T11:32:30.000Z"),
  };

  const line = toLineProtocol(message, { device: "laptop" });

  assert.equal(
    line,
    "gateway,device=laptop,signal=Gateway.Cpu.Usage status=2150760448i 1795606350000",
  );
});

test("a Good value with info bits is still written", () => {
  // Good, but the value is at the high limit (InfoType DataValue + LimitHigh)
  const message = {
    ...cpuMessage,
    payload: 100,
    statusCode: { value: 0x00000600 },
  };

  const line = toLineProtocol(message, { device: "laptop" });

  assert.equal(
    line,
    "gateway,device=laptop,signal=Gateway.Cpu.Usage value=100,status=1536i 1795606355665",
  );
});

test("a message without a valid source time is an error", () => {
  // The client node fills in a missing time itself, so this is a bug elsewhere
  const message = { ...cpuMessage, sourceTimestamp: undefined };

  assert.throws(
    () => toLineProtocol(message, { device: "laptop" }),
    /source time/,
  );
});

test("the namespace index comes from the topic as a number", () => {
  // flow.get("ns") holds a number, and "2" !== 2
  assert.equal(namespaceIndexOf("ns=2;s=Gateway.Cpu.Usage"), 2);
});

test("only the first message from an old namespace gives a warning", () => {
  const stale = createStaleCounter();

  assert.equal(
    stale.drop(3, 2),
    "dropping messages from old namespace index 3, current index 2",
  );
  // The next ones are counted, not logged
  assert.equal(stale.drop(3, 2), null);
});

test("the first normal message after old ones gives one summary", () => {
  const stale = createStaleCounter();
  stale.drop(3, 2);
  stale.drop(3, 2);
  stale.drop(3, 2);

  assert.equal(stale.accept(), "dropped 3 messages from old namespace index 3");
  // Not a summary for every normal message, that would be 5 lines a second
  assert.equal(stale.accept(), null);
});

test("a device name with other characters than A-Z a-z 0-9 _ . - is an error", () => {
  // undefined means GATEWAY_DEVICE is not set
  for (const device of [undefined, "", "my laptop", "a,b", "a=b", "line/1"]) {
    assert.throws(
      () => toLineProtocol(cpuMessage, { device }),
      /GATEWAY_DEVICE/,
      `device: ${device}`,
    );
  }
});

test("only the first failed write gives an error", () => {
  const failures = createWriteFailureCounter();
  const body = '{"code":"unauthorized","message":"unauthorized access"}';

  assert.equal(failures.fail(401, body), `InfluxDB write failed: 401 ${body}`);
  // The next ones are counted, not logged
  assert.equal(failures.fail(401, body), null);
});

test("the first write after failed ones gives one summary", () => {
  const failures = createWriteFailureCounter();
  failures.fail(401, "");
  failures.fail(401, "");
  failures.fail(401, "");

  assert.equal(
    failures.ok(),
    "InfluxDB writes work again, 3 points were not written",
  );
  // Not a summary for every good write, that would be 5 lines a second
  assert.equal(failures.ok(), null);
});

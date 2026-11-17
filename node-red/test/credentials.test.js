const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CREDENTIALS_FILE = path.join(__dirname, "..", "flows_cred.json");
const ENV_REFERENCE = /^\$\{[A-Z][A-Z0-9_]*\}$/;

test("flows_cred.json holds only ${VAR} references", () => {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf8"));

  // Node-RED writes an encrypted file as one "$" field
  assert.equal(
    credentials.$,
    undefined,
    "file is encrypted, set credentialServer: false",
  );
  // An empty file would pass the loop below
  assert.ok(Object.keys(credentials).length > 0, "no credentials at all");

  for (const [nodeId, fields] of Object.entries(credentials)) {
    for (const [field, value] of Object.entries(fields)) {
      // assert.match would print the password in the test report
      assert.ok(
        ENV_REFERENCE.test(value),
        `${nodeId}.${field} is not a \${VAR} reference`,
      );
    }
  }
});

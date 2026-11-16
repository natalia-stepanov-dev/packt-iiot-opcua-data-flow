const assert = require("node:assert/strict");

// Floats are not exact. 1 -0.8 gives 0.19999999999999996
function assertClose(actual, expected) {
    assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not close to ${expected}`);
}

module.exports = { assertClose };

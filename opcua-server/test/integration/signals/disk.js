const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { DataType, StatusCodes } = require("node-opcua");
const { readValue, writeDouble, readUnitId, readRange, PERCENT } = require("../setup");

const NODE = "Gateway.Disk.Usage";

describe("Disk usage", () => {
    test("is a Double from 0 to 100", async () => {
        const dataValue = await readValue(NODE);
        assert.equal(dataValue.statusCode.value, StatusCodes.Good.value);
        assert.equal(dataValue.value.dataType, DataType.Double);
        assert.ok(dataValue.value.value >= 0 && dataValue.value.value <= 100);
    });

    test("cannot be written", async () => {
        const status = await writeDouble(NODE, 5);
        assert.equal(status.value, StatusCodes.BadNotWritable.value);
    });

    test("is in percent", async () => {
        assert.equal(await readUnitId(NODE), PERCENT);
    });

    test("has the range 0 to 100", async () => {
        assert.deepEqual(await readRange(NODE), { low: 0, high: 100 });
    });
});

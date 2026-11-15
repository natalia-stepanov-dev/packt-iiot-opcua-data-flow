const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { DataType, StatusCodes } = require("node-opcua");
const { writeDouble, readUnitId, readFirstValue, CELSIUS, PERCENT } = require("../setup");

const USAGE_NODE = "Gateway.Cpu.Usage";
const TEMPERATURE_NODE = "Gateway.Cpu.Temperature";

describe("CPU usage", () => {
    test("becomes Good and is from 0 to 100", async () => {
        const dataValue = await readFirstValue(USAGE_NODE);
        assert.equal(dataValue.statusCode.value, StatusCodes.Good.value);
        assert.equal(dataValue.value.dataType, DataType.Double);
        assert.ok(dataValue.value.value >= 0 && dataValue.value.value <= 100);
    });

    // The server measures this. A client must not change it.
    test("cannot be written", async () => {
        const status = await writeDouble(USAGE_NODE, 5);
        assert.equal(status.value, StatusCodes.BadNotWritable.value);
    });

    test("is in percent", async () => {
        assert.equal(await readUnitId(USAGE_NODE), PERCENT);
    });
});

describe("CPU temperature", () => {
    test("is a Double from 0 to 125°C", async (t) => {
        const dataValue = await readFirstValue(TEMPERATURE_NODE);

        // VMs have no CPU sensor. Show that, do not pass in silence
        if (dataValue.statusCode.value === StatusCodes.BadOutOfService.value) {
            t.skip("no CPU sensor on this machine");
            return;
        }
        assert.equal(dataValue.statusCode.value, StatusCodes.Good.value);
        assert.equal(dataValue.value.dataType, DataType.Double);
        assert.ok(dataValue.value.value >= 0 && dataValue.value.value <= 125);
    });

    test("cannot be written", async () => {
        const status = await writeDouble(TEMPERATURE_NODE, 5);
        assert.equal(status.value, StatusCodes.BadNotWritable.value);
    });

    test("is in °C", async () => {
        assert.equal(await readUnitId(TEMPERATURE_NODE), CELSIUS);
    });
});

"use strict";
const { DataType, StatusCodes, standardUnits } = require("node-opcua");
const { readCpuTimes, cpuUsagePercent, readCpuTemperature } = require("../../signals/cpu");
const { logger } = require("../../logger");

const SAMPLE_INTERVAL_MS = 1000;

function addCpuNodes(namespace, gateway) {
    const cpu = namespace.addObject({
        componentOf: gateway,
        nodeId: "s=Gateway.Cpu",
        browseName: "Cpu",
    });

    // Not getter. One read takes 1 s, and the server would freeze
    const usage = namespace.addAnalogDataItem({
        componentOf: cpu,
        nodeId: "s=Gateway.Cpu.Usage",
        browseName: "Usage",
        dataType: "Double",
        engineeringUnits: standardUnits.percent,
        engineeringUnitsRange: { low: 0, high: 100 },
        accessLevel: "CurrentRead",
        userAccessLevel: "CurrentRead",
        minimumSamplingInterval: SAMPLE_INTERVAL_MS,
    });

    // A 0 here would look like a real value
    usage.setValueFromSource(
        { dataType: DataType.Double, value: 0 },
        StatusCodes.BadWaitingForInitialData,
    );

    const temperature = namespace.addAnalogDataItem({
        componentOf: cpu,
        nodeId: "s=Gateway.Cpu.Temperature",
        browseName: "Temperature",
        dataType: "Double",
        engineeringUnits: standardUnits.degree_celsius,
        engineeringUnitsRange: { low: 0, high: 125 },
        accessLevel: "CurrentRead",
        userAccessLevel: "CurrentRead",
        minimumSamplingInterval: SAMPLE_INTERVAL_MS,
    });
    temperature.setValueFromSource(
        { dataType: DataType.Double, value: 0 },
        StatusCodes.BadWaitingForInitialData,
    );

    let hasSensor = null;
    let previousTimes = readCpuTimes();
    const timer = setInterval(() => {
        const currentTimes = readCpuTimes();
        const percent = cpuUsagePercent(previousTimes, currentTimes);
        previousTimes = currentTimes;
        if (percent === null) {
            return;
        }
        usage.setValueFromSource(
            { dataType: DataType.Double, value: percent },
            StatusCodes.Good,
            new Date(),
        );
        const celsius = readCpuTemperature();
        // Log changes only. A line every second would bury the log
        if ((celsius !== null) !== hasSensor) {
            hasSensor = celsius != null;
            if (hasSensor) {
                logger.info("CPU temperature sensor found");
            } else {
                logger.warn("No CPU temperature sensor, the node shows BadOutOfService");
            }
        }
        // No sensor in a VM. A fake 0°C would look like a real value
        const status = celsius === null ? StatusCodes.BadOutOfService : StatusCodes.Good;
        temperature.setValueFromSource(
            { dataType: DataType.Double, value: celsius ?? 0 },
            status,
            new Date(),
        );
    }, SAMPLE_INTERVAL_MS);

    return () => clearInterval(timer);
}

module.exports = { addCpuNodes };

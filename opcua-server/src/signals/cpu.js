"use strict";
const os = require("os");
const fs = require("fs");
const path = require("path");

const HWMON_ROOT = "/sys/class/hwmon";

// Linux drivers of CPU sensors. Intel, AMD, Raspberry Pi and other ARM
const CPU_SENSOR_NAMES = ["coretemp", "k10temp", "cpu_thermal"];

// The counters are totals since boot, so one reading says nothing on its own.
function readCpuTimes() {
    let idle = 0;
    let total = 0;
    for (const { times } of os.cpus()) {
        idle += times.idle;
        total += times.user + times.nice + times.sys + times.idle + times.irq;
    }
    return { idle, total };
}

function cpuUsagePercent(previous, current) {
    const idleDelta = current.idle - previous.idle;
    const totalDelta = current.total - previous.total;
    // Never with a 1 s timer, but a division by zero must not happen
    if (totalDelta <= 0) {
        return null;
    }
    return 100 * (1 - idleDelta / totalDelta);
}

// A missing file is normal here. Many machines have no such sensor
function readText(file) {
    try {
        return fs.readFileSync(file, "utf8").trim();
    } catch {
        return null;
    }
}

function listSensorDirs(root) {
    try {
        return fs.readdirSync(root).map((entry) => path.join(root, entry));
    } catch {
        return [];
    }
}

function readCpuTemperature(root = HWMON_ROOT, names = CPU_SENSOR_NAMES) {
    let hottest = null;
    for (const dir of listSensorDirs(root)) {
        if (!names.includes(readText(path.join(dir, "name")))) {
            continue;
        }
        const milliCelsius = readText(path.join(dir, "temp1_input"));
        if (milliCelsius === null) {
            continue;
        }
        const celsius = Number(milliCelsius) / 1000;
        // Servers with 2 CPUs have 2 sensors. The hotter one matters
        if (hottest === null || celsius > hottest) {
            hottest = celsius;
        }
    }
    return hottest;
}

module.exports = { readCpuTimes, cpuUsagePercent, readCpuTemperature };

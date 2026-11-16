const { describe, test } = require("node:test");
const { diskUsagePercent } = require("../../../src/signals/disk");
const { assertClose } = require("../assert-close");

describe("diskUsagePercent", () => {
    // 50 blocks are kept for root. df does not count them as free
    test("is 75 when 750 are used and 250 are free for programs", () => {
        const stats = { blocks: 1050, bfree: 300, bavail: 250 };
        assertClose(diskUsagePercent(stats), 75);
    });

    test("is 100 when only the root reserve is left", () => {
        const stats = { blocks: 1000, bfree: 50, bavail: 0 };
        assertClose(diskUsagePercent(stats), 100);
    });

    test("is 0 when nothing is used", () => {
        const stats = { blocks: 1000, bfree: 1000, bavail: 950 };
        assertClose(diskUsagePercent(stats), 0);
    });
});

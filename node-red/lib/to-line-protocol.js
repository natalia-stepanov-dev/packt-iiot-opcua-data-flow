// Safe in line protocol tags and in MQTT topics (module 2) without escaping
const DEVICE_NAME = /^[A-Za-z0-9_.-]+$/;

// Turns one message of the OPC UA client node into InfluxDB line protocol
function toLineProtocol(msg, { device }) {
  // test() turns undefined into the text "undefined", and that would pass
  if (typeof device !== "string" || !DEVICE_NAME.test(device)) {
    throw new Error(
      `GATEWAY_DEVICE "${device}" may only use A-Z a-z 0-9 _ . -`,
    );
  }

  // The topic is "ns=<index>;s=<id>". The tag keeps the id as it is in OPC UA
  const signal = msg.topic.split(";s=")[1];
  const status = msg.statusCode.value;
  // The time can be a Date or a number. new Date() accepts both
  const time = new Date(msg.sourceTimestamp).getTime();

  // A wrong time would put the point at the wrong place in the history
  if (Number.isNaN(time)) {
    throw new Error(`no valid source time for ${msg.topic}`);
  }

  // The two highest bits are the severity: 00 is Good, also with info bits set
  const isGood = status >>> 30 === 0;
  // A Bad value is often a placeholder like 0. The status alone shows the gap
  const fields = isGood
    ? `value=${msg.payload},status=${status}i`
    : `status=${status}i`;

  return `gateway,device=${device},signal=${signal} ${fields} ${time}`;
}

// The topic is "ns=<index>;s=<id>". The flow keeps the index as a number
function namespaceIndexOf(topic) {
  return Number(topic.split(";")[0].replace("ns=", ""));
}

// Counts messages from old subscriptions after the namespace index changed
// Only the first one is logged, so a short tail does not flood the log
function createStaleCounter() {
  let dropped = 0;
  let droppedIndex;

  return {
    drop(oldIndex, currentIndex) {
      dropped += 1;
      droppedIndex = oldIndex;
      if (dropped > 1) {
        return null;
      }
      return `dropping messages from old namespace index ${oldIndex}, current index ${currentIndex}`;
    },
    accept() {
      if (dropped === 0) {
        return null;
      }
      const summary = `dropped ${dropped} messages from old namespace index ${droppedIndex}`;
      // The next change starts a new count and a new warning
      dropped = 0;
      return summary;
    },
  };
}

module.exports = { toLineProtocol, namespaceIndexOf, createStaleCounter };

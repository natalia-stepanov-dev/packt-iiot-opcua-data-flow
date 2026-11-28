const lineProtocol = require("./lib/to-line-protocol.js");

// Like the OPC UA server: no start with a wrong setting
lineProtocol.checkDevice(process.env.GATEWAY_DEVICE);

// Without it every write gets 401, and the data is lost until someone looks
if (!process.env.INFLUX_NODERED_TOKEN) {
  throw new Error("INFLUX_NODERED_TOKEN is not set, see .env.example");
}

const OPCUA_PASSWORD = process.env.OPCUA_PASSWORD;

module.exports = {
  // Without it, the name comes from the hostname, and in Docker that changes
  flowFile: "flows.json",
  // Git diffs stay readable
  flowFilePretty: true,
  // The editor has no password yet. Only this computer can open it
  uiHost: "127.0.0.1",
  // The file holds only ${VAR} names, real values come from the environment
  // With a key, another machine could not load the flows at all
  credentialSecret: false,
  // A function node cannot require a local file. It reads this with global.get()
  functionGlobalContext: {
    lineProtocol,
  },
  logging: {
    // The OPC UA nodes print the password when a connection fails
    // Node-RED calls the handlers in this order, so this one must be first
    redact: {
      level: "trace",
      handler: () => (entry) => {
        if (OPCUA_PASSWORD && typeof entry.msg === "string") {
          entry.msg = entry.msg.replaceAll(OPCUA_PASSWORD, "***");
        }
      },
    },
    // With a logging block, Node-RED adds the console only if it listed
    console: { level: "info" },
  },
};

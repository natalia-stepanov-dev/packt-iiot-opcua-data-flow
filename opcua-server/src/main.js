"use strict";
const { OPCUAServer, nodesets, MessageSecurityMode, SecurityPolicy } = require("node-opcua");
const { constructAddressSpace } = require("./opcua/address-space");
const { version } = require("../package.json");
const { loadConfig } = require("./config");
const { createUserManager } = require("./opcua/user-manager");

(async () => {
    try {
        const config = loadConfig();
        const server = new OPCUAServer({
            port: config.port,
            nodeset_filename: [nodesets.standard],
            // Set by hand. Library defaults change between versions
            securityModes: [MessageSecurityMode.SignAndEncrypt],
            securityPolicies: [
                SecurityPolicy.Basic256Sha256,
                SecurityPolicy.Aes128_Sha256_RsaOaep,
                SecurityPolicy.Aes256_Sha256_RsaPss,
            ],
            userManager: createUserManager(config.user, config.password),
            allowAnonymous: false,
            // Docker build will set buildNumber and buildDate
            buildInfo: {
                productName: "IIoT Edge Gateway",
                productUri: "urn:iiot-edge-gateway",
                manufacturerName: "natalia-stepanov-dev",
                softwareVersion: version,
            },
        });

        await server.initialize();
        const stopSignals = constructAddressSpace(server);
        await server.start();
        console.log("Server is now listening ... ( press CTRL+C to stop) ");
        server.endpoints[0].endpointDescriptions().forEach(function (endpoint) {
            console.log(
                endpoint.endpointUrl,
                endpoint.securityMode.toString(),
                endpoint.securityPolicyUri.toString(),
            );
        });

        // A second signal during shutdown must not start it again.
        let stopping = false;
        async function shutdown(signal) {
            if (stopping) {
                return;
            }
            stopping = true;
            console.log(`${signal} received, shutting down`);
            try {
                stopSignals();
                await server.shutdown();
                console.log("terminated");
                process.exit(0);
            } catch (err) {
                console.log(err);
                process.exit(1);
            }
        }

        // Ctrl+C sends SIGINT. Docker stop sends SIGTERM.
        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
})();

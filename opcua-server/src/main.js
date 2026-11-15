"use strict";
const { OPCUAServer, nodesets, MessageSecurityMode, SecurityPolicy } = require("node-opcua");
const { constructAddressSpace } = require("./opcua/address-space");
const { version } = require("../package.json");
const { loadConfig } = require("./config");
const { createUserManager } = require("./opcua/user-manager");
const { logger } = require("./logger");

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
        const endpoints = server.endpoints[0].endpointDescriptions().map((endpoint) => ({
            url: endpoint.endpointUrl,
            mode: MessageSecurityMode[endpoint.securityMode],
            policy: endpoint.securityPolicyUri.split("#")[1],
        }));
        // The tests wait for this text before they start
        logger.info({ port: config.port, version, endpoints }, "Server is now listening");

        // A second signal during shutdown must not start it again.
        let stopping = false;
        async function shutdown(signal) {
            if (stopping) {
                return;
            }
            stopping = true;
            logger.info({ signal }, "Shutting down");
            try {
                stopSignals();
                await server.shutdown();
                logger.info("Server stopped");
                process.exit(0);
            } catch (err) {
                logger.error({ err }, "Shutdown failed");
                process.exit(1);
            }
        }

        // Ctrl+C sends SIGINT. Docker stop sends SIGTERM.
        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (err) {
        logger.fatal({ err }, "Server failed to start");
        process.exit(1);
    }
})();

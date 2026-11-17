module.exports = {
  // Without it, the name comes from the hostname, and in Docker that changes
  flowFile: "flows.json",
  // Git diffs stay readable
  flowFilePretty: true,
  // The editor has no password yet. Only this computer can open it
  uiHost: "127.0.0.1",
  // The file holds only ${VAR} names, real value come from the enviroment
  // With a key, another machine could not load the flows at all
  credentialSecret: false,
};

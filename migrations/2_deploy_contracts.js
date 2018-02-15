const Connections = artifacts.require("./Connections.sol");

module.exports = function(deployer) {
  deployer.deploy(Connections);
};

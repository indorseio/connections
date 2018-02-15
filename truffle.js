const MAINNET_MEDIAN = 23000000000;
const TRUFFLE_DEFAULT = 100000000000;

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      host: "localhost",
      port: 8545,
      network_id: 3,
    },
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: 4,
    },
    kovan: {
      host: "localhost",
      port: 8545,
      network_id: 42,
    },
    mainnet: {
      host: "mainnet.infura.io", // TOO: http://truffleframework.com/tutorials/using-infura-custom-provider
      port: 8545,
      network_id: 1,
      gasPrice: MAINNET_MEDIAN/2,
    },
  }
};

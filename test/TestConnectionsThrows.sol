pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Connections.sol";
import "../contracts/ConnectionsProxy.sol";

/// @title A solidity test contract for testing that connections functions do throw when expected
/// @author Rick Behl
contract TestConnectionsThrows {

  // Handle for the Connections contract and proxy created by each test    
  Connections connections;
  ConnectionsProxy connectionsProxy;

  /**
   * @notice Function which sets up a new Connections contract before each test
   */
  function beforeEach() public {
    // Get a reference to our main Connections contract
    connections = new Connections();

    // Set the real Connections as the contract to forward requests to. The target.
    connectionsProxy = new ConnectionsProxy(address(connections));
  }

  /**
   * @notice Check that we cannot create more than one user
   * @dev Should throw if we attempt multiple user creations from this account
   */    
  function testCreateMultipleUsersThrow() public {
    // Prime the proxy
    Connections(address(connectionsProxy)).createUser();

    // Execute the call to create the first user
    connectionsProxy.execute.gas(300000)();

    // Prime the proxy for another createUser call
    Connections(address(connectionsProxy)).createUser();

    // Execute the call that is supposed to throw
    // Result will be false if it threw, true if it did not
    bool fnResult = connectionsProxy.execute.gas(300000)();

    // Check the result
    Assert.equal(fnResult, false, "Should be false, as it should throw when creating multiple users from the same address");
  }
}
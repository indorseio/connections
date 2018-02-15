pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Connections.sol";

/// @title A solidity test contract for testing out the Connections contract functionality - connections features
/// @author Rick Behl
contract TestConnectionsTwo {
  // Need to declare directions here too for the Assert calls to work
  enum Direction {NotApplicable, Forwards, Backwards, Invalid}

  // Handle for the Connections contract created by each test
  Connections newConnections;

  /**
   * @notice Function which sets up a new Connections contract before each test
   */
  function beforeEach() public {
    newConnections = new Connections();
  }

  /**
   * @notice Create a user with a connection in one tx
   * @dev Check that the user exists, check connection exists in correct direction  
   */
  function testCreateNewUserConnection() public {
    address newVirtualEntityAddress = newConnections.createVirtualEntity();
    address newUserAddress = newConnections.createUserAndConnection(newVirtualEntityAddress, keccak256("isAdvisorOf"), IConnections.Direction.Forwards);

    // First check that the user was created successfully
    bool createdEntityActive;
    (createdEntityActive,) = newConnections.getEntity(newUserAddress);
    Assert.equal(createdEntityActive, true, "The user just created should be active");
    
    // Next check that the connection is created and active
    bool connActive;    
    (,,connActive,,,) = newConnections.getConnection(newUserAddress, newVirtualEntityAddress, keccak256("isAdvisorOf"));
    Assert.equal(connActive, true, "The Connection should exist and be active");
  }

  /**
   * @notice Create a user with a connection in one tx
   * @dev Check that the entity exists, check connection exists in correct direction  
   */
  function testCreateNewVirtualEntityConnection() public {
    address newUserAddress = newConnections.createUser();
    address newVirtualEntityAddress = newConnections.createVirtualEntityAndConnection(newUserAddress, keccak256("isBeingAdvisedBy"), IConnections.Direction.Forwards);

    bool active;
    (active,) = newConnections.getEntity(newVirtualEntityAddress);
    Assert.equal(active, true, "The entity just created should be active");
    
    // Next check that the connection is created and active
    bool connEntityActive;
    (,connEntityActive,,,,) = newConnections.getConnection(newUserAddress, newVirtualEntityAddress, keccak256("isAdvisorOf"));
    Assert.equal(connEntityActive, true, "The Connection should exist and be active");
  }

  /**
   * @notice Test that an a new connection can be created between a virtual entity and a user
   * @dev Check that the connection exists and is active
   */
  function testAddConnectionVirtualEntityToUser() public {
    address newVirtualEntityAddress = newConnections.createVirtualEntity();
    address newUserAddress = newConnections.createUser();

    // Now test that we can add the connection
    newConnections.addConnection(newVirtualEntityAddress, newUserAddress, keccak256("isAdvisorOf"), IConnections.Direction.Forwards);

    // Next check that the connection is created and active
    bool connEntityActive;
    (,connEntityActive,,,,) = newConnections.getConnection(newUserAddress, newVirtualEntityAddress, keccak256("isAdvisorOf"));
    Assert.equal(connEntityActive, true, "The Connection should exist and be active");
  }  

  /**
   * @notice Test that a connection between a virtual entity and a user can be edited
   * @dev Check that the connection exists and correctly reflects a modification
   */
  function testModifyConnectionVirtualEntityToUser() public {
    address newVirtualEntityAddress = newConnections.createVirtualEntity();
    address newUserAddress = newConnections.createUser();

    // Now test that we can add the connection
    newConnections.addConnection(newVirtualEntityAddress, newUserAddress, keccak256("isAdvisorOf"), IConnections.Direction.Forwards);

    // Next modify the connection
    newConnections.editConnection(newVirtualEntityAddress, newUserAddress, keccak256("isAdvisorOf"), IConnections.Direction.Backwards, true, "xyz", 1541548800);

    // Next check that the connection is created and modified
    bool connActive;
    bytes32 connData;
    IConnections.Direction connDirection;
    uint connExpiration;

    // The new connection should be active and have all the modified fields
    (,, connActive, connData, connDirection, connExpiration) = newConnections.getConnection(newVirtualEntityAddress, newUserAddress, keccak256("isAdvisorOf"));
    Assert.equal(connActive, true, "The Connection should exist and be active");
    Assert.equal(connData, "xyz", "The Connection data should have been modified");
    Assert.equal(uint(connDirection), uint(Direction.Backwards), "The Connection direction should have been modified");
    Assert.equal(connExpiration, 1541548800, "The Connection expiration should have been modified");
  }  

  /**
   * @notice Test that connection can be removed (function: removedConnection)
   * @dev Check that connection no longer exists after removing
   */
  function testRemovingConnection() public {
    address newVirtualEntityAddress = newConnections.createVirtualEntity();
    address newUserAddress = newConnections.createUser();

    // Now test that we can add the connection
    newConnections.addConnection(newVirtualEntityAddress, newUserAddress, keccak256("isAdvisorOf"), IConnections.Direction.Forwards);

    // Next check that the connection is created and active
    bool connEntityActive;    
    (,connEntityActive,,,,) = newConnections.getConnection(newUserAddress, newVirtualEntityAddress, keccak256("isAdvisorOf"));
    Assert.equal(connEntityActive, true, "The Connection should exist and be active");

    // Now remove the connection
    newConnections.removeConnection(newVirtualEntityAddress, newUserAddress, keccak256("isAdvisorOf"));

    // Check connection has been deactivated
    bool connActive;
    (,,connActive,,,) = newConnections.getConnection(newUserAddress, newVirtualEntityAddress, keccak256("isAdvisorOf"));
    Assert.equal(connActive, false, "The connection should no longer be active");
  }

  /**
   * @notice Test that entity owner transfer can be initiated (function: transferEntityOwnerPush)
   * @dev Check that initiating a transfer of entity is reflected by change of state
   */
  function testTransferEntityOwnerPush() public {
    // Create a new entity
    address newVirtualEntityAddress = newConnections.createVirtualEntity();

    // Check entity is not currently in a transfer process
    bool active;
    address transferOwnerTo;

    (active,) = newConnections.getEntity(newVirtualEntityAddress);
    Assert.equal(active, true, "The entity should be created and active");

    newConnections.transferEntityOwnerPush(newVirtualEntityAddress, address(1));

    (,transferOwnerTo,,) = newConnections.getEntity(newVirtualEntityAddress);
    Assert.equal(transferOwnerTo, address(1), "The entity should reflect a transfer in progress");    
  }
}
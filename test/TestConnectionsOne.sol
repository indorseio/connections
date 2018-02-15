pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Connections.sol";

/// @title A solidity test contract for testing out the Connections contract functionality - non-connections features
/// @author Rick Behl
contract TestConnectionsOne {
 
  // Handle for the Connections contract created by each test
  Connections newConnections;

  /**
   * @notice Function which sets up a new Connections contract before each test
   */
  function beforeEach() public {
    newConnections = new Connections();
  }

  /**
   * @notice Test that a user can be created with a name
   * @dev After user is created it can be retrieved by the address and the owner matches this contract  
   */
  function testCreateNewUserOwner() public {
    address newUserAddress = newConnections.createUser();

    address owner;
    (,owner) = newConnections.getEntity(newUserAddress);
    Assert.equal(owner, this, "The owner of the new user should be this contract"); // SHOULD PASS
  }

  /** 
   * @notice Test that an entity owner can actually edit their entity data
   * @dev Check state after edit has been correctly updated
   */  
  function testEditUserEntityData() public {
    address newUserEntityAddress = newConnections.createUser();
    newConnections.editEntity(newUserEntityAddress, true, "abcdef");

    bytes32 data;
    (,,data,) = newConnections.getEntity(newUserEntityAddress);
    Assert.equal(data, "abcdef", "The data of the user entity should have been updated");
  }

  /** 
   * @notice Test that an entity owner can actually edit their entity active flag
   * @dev Check state after edit has been correctly updated
   */  
  function testEditUserEntityActive() public {
    address newUserAddress = newConnections.createUser();
    newConnections.editEntity(newUserAddress, false, "");

    bool active;
    (active,) = newConnections.getEntity(newUserAddress);
    Assert.equal(active, false, "The status of the entity should have been updated");
  }


  /**
   * @notice Test that a virtual entity can be created
   * @dev After entity is created check the owner
   */
  function testCreateNewVirtualEntity() public {
    address newVirtualEntityAddress = newConnections.createVirtualEntity();

    bool active;
    (active,) = newConnections.getEntity(newVirtualEntityAddress);
    Assert.equal(active, true, "The entity should be created and active");
  }

  /** 
   * @notice Test that an entity owner can actually edit their entity data
   * @dev Check state after edit has been correctly updated
   */  
  function testEditVirtualEntityData() public {
    address newVirtualEntityAddress = newConnections.createVirtualEntity();
    newConnections.editEntity(newVirtualEntityAddress, true, "abcdef");

    bytes32 data;
    (,,data,) = newConnections.getEntity(newVirtualEntityAddress);
    Assert.equal(data, "abcdef", "The data of the virtual entity should have been updated");
  }

  /** 
   * @notice Test that an entity owner can actually edit their entity active flag
   * @dev Check state after edit has been correctly updated
   */  
  function testEditVirtualEntityActive() public {
    address newVirtualEntityAddress = newConnections.createVirtualEntity();
    newConnections.editEntity(newVirtualEntityAddress, false, "");

    bool active;
    (active,) = newConnections.getEntity(newVirtualEntityAddress);
    Assert.equal(active, false, "The status of the virtual entity should have been updated");
  }

  /**
   * @notice Test that an entity owner can deactivate it
   * @dev Check that the entity is no longer active
   */
  function testDeactivateEntity() public {
    address newVirtualEntityAddress = newConnections.createVirtualEntity();
    uint256 numberVirtualEntitiesCreated = newConnections.virtualEntitiesCreated();

    // Check for the existence of the new entity
    bool active;
    (active,) = newConnections.getEntity(newVirtualEntityAddress);
    Assert.equal(active, true, "The entity just created should be active");
    Assert.equal(numberVirtualEntitiesCreated, 1, "There should be a count of one virtual entities");

    // Now test that we can deactivate the entity
    newConnections.editEntity(newVirtualEntityAddress, false, "");
    (active,) = newConnections.getEntity(newVirtualEntityAddress);
    Assert.equal(active, false, "The entity just created should no longer be active");    
  }  
}

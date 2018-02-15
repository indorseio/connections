let Connections = artifacts.require("Connections");
let should = require('should')

let Direction = {
    'NotApplicable': 0,
    'Forwards': 1,
    'Backwards': 2,
    'Invalid': 3,
}
Direction.length = 4

const EVM_INVALID_OPCODE_ERR = 'VM Exception while processing transaction: invalid opcode'
const EVM_REVERT_ERR = 'VM Exception while processing transaction: revert'

contract('Connections (multi-connections)', async function(accounts) {

    let connectionsInstance;

    const account1Owner = accounts[0]
    const account2 = accounts[1]
    const account3 = accounts[2]
    const account4 = accounts[3]
    const account5 = accounts[4]

    let advisorConnectionType
    let followerConnectionType
    let partnersConnectionType

    let firstTest = true;

    beforeEach(async () => {
        connectionsInstance = await Connections.new()

        if(firstTest) {
            advisorConnectionType = await connectionsInstance.sha256ofString("isAdvisorOf");
            followerConnectionType = await connectionsInstance.sha256ofString("isFollowerOf");
            partnersConnectionType = await connectionsInstance.sha256ofString("isCommercialPartnerOf")
            firstTest = false
        }
    });


    describe ("1-1 connections", function() {
        it("should create a user which follows another user (user2user)", async function() {
            let account1EntityAddr = await createUser(account1Owner)
            let account2EntityAddr = await createUser(account2)

            await connectionsInstance.addConnection(account1EntityAddr, account2EntityAddr, followerConnectionType, Direction.Forwards, {from: account1Owner})
            await connectionsInstance.addConnection(account2EntityAddr, account1EntityAddr, followerConnectionType, Direction.Forwards, {from: account2})

            let connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);

            bothConnectionActive(connections)
            areSameDirections(connections)
        })

        it("should create a user which is an advisor of a company (user2virtual)", async function() {
            let account1EntityAddr =  await createUser(account1Owner)
            let companyAddress = await createVirtualEntity(account1Owner)

            await connectionsInstance.addConnection(account1EntityAddr, companyAddress, advisorConnectionType, Direction.Forwards)
            await connectionsInstance.addConnection(companyAddress, account1EntityAddr, advisorConnectionType, Direction.Backwards)

            let connections = await getConnections(account1EntityAddr, companyAddress, advisorConnectionType);

            areOppositeDirections(connections)

        })


        it("should create two companies which are partners (virtual2virtual)", async function() {
            let companyAddress1 = await createVirtualEntity(account1Owner)

            let companyAddress2 = await createVirtualEntity(account2)

            await connectionsInstance.addConnection(companyAddress1, companyAddress2, partnersConnectionType, Direction.Forwards, {from: account1Owner})
            await connectionsInstance.addConnection(companyAddress2, companyAddress1, partnersConnectionType, Direction.Forwards, {from: account2})

            let connections = await getConnections(companyAddress1, companyAddress2, partnersConnectionType);

            areSameDirections(connections)

        })
        
        describe("Test that remove and transfer entity/connections work", function() {
            it("should create a user which follows another user (user2user)", async function() {
                let account1EntityAddr = await createUser(account1Owner)
                let account2EntityAddr = await createUser(account2)

                // Add the connection between both, delete the connection and then add it again
                await connectionsInstance.addConnection(account1EntityAddr, account2EntityAddr, followerConnectionType, Direction.Forwards, {from: account1Owner})
                await connectionsInstance.addConnection(account2EntityAddr, account1EntityAddr, followerConnectionType, Direction.Forwards, {from: account2})
                let connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                await connectionsInstance.removeConnection(account1EntityAddr, account2EntityAddr, followerConnectionType, {from:account1Owner})
                connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);
                oneConnectionNotActive(connections)

                await connectionsInstance.removeConnection(account2EntityAddr, account1EntityAddr, followerConnectionType, {from:account2})
                connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);
                bothConnectionNotActive(connections)

                await connectionsInstance.addConnection(account2EntityAddr, account1EntityAddr, followerConnectionType, Direction.Forwards, {from: account2})
                connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);
                oneConnectionNotActive(connections)

                await connectionsInstance.addConnection(account1EntityAddr, account2EntityAddr, followerConnectionType, Direction.Backwards, {from: account1Owner})
                connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);
                bothConnectionActive(connections)
                bothEntityActive(connections)
                areOppositeDirections(connections)

                // Delete User2 entity
                try {
                    await
                    connectionsInstance.editEntity(account2EntityAddr, false, "", {from: account1Owner})
                    throw new Error("This should not execute")
                } catch (error) {
                    assert.instanceOf(error, Error, 'Should not be able to delete a user entity without being the owner')
                }
                await connectionsInstance.editEntity(account2EntityAddr, false, "", {from: account2})
                connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);

                bothConnectionActive(connections)
                oneEntityActive(connections)

                await connectionsInstance.editEntity(account2EntityAddr, true, "", {from: account2})
                connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);

                bothConnectionActive(connections)
                bothEntityActive(connections)

                await connectionsInstance.editEntity(account1EntityAddr, false, "", {from: account1Owner})
                await connectionsInstance.editEntity(account2EntityAddr, false, "", {from: account2})
                connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);

                neitherEntityActive(connections)

                await connectionsInstance.editEntity(account1EntityAddr, true, "", {from: account1Owner})
                await connectionsInstance.editEntity(account2EntityAddr, true, "", {from: account2})
                connections = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);

                bothConnectionActive(connections)
                bothEntityActive(connections)
            })

            it("should create a user which is an advisor of a company (user2virtual)", async function() {
                let userEntityAddr = await createUser(account1Owner)
                let companyEntityAddr = await createVirtualEntity(account1Owner)

                // Add the connection between both, delete the connection and then add it again
                await connectionsInstance.addConnection(userEntityAddr, companyEntityAddr, advisorConnectionType, Direction.Forwards, {from: account1Owner})
                await connectionsInstance.addConnection(companyEntityAddr, userEntityAddr, advisorConnectionType, Direction.Forwards, {from: account1Owner})
                let connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                await connectionsInstance.removeConnection(userEntityAddr, companyEntityAddr, advisorConnectionType, {from:account1Owner})
                connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);
                oneConnectionNotActive(connections)

                await connectionsInstance.removeConnection(companyEntityAddr, userEntityAddr, advisorConnectionType, {from:account1Owner})
                connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);
                bothConnectionNotActive(connections)

                await connectionsInstance.addConnection(companyEntityAddr, userEntityAddr, advisorConnectionType, Direction.Forwards, {from: account1Owner})
                connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);
                oneConnectionNotActive(connections)

                await connectionsInstance.addConnection(userEntityAddr, companyEntityAddr, advisorConnectionType, Direction.Backwards, {from: account1Owner})
                connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);
                bothConnectionActive(connections)
                bothEntityActive(connections)
                areOppositeDirections(connections)

                // Delete Company entity
                try {
                    await
                    connectionsInstance.editEntity(companyEntityAddr, false, "", {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    assert.instanceOf(error, Error, 'Should not be able to delete an entity without being the owner')
                }
                await connectionsInstance.editEntity(companyEntityAddr, false, "", {from: account1Owner})
                connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);

                bothConnectionActive(connections)
                oneEntityActive(connections)

                await connectionsInstance.editEntity(companyEntityAddr, true, "", {from: account1Owner})
                connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);

                bothConnectionActive(connections)
                bothEntityActive(connections)

                await connectionsInstance.editEntity(userEntityAddr, false, "", {from: account1Owner})
                await connectionsInstance.editEntity(companyEntityAddr, false, "", {from: account1Owner})
                connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);

                neitherEntityActive(connections)

                await connectionsInstance.editEntity(userEntityAddr, true, "", {from: account1Owner})
                await connectionsInstance.editEntity(companyEntityAddr, true, "", {from: account1Owner})
                connections = await getConnections(userEntityAddr, companyEntityAddr, advisorConnectionType);

                bothConnectionActive(connections)
                bothEntityActive(connections)
            })

            it("creates a user entity that is transfered twice after having a connection made to it (user2user)", async function() {
                // Create two users and a connection between them
                let user1Entity = await createUser(account1Owner)
                let user2Entity = await createUser(account2)

                let user1EntityObject = await getEntity(user1Entity)
                assert(user1EntityObject.active, "User entity 1 should be active")
                assert.equal(user1EntityObject.owner, account1Owner, "User entity 1 should be owned by account 1")

                await connectionsInstance.addConnection(user1Entity, user2Entity, followerConnectionType, Direction.Forwards, {from: account1Owner})
                await connectionsInstance.addConnection(user2Entity, user1Entity, followerConnectionType, Direction.Forwards, {from: account2})
                let connections = await getConnections(user1Entity, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                try {
                    await createUser(account1Owner)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity again')
                }

                try {
                    await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer if it has not been pushed')
                }

                try {
                    await connectionsInstance.transferEntityOwnerPush(user1Entity, account3, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to transfer a user if not the owner')
                }

                // Transfer user1Entity to user 3 ownership
                await connectionsInstance.transferEntityOwnerPush(user1Entity, account3, {from: account1Owner})
                user1EntityObject = await getEntity(user1Entity)
                assert.equal(user1EntityObject.transferOwnerTo, account3, "User entity 1 should able to be pulled to ownership by account 3")

                try {
                    await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer I am not the recipient')
                }

                // Pull the ownership to account 3
                await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account3})
                user1EntityObject = await getEntity(user1Entity)
                assert.equal(user1EntityObject.owner, account3, "User entity 1 should be owned by account 3")

                connections = await getConnections(user1Entity, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                connections = await getConnections(account3, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                connections = await getConnections(account4, user2Entity, followerConnectionType);
                oneEntityActive(connections)

                try {
                    await createUser(account1Owner)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity again after have transfered entity')
                }

                try {
                    await createUser(account3)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity if I have had a user entity transferred to me')
                }

                try {
                    await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account4})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer if it has not been pushed')
                }

                try {
                    await connectionsInstance.transferEntityOwnerPush(user1Entity, account3, {from: account1Owner})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to transfer a user if not the owner')
                }

                // Transfer user1Entity to user 4 ownership
                await connectionsInstance.transferEntityOwnerPush(user1Entity, account4, {from: account3})
                user1EntityObject = await getEntity(user1Entity)
                assert.equal(user1EntityObject.transferOwnerTo, account4, "User entity 1 should able to be pulled to ownership by account 4")

                try {
                    await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account5})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer I am not the recipient')
                }

                // Pull the ownership to account 4
                await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account4})
                user1EntityObject = await getEntity(user1Entity)
                assert.equal(user1EntityObject.owner, account4, "User entity 1 should be owned by account 4")

                connections = await getConnections(user1Entity, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                connections = await getConnections(account3, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                connections = await getConnections(account4, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                connections = await getConnections(account5, user2Entity, followerConnectionType);
                oneEntityActive(connections)

                try {
                    await createUser(account1Owner)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity again after have transfered entity')
                }

                try {
                    await createUser(account3)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity if I have previously owned a user entity')
                }

                try {
                    await createUser(account4)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity if I have had a user entity transferred to me')
                }
            })

            it("creates a user entity and a virtual entity which is transferred twice (user2user, user2virtual)", async function() {
                // Create two users and a connection between them
                let user1Entity = await createUser(account1Owner)
                let user2Entity = await createUser(account2)

                let user1EntityObject = await getEntity(user1Entity)
                assert(user1EntityObject.active, "User entity 1 should be active")
                assert.equal(user1EntityObject.owner, account1Owner, "User entity 1 should be owned by account 1")

                await connectionsInstance.addConnection(user1Entity, user2Entity, followerConnectionType, Direction.Forwards, {from: account1Owner})
                await connectionsInstance.addConnection(user2Entity, user1Entity, followerConnectionType, Direction.Forwards, {from: account2})
                let connections = await getConnections(user1Entity, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                try {
                    await createUser(account1Owner)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity again')
                }

                try {
                    await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer if it has not been pushed')
                }

                try {
                    await connectionsInstance.transferEntityOwnerPush(user1Entity, account3, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to transfer a user if not the owner')
                }

                // Transfer user1Entity to user 3 ownership
                await connectionsInstance.transferEntityOwnerPush(user1Entity, account3, {from: account1Owner})
                user1EntityObject = await getEntity(user1Entity)
                assert.equal(user1EntityObject.transferOwnerTo, account3, "User entity 1 should able to be pulled to ownership by account 3")

                try {
                    await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer I am not the recipient')
                }

                // Pull the ownership to account 3
                await connectionsInstance.transferEntityOwnerPull(user1Entity, {from: account3})
                user1EntityObject = await getEntity(user1Entity)
                assert.equal(user1EntityObject.owner, account3, "User entity 1 should be owned by account 3")

                connections = await getConnections(user1Entity, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                connections = await getConnections(account3, user2Entity, followerConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                connections = await getConnections(account4, user2Entity, followerConnectionType);
                oneEntityActive(connections)

                try {
                    await createUser(account1Owner)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity again after have transfered entity')
                }

                try {
                    await createUser(account3)
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to create a user entity if I have had a user entity transferred to me')
                }

                // Create a virtual entity on account 1
                let virtualEntity1Addr = await createVirtualEntity(account1Owner)

                try {
                    await connectionsInstance.addConnection(user1Entity, virtualEntity1Addr, advisorConnectionType, Direction.Forwards, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to create connections without the right account')
                }

                try {
                    await connectionsInstance.addConnection(virtualEntity1Addr, user1Entity, advisorConnectionType, Direction.Backwards, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to create connections without the right account')
                }

                // Create connection between virtual entity and user 1 enitity
                await connectionsInstance.addConnection(user1Entity, virtualEntity1Addr, advisorConnectionType, Direction.Forwards, {from: account3})
                await connectionsInstance.addConnection(virtualEntity1Addr, user1Entity, advisorConnectionType, Direction.Backwards, {from: account1Owner})
                connections = await getConnections(user1Entity, virtualEntity1Addr, advisorConnectionType);
                bothConnectionActive(connections)
                areOppositeDirections(connections)

                // Check that can create another virtual entity as account 1
                let virtualEntity2Addr = await createVirtualEntity(account1Owner)
                let virtualEntity2AddrObject = getEntity(virtualEntity2Addr)
                assert(virtualEntity2AddrObject, "new virtual entity should be active")

                try {
                    await connectionsInstance.transferEntityOwnerPull(virtualEntity1Addr, {from: account4})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer if it has not been pushed')
                }

                try {
                    await connectionsInstance.transferEntityOwnerPush(virtualEntity1Addr, account4, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to transfer a user if not the owner')
                }

                // Transfer virtualEntityAddr to user 4 ownership
                await connectionsInstance.transferEntityOwnerPush(virtualEntity1Addr, account4, {from: account1Owner})
                virtualEntityAddrObject = await getEntity(virtualEntity1Addr)
                assert.equal(virtualEntityAddrObject.transferOwnerTo, account4, "Virtual entity should able to be pulled to ownership by account 4")

                try {
                    await connectionsInstance.transferEntityOwnerPull(virtualEntity1Addr, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer I am not the recipient')
                }

                // Pull the ownership to account 4
                await connectionsInstance.transferEntityOwnerPull(virtualEntity1Addr, {from: account4})
                virtualEntityAddrObject = await getEntity(virtualEntity1Addr)
                assert.equal(virtualEntityAddrObject.owner, account4, "Virtual entity should be owned by account 4")

                connections = await getConnections(user1Entity, virtualEntity1Addr, advisorConnectionType);
                bothConnectionActive(connections)
                areOppositeDirections(connections)

                connections = await getConnections(account3, virtualEntity1Addr, advisorConnectionType);
                bothConnectionActive(connections)
                areOppositeDirections(connections)

                // Create new connection with transfered user entity
                await connectionsInstance.addConnection(user1Entity, virtualEntity1Addr, partnersConnectionType, Direction.Backwards, {from: account3})
                await connectionsInstance.addConnection(virtualEntity1Addr, user1Entity, partnersConnectionType, Direction.Backwards, {from: account4})
                connections = await getConnections(user1Entity, virtualEntity1Addr, partnersConnectionType);
                bothConnectionActive(connections)
                areSameDirections(connections)

                // Edit both connections
                try {
                    await connectionsInstance.editConnection(user1Entity, virtualEntity1Addr, partnersConnectionType, Direction.Forwards, false, "", 0, {from: account1Owner})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to edit connection which I have transferred to new owner')
                }

                try {
                    await connectionsInstance.editConnection(virtualEntity1Addr, user1Entity, partnersConnectionType, Direction.Forwards, false, "", 0, {from: account1Owner})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to edit connection which I have transferred to new owner')
                }

                connectionsInstance.editConnection(user1Entity, virtualEntity1Addr, partnersConnectionType, Direction.Forwards, false, "", 0, {from: account3})
                connectionsInstance.editConnection(virtualEntity1Addr, user1Entity, partnersConnectionType, Direction.Forwards, false, "", 0, {from: account4})
                connections = await getConnections(user1Entity, virtualEntity1Addr, partnersConnectionType);
                bothConnectionNotActive(connections)
                areSameDirections(connections)
                assert.equal(connections.entity1.direction, Direction.Forwards, "Connection direction is not forwards")

            })

            it("creates two virtual entities which are deactivated, transferred and have a connection added (virtual2virtual)", async function() {
                try {
                    await connectionsInstance.addConnection(account1Owner, account2, partnersConnectionType, Direction.NotApplicable, {from:account1Owner});
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to add connection to entity that has not been created')
                }


                // Create two virtual entities and a connection between them
                let virtual1Entity = await createVirtualEntity(account1Owner)
                let virtual2Entity = await createVirtualEntity(account2)

                try {
                    await connectionsInstance.editEntity(virtual1Entity, false, "", {from:account3});
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to edit virtual entity if not the owner')
                }

                await connectionsInstance.editEntity(virtual1Entity, false, "", {from:account1Owner});
                await connectionsInstance.editEntity(virtual2Entity, false, "", {from:account2});

                // Add conection will work even on inactive entities
                await connectionsInstance.addConnection(virtual1Entity, virtual2Entity, partnersConnectionType, Direction.NotApplicable, {from:account1Owner});

                await connectionsInstance.editEntity(virtual1Entity, true, "", {from:account1Owner});
                await connectionsInstance.editEntity(virtual2Entity, true, "", {from:account2});

                let virtual1EntityObject = await getEntity(virtual1Entity)
                let virtual2EntityObject = await getEntity(virtual2Entity)
                assert(virtual1EntityObject.active, "Virtual entity 1 should be active")
                assert(virtual2EntityObject.active, "Virtual entity 2 should be active")

                try {
                    await connectionsInstance.addConnection(virtual1Entity, virtual2Entity, partnersConnectionType, Direction.NotApplicable, {from:account1Owner});
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_INVALID_OPCODE_ERR, 'Should not be able to add connection over an active connection')
                }

                let connections = await getConnections(virtual1Entity, virtual2Entity, partnersConnectionType)
                oneConnectionNotActive(connections)
                assert.equal(connections.entity1.direction, Direction.NotApplicable, "Direction of virtual entity 1 should be Not Applicable")

                await connectionsInstance.addConnection(virtual2Entity, virtual1Entity, partnersConnectionType, Direction.NotApplicable, {from:account2});

                connections = await getConnections(virtual1Entity, virtual2Entity, partnersConnectionType)
                bothConnectionActive(connections)
                assert.equal(connections.entity2.direction, Direction.NotApplicable, "Direction of virtual entity 1 should be Not Applicable")

                try {
                    await connectionsInstance.transferEntityOwnerPull(virtual1Entity, {from: account5})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer if it has not been pushed')
                }

                try {
                    await connectionsInstance.transferEntityOwnerPush(virtual1Entity, account2, {from: account5})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to transfer a virtual entity if not the owner')
                }

                // Transfer user1Entity to user 4 ownership
                await connectionsInstance.transferEntityOwnerPush(virtual1Entity, account2, {from: account1Owner})
                virtual1EntityObject = await getEntity(virtual1Entity)
                assert.equal(virtual1EntityObject.transferOwnerTo, account2, "Virtual entity 1 should able to be pulled to ownership by account 2")

                try {
                    await connectionsInstance.transferEntityOwnerPull(virtual1Entity, {from: account5})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should not be able to pull transfer I am not the recipient')
                }

                // Pull the ownership to account 2
                await connectionsInstance.transferEntityOwnerPull(virtual1Entity, {from: account2})
                virtual1EntityObject = await getEntity(virtual1Entity)
                assert.equal(virtual1EntityObject.owner, account2, "Virtual entity 1 should be owned by account 2")

                connections = await getConnections(virtual1Entity, virtual2Entity, partnersConnectionType)
                bothConnectionActive(connections)
                assert.equal(connections.entity2.direction, Direction.NotApplicable, "Direction of virtual entity 1 should be Not Applicable")

                await connectionsInstance.transferEntityOwnerPush(virtual2Entity, account3, {from: account2})
                await connectionsInstance.transferEntityOwnerPull(virtual2Entity, {from: account3})
                virtual2EntityObject = await getEntity(virtual2Entity)
                assert.equal(virtual2EntityObject.owner, account3, "Virtual entity 2 should be owned by account 3")

                await connectionsInstance.transferEntityOwnerPush(virtual2Entity, account1Owner, {from: account3})
                await connectionsInstance.transferEntityOwnerPull(virtual2Entity, {from: account1Owner})
                virtual2EntityObject = await getEntity(virtual2Entity)
                assert.equal(virtual2EntityObject.owner, account1Owner, "Virtual entity 2 should be owned by account 1")

                try {
                    await connectionsInstance.editConnection(virtual1Entity, virtual2Entity, partnersConnectionType, Direction.Forwards, false, "0x1234", 10, {from: account1Owner})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should edit connections of virtual entity 1 if I am not the entity owner')
                }

                await connectionsInstance.editConnection(virtual1Entity, virtual2Entity, partnersConnectionType, Direction.Forwards, false, "0x1234", 10, {from: account2})

                try {
                    await connectionsInstance.editConnection(virtual2Entity, virtual1Entity, partnersConnectionType, Direction.Backwards, false, "0xabcd", 20, {from: account2})
                    throw new Error("This should not execute")
                } catch (error) {
                    error.message.should.equal(EVM_REVERT_ERR, 'Should edit connections of virtual entity 2 if I am not the entity owner')
                }

                await connectionsInstance.editConnection(virtual2Entity, virtual1Entity, partnersConnectionType, Direction.Backwards, false, "0xabcd", 20, {from: account1Owner})

                connections = await getConnections(virtual1Entity, virtual2Entity, partnersConnectionType)
                connections.entity1.entityActive.should.equal(true, 'Virtual entity 1 should be active')
                connections.entity1.connectionEntityActive.should.equal(true, 'Virtual entity 2 should be active')
                connections.entity1.connectionActive.should.equal(false, 'Connection to virtual entity 2 should not be active')
                connections.entity1.data.should.equal("0x1234000000000000000000000000000000000000000000000000000000000000", 'Connection to virtual entity 2 should have some data')
                connections.entity1.direction.should.equal(Direction.Forwards, 'Connection to virtual entity 2 is forwards')
                connections.entity1.expiration.should.equal(10, 'Connection to virtual entity 2 has 10 expiration')

                connections.entity2.entityActive.should.equal(true, 'Virtual entity 2 should be active')
                connections.entity2.connectionEntityActive.should.equal(true, 'Virtual entity 1 should be active')
                connections.entity2.connectionActive.should.equal(false, 'Connection to virtual entity 1 should not be active')
                connections.entity2.data.should.equal("0xabcd000000000000000000000000000000000000000000000000000000000000", 'Connection to virtual entity 2 should have some data')
                connections.entity2.direction.should.equal(Direction.Backwards, 'Connection to virtual entity 1 is backwards')
                connections.entity2.expiration.should.equal(20, 'Connection to virtual entity 1 has 20 expiration')

            })
        })
    })


    describe ("1-N connections", function() {
        it("should create several users who each follow each other (user2user)", async function() {
            let account1EntityAddr = await createUser(account1Owner)
            let account2EntityAddr = await createUser(account2)
            let account3EntityAddr = await createUser(account3)
            let account4EntityAddr = await createUser(account4)
            let account5EntityAddr = await createUser(account5)

            // User1 is following User2, User3 and User5
            await connectionsInstance.addConnection(account1EntityAddr, account2EntityAddr, followerConnectionType, Direction.Forwards, {from: account1Owner})
            await connectionsInstance.addConnection(account1EntityAddr, account3EntityAddr, followerConnectionType, Direction.Forwards, {from: account1Owner})
            await connectionsInstance.addConnection(account1EntityAddr, account5EntityAddr, followerConnectionType, Direction.Forwards, {from: account1Owner})

            let connections12 = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);
            let connections13 = await getConnections(account1EntityAddr, account3EntityAddr, followerConnectionType);
            let connections15 = await getConnections(account1EntityAddr, account5EntityAddr, followerConnectionType);
            oneConnectionNotActive(connections12)
            oneConnectionNotActive(connections13)
            oneConnectionNotActive(connections15)

            // User2 and User5 follow User1
            await connectionsInstance.addConnection(account2EntityAddr, account1EntityAddr, followerConnectionType, Direction.Forwards, {from: account2})
            await connectionsInstance.addConnection(account5EntityAddr, account1EntityAddr, followerConnectionType, Direction.Forwards, {from: account5})

            connections12 = await getConnections(account1EntityAddr, account2EntityAddr, followerConnectionType);
            connections15 = await getConnections(account1EntityAddr, account5EntityAddr, followerConnectionType);

            bothConnectionActive(connections12)
            bothConnectionActive(connections15)

            areSameDirections(connections12)
            areSameDirections(connections15)

        })
    })

    describe ("N-N connections", function() {

    })





    // ############# Helper function ###################


    async function createUser(owner) {
        return await createEntity(owner, connectionsInstance.createUser)
    }

    async function createVirtualEntity(owner) {
        return await createEntity(owner, connectionsInstance.createVirtualEntity)
    }

    async function createEntity(owner, createEntityFunction) {
        let txReceipt = await createEntityFunction({from: owner})
        let log0 = txReceipt.logs[0]

        assert.equal(log0.event, 'entityAdded', 'the first event should be entityAdded')
        let entityAddress = log0.args.entity
        return entityAddress
    }


    async function getConnections(entityAddress1, entityAddress2, connectionType) {
        let entity1Connection = await getConnection(entityAddress1, entityAddress2, connectionType)
        let entity2Connection = await getConnection(entityAddress2, entityAddress1, connectionType)

        return {
            'entity1': entity1Connection,
            'entity2': entity2Connection,
        }

    }

    async function getConnection(entity, connectionTo, connectionType) {
        let connection = await connectionsInstance.getConnection(entity, connectionTo, connectionType)

        return {
            'entityActive': connection[0],
            'connectionEntityActive': connection[1],
            'connectionActive': connection[2],
            'data': connection[3],
            'direction': parseInt(connection[4].valueOf()),
            'expiration': parseInt(connection[5].valueOf()),
        }
    }

    async function getEntity(entityAddress) {
        let entity = await connectionsInstance.getEntity(entityAddress)

        return {
            'active': entity[0],
            'transferOwnerTo': entity[1],
            'data': entity[2],
            'owner': entity[3],
        }
    }

});


function bothEntityActive(connections) {
    assert(connections.entity1.entityActive, "1st entity is not active")
    assert(connections.entity2.entityActive, "2nd entity is not active")
}

function oneEntityActive(connections) {
    assert((connections.entity1.entityActive && !connections.entity2.entityActive) ||
           (!connections.entity1.entityActive && connections.entity2.entityActive), "Only one entity should be active")
}

function neitherEntityActive(connections) {
    assert(!connections.entity1.entityActive, "1st entity is active")
    assert(!connections.entity2.entityActive, "2nd entity is active")
}

function bothConnectionActive(connections) {
    assert(connections.entity1.connectionActive, "1st entity's connection is not active")
    assert(connections.entity2.connectionActive, "2nd entity's connection is not active")
}

function oneConnectionNotActive(connections) {
    assert((connections.entity1.connectionActive && !connections.entity2.connectionActive) ||
           (!connections.entity1.connectionActive && connections.entity2.connectionActive), "Only one connection should be active")
}

function bothConnectionNotActive(connections) {
    assert(!connections.entity1.connectionActive, "1st entity's connection is active")
    assert(!connections.entity2.connectionActive, "2nd entity's connection is active")
}

function areOppositeDirections(connections) {
    validDirection(connections.entity1.direction)
    validDirection(connections.entity2.direction)

    if(connections.entity1.direction === Direction.Forwards)
        assert.equal(connections.entity2.direction, Direction.Backwards, "Connection directions are not opposite")
    else if(connections.entity1.direction === Direction.Backwards)
        assert.equal(connections.entity2.direction, Direction.Forwards, "Connection directions are not opposite")
    else
        throw new Error("Connection directions are not valid")
}

function areSameDirections(connections) {
    validDirection(connections.entity1.direction)
    validDirection(connections.entity2.direction)

    assert.equal(connections.entity1.direction, connections.entity2.direction, "Connection directions are not the same")
}

function validDirection(direction) {
    if(direction === null || direction < 0 || direction >= Direction.length)
        throw new Error("Direction is not valid")
}

const BigNumber = require('bignumber.js');
const Connections = artifacts.require("Connections");
const should = require('should')

contract('Connections',async function (accounts) {
    let connectionsInstance;
    const accountOwner = accounts[0];
    const alternateAccount = accounts[1];
    const account2 = accounts[2];
    const account3 = accounts[3];
    const account4 = accounts[4];
    const account5 = accounts[5];

    const Direction = {
        'NotApplicable': 0,
        'Forwards': 1,
        'Backwards': 2,
        'Invalid': 3,
    }
    Direction.length = 4

    let advisorConnectionType
    let followerConnectionType
    let partnersConnectionType

    let firstTest = true;

    beforeEach(async () => {
        connectionsInstance = await Connections.new();

        if(firstTest) {
            advisorConnectionType = await connectionsInstance.sha256ofString("isAdvisorOf");
            followerConnectionType = await connectionsInstance.sha256ofString("isFollowerOf");
            partnersConnectionType = await connectionsInstance.sha256ofString("isCommercialPartnerOf")
            firstTest = false
        }
    });

    describe("Check permissions on smart contract calls", function () {

        // Check that the following fails for calls that require entity ownership:
        // 1. before entity was created
        // 2. if not user owner
        // 3. if not virtual owner
        // 4. if not the new user owner
        // 5. if not the new virtual owner

        describe("createUser()", function() {
            it("Should not be able to call createUser() after I have create a user", async function(){
                await connectionsInstance.createUser();
                try {
                    await connectionsInstance.createUser();
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to overwrite user entity successfully');
            });

            it("Should not be able to call createUser() after I have transferred my user to someone else", async function () {
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });
                try {
                    await connectionsInstance.createUser();
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to overwrite a user entity after it had been transferred to new owner');
            });

            it("Should not be able to call createUser() after I have created a user with createUserAndConnection()", async function(){
                await connectionsInstance.createUserAndConnection("0xAAAA", "OxBBB", '');
                try {
                    await connectionsInstance.createUser();
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to overwrite user entity successfully');
            });

        })

        describe("createUserAndConnection()", function() {

            it("Should not be able to call createUserAndConnection() after I already created a user with createUserAndConnection()", async function(){
                await connectionsInstance.createUserAndConnection("0xAAAA", "OxBBB", '');
                try {
                    await connectionsInstance.createUserAndConnection("0xBBBB", "OxCCCC", '');
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to overwrite user entity successfully');
            });

            it("Should not be able to call createUserAndConnection() even after I have transferred mine to someone else", async function () {
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });

                try {
                    await connectionsInstance.createUserAndConnection("0xAAAA", "OxBBB", '');
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to overwrite a user entity after it was transferred to a new owner');
            });


            it("Should not be able to call createUserAndConnection() after I have created a user", async function(){
                await connectionsInstance.createUser();
                try {
                    await connectionsInstance.createUserAndConnection("0xAAAA", "OxBBB", '');
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to overwrite user entity successfully');
            });

            it("Should not be able to call createUserAndConnection() after I have transferred my user to someone else", async function () {
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;

                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });

                try {
                    await connectionsInstance.createUserAndConnection("0xAAAA", "OxBBB", '');
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to overwrite a user entity after it was transferred to a new owner');
            });


        })

        describe("createVirtualEntity()", function() {
            // This function can always be called at any time
        })

        describe("createVirtualEntityAndConnection()", function() {
            // This function can always be called at any time
        })

        describe("editEntity()", function() {
            it("Should not be able to edit an entity that has not been created", async function () {
                try {
                    await connectionsInstance.editEntity(accountOwner, false, '');
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to edit an entity that has not ever been created');
            });

            it("Should not be able to edit user entity belonging to a different owner", async function () {
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                try {
                    await connectionsInstance.editEntity(entityAddress, false, '', { from: alternateAccount });
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to entity belonging to a different owner successfully');
            });


            it("Should not be able to to modify virtual entity belonging to a different owner", async function(){
                let result = await connectionsInstance.createVirtualEntity();
                let entityAddress = result.logs[0].args.entity;
                try {
                    await connectionsInstance.editEntity(entityAddress, false, '', { from: alternateAccount });
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to entity belonging to a different owner successfully');
            });

            it("Should not be able to modify virtual entity belonging to a original owner after it has been transferred", async function () {
                let result = await connectionsInstance.createVirtualEntity();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });

                try {
                    await connectionsInstance.editEntity(entityAddress, false, '');
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to entity belonging to a different owner successfully');
            });

            it("Should not be able to modify user entity belonging to a original owner after it has been transferred", async function () {
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });

                try {
                    await connectionsInstance.editEntity(entityAddress, false, '');
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to entity belonging to a different owner successfully');
            });
        })

        describe("transferEntityOwnerPush()", function() {
            it("Should not be able to transfer entitity that has not been created", async function(){
                try{
                    await connectionsInstance.transferEntityOwnerPush(accountOwner, alternateAccount, {from:alternateAccount});
                } catch(e){
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer an entity that has not been created');
            });

            it("Should not be able to transfer user entity belonging to a different user", async function(){
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                try{
                    await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount, {from:alternateAccount});
                } catch(e){
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer another users entity successfully');
            });

            it("Should not be able to transfer virtual entity belonging to a different user", async function(){
                let result = await connectionsInstance.createVirtualEntity();
                let entityAddress = result.logs[0].args.entity;
                try{
                    await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount, {from:alternateAccount});
                } catch(e){
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer another user\'s virtual entity successfully');
            });

            it("Should not be able to transfer user entity created createUserAndConnection() with belonging to a different user", async function(){
                let result = await connectionsInstance.createUserAndConnection(account2, partnersConnectionType, Direction.Backwards);
                let entityAddress = result.logs[0].args.entity;
                try{
                    await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount, {from:alternateAccount});
                } catch(e){
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer another users entity successfully');
            });

            it("Should not be able to transfer virtual entity created with createVirtualEntityAndConnection() belonging to a different user", async function(){
                let result = await connectionsInstance.createVirtualEntityAndConnection(account2, partnersConnectionType, Direction.Backwards);
                let entityAddress = result.logs[0].args.entity;
                try{
                    await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount, {from:alternateAccount});
                } catch(e){
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer another user\'s virtual entity successfully');
            });


            it("Should not be able to transfer entitity belonging to a different user after migration", async function () {
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });

                try {
                    await connectionsInstance.transferEntityOwnerPush(entityAddress, account3);
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer another users entity successfully');
            });

            it("Should not be able to transfer entitity belonging to a different user after migration", async function () {
                let result = await connectionsInstance.createVirtualEntity();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });

                try {
                    await connectionsInstance.transferEntityOwnerPush(entityAddress, account3);
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer another users virtual entity successfully');
            });
        })

        describe("transferEntityOwnerPull()", function() {
            it("Should not be able to pull an entity that has not been created", async function(){
                try {
                    await connectionsInstance.transferEntityOwnerPull(accountOwner, {from :account3});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer an entity that does not exist yet');
            });

            it("Should not be able to pull a user entity transferred for a different account", async function(){
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                try {
                    await connectionsInstance.transferEntityOwnerPull(entityAddress, {from :account3});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer another users entity successfully');
            });

            it("Should not be able to pull a virtual entity transferred for a different account", async function(){
                let result = await connectionsInstance.createVirtualEntity();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                try {
                    await connectionsInstance.transferEntityOwnerPull(entityAddress, {from :account3});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer virtual entity that I was not the recipient of');
            });

            it("Should not be able to pull a user entity created with createUserAndConnection() transferred for a different account", async function(){
                let result = await connectionsInstance.createUserAndConnection(account5, partnersConnectionType, Direction.Invalid);
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                try {
                    await connectionsInstance.transferEntityOwnerPull(entityAddress, {from :account3});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer another users entity successfully');
            });

            it("Should not be able to pull a virtual entity created with createVirtualConnection() transferred for a different account", async function(){
                let result = await connectionsInstance.createVirtualEntityAndConnection(account5, partnersConnectionType, Direction.Invalid);
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                try {
                    await connectionsInstance.transferEntityOwnerPull(entityAddress, {from :account3});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer virtual entity that I was not the recipient of');
            });

            it("Should not be able to pull a user entity transfer if I alraedy have a user entity created before transfer", async function(){
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.createUser({from:alternateAccount});
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                try {
                    await connectionsInstance.transferEntityOwnerPull(entityAddress, {from :alternateAccount});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer user entity to user who already has user entity');
            });

            it("Should not be able to pull a user entity transfer if I alraedy have a user entity created after transfer but before pull", async function(){
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.createUser({from:alternateAccount});
                try {
                    await connectionsInstance.transferEntityOwnerPull(entityAddress, {from :alternateAccount});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to transfer user entity to user who already has user entity');
            });

            it("Should be able to pull a user entity transfer if was previously the user entity owner", async function(){
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, {from :alternateAccount});

                await connectionsInstance.transferEntityOwnerPush(entityAddress, accountOwner, {from :alternateAccount});

                result = await connectionsInstance.transferEntityOwnerPull(entityAddress);

                result.logs[0].event.should.equal('entityOwnerChanged', 'entityOwnerChanged event was not emitted')
                let event = result.logs[0].args
                event.entity.should.equal(entityAddress, 'entity address was not correct')
                event.oldOwner.should.equal(alternateAccount, 'old owner was not correct')
                event.newOwner.should.equal(accountOwner, 'new owner was not correct')
            });

        })

        describe("addConnection()", function() {
            it("Should not be able to call addConnection() for an entity that has not been created", async function () {
                try {
                    await connectionsInstance.addConnection(accountOwner, alternateAccount, advisorConnectionType, Direction.Forwards);
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to create a connection on an entity that does not exist');
            });

            it("Should not be able to add a connection if it already exists", async function () {
                let result = await connectionsInstance.createUserAndConnection(alternateAccount, followerConnectionType, Direction.Backwards);
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.editConnection(entityAddress, alternateAccount, followerConnectionType, Direction.NotApplicable, false, "0x000", 0)

                await connectionsInstance.addConnection(entityAddress, alternateAccount, followerConnectionType, Direction.Forwards);
            });

            it("Should be able to overwrite a deactivated connection", async function () {
                let result = await connectionsInstance.createUserAndConnection(alternateAccount, followerConnectionType, Direction.Backwards);
                let entityAddress = result.logs[0].args.entity;
                try {
                    await connectionsInstance.addConnection(entityAddress, alternateAccount, followerConnectionType, Direction.Forwards);
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to override a connection sucessfully');
            });

            it("Should not be able to addConnection for an entity belonging to a different user", async function(){
                let result = await connectionsInstance.createVirtualEntity();
                let entityAddress = result.logs[0].args.entity;
                try {
                    await connectionsInstance.addConnection(entityAddress, account2, partnersConnectionType, '',{from:alternateAccount});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to addConnection for another users entity successfully');
            });

        })

        describe("editConnection()", function() {
            it("Should not be able to editConnection for an entity that does not exist",async function(){
                try {
                    await connectionsInstance.editConnection(accountOwner, account3, partnersConnectionType, Direction.Forwards, false, '0xabcd1234', 0);
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to editConnection for an entity that does not exist');
            });

            it("Should not be able to editConnection for an entity belonging to a different user",async function(){
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.addConnection(entityAddress, account3, partnersConnectionType, Direction.Forwards);
                try {
                    await connectionsInstance.editConnection(entityAddress, account3, partnersConnectionType, Direction.Forwards, false, '0xabcd1234', 0, {from: alternateAccount});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to editConnection for another users entity successfully');
            });

            it("Should not be able to editConnection for an entity belonging to a different user after migration", async function () {
                let result = await connectionsInstance.createUser();
                let entityAddress = result.logs[0].args.entity;
                await connectionsInstance.addConnection(entityAddress, account3, partnersConnectionType, Direction.Forwards);

                await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
                await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });

                try {
                    await connectionsInstance.editConnection(entityAddress, account3, partnersConnectionType, Direction.Forwards, false, '0x1234', 10, { from: accountOwner });
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to editConnection for another users entity successfully');
            });
        })

        describe("removeConnection()", function() {

        })

        describe("isUser()", function() {
            it("Should fail if not called on an entity", async function () {
                try {
                    await connectionsInstance.isUser(accountOwner);
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed read a user type that does not exist');
            });
        })

        describe("getEntity()", function() {

        })


        describe("getConnection()", function() {

        })

        describe("() fallback function", function() {
            it('should not be able to accept Ether to the fallback function', async function() {
                try {
                    await web3.eth.sendTransaction({to:connectionsInstance.address, from:accountOwner, value: 1});
                } catch (e) {
                    assert(wasEthereumTxError(e), 'Transaction did not fail, but another error occured')
                    return;
                }
                throw new Error('Managed to send Ether to the contract');
            })

        })


    });

    describe("Check that events are emmitted as expected", function () {
        it("should initialize virtualEntitiesCreated to 0", async function () {
            let virtualEntitiesCreated = await connectionsInstance.virtualEntitiesCreated.call()
            assert.equal(virtualEntitiesCreated.valueOf(), 0, "The number of virtual entities created was not initiialized to 0");
        });

        it("Should add user entity and emit the event : entityAdded", async function (){
            let result = await connectionsInstance.createUser();
            assert.equal(result.logs[0].event,'entityAdded');
            assert.equal(result.logs[0].args.owner, accountOwner);
        });

        it("Should add Virtual entity and emit the event : entityAdded", async function () {
            let result = await connectionsInstance.createVirtualEntity();
            assert.equal(result.logs[0].event, 'entityAdded');
            assert.equal(result.logs[0].args.owner, accountOwner);
            assert(result.logs[0].args.entity); //Non deterministic
        });

        it("Should modify entity and emit the event : entityModified", async function () {
            let result = await connectionsInstance.createUser();
            let entityAddress = result.logs[0].args.entity;
            let updateEntity = await connectionsInstance.editEntity(entityAddress,false,'');
            assert.equal(updateEntity.logs[0].event, 'entityModified');
            assert.equal(updateEntity.logs[0].args.owner, accountOwner);
            assert.equal(updateEntity.logs[0].args.active, false);
        });

        it("Should emit connectionAdded events for user and virtual entity", async function () {
            let userCreation = await connectionsInstance.createUser({from: accountOwner});
            let userEntityAddress = userCreation.logs[0].args.entity;
            let entityCreation = await connectionsInstance.createVirtualEntity({ from: alternateAccount });
            let companyEntityAddress = entityCreation.logs[0].args.entity;
            let advisor = await connectionsInstance.sha256ofString.call("isAdvisorOf");

            //User connecting to Company
            let addUserConnection = await connectionsInstance.addConnection(userEntityAddress,companyEntityAddress,advisor,'',{from:accountOwner});
            assert.equal(addUserConnection.logs[0].event,'connectionAdded');
            assert.equal(addUserConnection.logs[0].args.entity,userEntityAddress);
            assert.equal(addUserConnection.logs[0].args.connectionTo,companyEntityAddress);
            assert.equal(addUserConnection.logs[0].args.connectionType,advisor);

            //Company connecting to user
            let addCompanyConnection = await connectionsInstance.addConnection(companyEntityAddress, userEntityAddress, advisor,'',{from: alternateAccount})
            let companyLogs = addCompanyConnection.logs[0];
            assert.equal(companyLogs.event, 'connectionAdded');
            assert.equal(companyLogs.args.entity, companyEntityAddress);
            assert.equal(companyLogs.args.connectionTo, userEntityAddress);
            assert.equal(companyLogs.args.connectionType, advisor);
        });


        it("Should emit connectionModified events for user Entity", async function () {
            let userCreation = await connectionsInstance.createUser({ from: accountOwner });
            let userEntityAddress = userCreation.logs[0].args.entity;
            let entityCreation = await connectionsInstance.createVirtualEntity({ from: alternateAccount });
            let companyEntityAddress = entityCreation.logs[0].args.entity;
            let advisor = await connectionsInstance.sha256ofString.call("isAdvisorOf");

            //User connecting to Company
            let addUserConnection = await connectionsInstance.addConnection(userEntityAddress, companyEntityAddress, advisor, '', { from: accountOwner });
            let connectionModified = await connectionsInstance.editConnection(userEntityAddress, companyEntityAddress, advisor,1,'','','');
            let modifiedLogs = connectionModified.logs[0];
            assert.equal(modifiedLogs.event, 'connectionModified');
            let direction = new BigNumber(1);
            assert.equal(modifiedLogs.args.entity, userEntityAddress);
            assert.equal(modifiedLogs.args.connectionTo, companyEntityAddress);
            assert.equal(modifiedLogs.args.active, false);
            assert.equal(modifiedLogs.args.connectionType, advisor);
            assert.equal(direction.isEqualTo(modifiedLogs.args.direction), true);
        });

        it("Should emit connectionRemoved events for user Entity", async function () {
            let userCreation = await connectionsInstance.createUser({ from: accountOwner });
            let userEntityAddress = userCreation.logs[0].args.entity;
            let entityCreation = await connectionsInstance.createVirtualEntity({ from: alternateAccount });
            let companyEntityAddress = entityCreation.logs[0].args.entity;
            let advisor = await connectionsInstance.sha256ofString.call("isAdvisorOf");
            let addUserConnection = await connectionsInstance.addConnection(userEntityAddress, companyEntityAddress, advisor, '', { from: accountOwner });
            let connectionModified = await connectionsInstance.removeConnection(userEntityAddress, companyEntityAddress, advisor);
            let removedLogs = connectionModified.logs[0];
            assert.equal(removedLogs.event, 'connectionRemoved');
            assert.equal(removedLogs.args.entity, userEntityAddress);
            assert.equal(removedLogs.args.connectionTo, companyEntityAddress);
            assert.equal(removedLogs.args.connectionType, advisor);
        });

        it("Should emit transfer ownership for user entity", async function () {
            let result = await connectionsInstance.createUser();
            let entityAddress = result.logs[0].args.entity;
            let entityInOwnerOfUsr = await connectionsInstance.entityOfUser(accountOwner);
            assert.equal(entityInOwnerOfUsr, entityAddress);
            let pushOwner = await connectionsInstance.transferEntityOwnerPush(entityAddress,alternateAccount);
            let pullOwner = await connectionsInstance.transferEntityOwnerPull(entityAddress,{ from: alternateAccount });
            let entityInOwnerOfAlternateUsr = await connectionsInstance.entityOfUser(alternateAccount);
            assert.equal(entityInOwnerOfAlternateUsr, entityAddress);
            assert.equal(pullOwner.logs[0].event, "entityOwnerChanged");
            assert.equal(pullOwner.logs[0].args.newOwner, alternateAccount);
            assert.equal(pullOwner.logs[0].args.oldOwner, accountOwner);
            assert.equal(pullOwner.logs[0].args.entity, entityAddress);
        });

        it("Should emit transfer ownership for Virtual entity", async function () {
            let result = await connectionsInstance.createVirtualEntity();
            let entityAddress = result.logs[0].args.entity;
            let entityInOwnerOfUsr = await connectionsInstance.entityOfUser(accountOwner);
            assert.equal(entityInOwnerOfUsr, "0x0000000000000000000000000000000000000000");
            let pushOwner = await connectionsInstance.transferEntityOwnerPush(entityAddress, alternateAccount);
            let pullOwner = await connectionsInstance.transferEntityOwnerPull(entityAddress, { from: alternateAccount });
            let entityInOwnerOfAlternateUsr = await connectionsInstance.entityOfUser(alternateAccount);
            assert.equal(entityInOwnerOfAlternateUsr, "0x0000000000000000000000000000000000000000");
            assert.equal(pullOwner.logs[0].event, "entityOwnerChanged");
            assert.equal(pullOwner.logs[0].args.newOwner, alternateAccount);
            assert.equal(pullOwner.logs[0].args.oldOwner, accountOwner);
            assert.equal(pullOwner.logs[0].args.entity, entityAddress);
        });
    })

    describe('Simulate several real-world workflows', function() {
        it("Create a virtual and user entity connection and then transfer the user entity" , async function (){
            //1. Create 1 Virtual Entity , 2 User Entities
            //2. Connection virtual entity to user and vice versa
            //3. Migrate user entity
            //4. check connection status

            //1. Create 1 Virtual Entity , 2 User Entities
            let vEntityCreate = await connectionsInstance.createVirtualEntity();
            let vEntityAddr = vEntityCreate.logs[0].args.entity;
            let uEntity1Create  = await connectionsInstance.createUser({from: account2});
            let uEntity2Create  = await connectionsInstance.createUser({ from: account3});
            let uEntity1Addr = uEntity1Create.logs[0].args.entity;
            let uEntity2Addr = uEntity2Create.logs[0].args.entity;

            //2. Connection virtual entity to user and vice versa
            let advisor = await connectionsInstance.sha256ofString.call("isAdvisorOf");
            let addVEntityToUEntity1 = await connectionsInstance.addConnection(vEntityAddr, uEntity1Addr, advisor, '');
            let addVEntityToUEntity2 = await connectionsInstance.addConnection(vEntityAddr, uEntity2Addr, advisor, '');
            let addUEntity1ToVEntity = await connectionsInstance.addConnection(uEntity1Addr, vEntityAddr, advisor, '', { from: account2 });
            let addUEntity2ToVEntity = await connectionsInstance.addConnection(uEntity2Addr, vEntityAddr, advisor, '', { from: account3 });

            //Check connections
            let vEnToU1conn = await connectionsInstance.getConnection(vEntityAddr, uEntity1Addr, advisor);
            let vEnToU2conn = await connectionsInstance.getConnection(vEntityAddr, uEntity2Addr, advisor);
            let U1ToVenconn = await connectionsInstance.getConnection(uEntity1Addr, vEntityAddr, advisor);
            let U2ToVenconn = await connectionsInstance.getConnection(uEntity2Addr, vEntityAddr, advisor);
            validateConnectionActive(vEnToU1conn);
            validateConnectionActive(vEnToU2conn);
            validateConnectionActive(U1ToVenconn);
            validateConnectionActive(U2ToVenconn);

            //3. Migrate user entity
            let migrateU1Push = await connectionsInstance.transferEntityOwnerPush(uEntity1Addr,account4,{from:account2});
            let migrateU1Pull = await connectionsInstance.transferEntityOwnerPull(uEntity1Addr,{from: account4});

            //4. Check connections
            let vEnToU4conn = await connectionsInstance.getConnection(vEntityAddr, account4, advisor);
            let U4ToVenconn = await connectionsInstance.getConnection(account4, vEntityAddr, advisor);
            validateConnectionActive(vEnToU4conn);
            validateConnectionActive(U4ToVenconn);
        });


        it("Create a virual and user entity with a connection", async function () {
            //1. Create 1 Virtual Entity and a connection to user
            //2. Create 1 User entity and connection back to virtual entity
            //3. Check connections

            //1. Create 1 Virtual Entity and connection to user
            let advisor = await connectionsInstance.sha256ofString.call("isAdvisorOf");
            let vEntityCreate = await connectionsInstance.createVirtualEntityAndConnection(account2,advisor,'');
            let vEntityAddr = vEntityCreate.logs[0].args.entity;

            //2. Create 1 User entity and connection back to virtual entity
            let uEntity1Create = await connectionsInstance.createUserAndConnection(vEntityAddr, advisor, '', { from: account2 });
            let uEntity1Addr = uEntity1Create.logs[0].args.entity;

            //3. Check connections
            let vEnToU1conn = await connectionsInstance.getConnection(vEntityAddr, account2, advisor);
            let U1ToVenconn = await connectionsInstance.getConnection(account2, vEntityAddr, advisor);
            validateConnectionActive(vEnToU1conn);
            validateConnectionActive(U1ToVenconn);
        });



        it("Create two user entities with a connection and then transfer both entities", async function () {
            //1. Create 2 User entities
            //2. Connect to each other
            //3. Migrate both entities and check the connection is still valid.

            //1. Create 1 Virtual Entity and connection to user
            let userCreation1 = await connectionsInstance.createUser();
            let userCreation2 = await connectionsInstance.createUser({ from: alternateAccount });
            let collegueOf = await connectionsInstance.sha256ofString.call("isCollegueOf");

            //2. Create 1 User entity and connection back to virtual entity
            let u1ToU2Connection = await connectionsInstance.addConnection(accountOwner, alternateAccount, collegueOf,'');
            let u2ToU1Connection = await connectionsInstance.addConnection(alternateAccount, accountOwner, collegueOf, '',{from:alternateAccount});

            let vU1ToU2conn = await connectionsInstance.getConnection(accountOwner, alternateAccount, collegueOf);
            let vU2ToU1conn = await connectionsInstance.getConnection(alternateAccount, accountOwner, collegueOf);
            validateConnectionActive(vU1ToU2conn);
            validateConnectionActive(vU2ToU1conn);


            //3. Migrate entitues to different accounts
            let pushOwner1 = await connectionsInstance.transferEntityOwnerPush(accountOwner, account2);
            let pullOwner1 = await connectionsInstance.transferEntityOwnerPull(accountOwner, { from: account2 });

            let pushOwner2 = await connectionsInstance.transferEntityOwnerPush(alternateAccount, account3, { from: alternateAccount});
            let pullOwner2 = await connectionsInstance.transferEntityOwnerPull(alternateAccount, { from: account3 });

            //3. Check connections
            let vU3ToU2conn = await connectionsInstance.getConnection(account2, account3, collegueOf);
            let vU2ToU3conn = await connectionsInstance.getConnection(account3, account2, collegueOf);
            validateConnectionActive(vU3ToU2conn);
            validateConnectionActive(vU2ToU3conn);
        });
    })

});

//Helper
function validateConnectionActive(connectionObject){
    //(bool entityActive, bool connectionEntityActive, bool connectionActive, bytes32 data, Direction direction, uint expiration)
    assert.equal(connectionObject[0],true);
    assert.equal(connectionObject[1], true);
    assert.equal(connectionObject[2], true);
}

const EVM_INVALID_OPCODE_ERR = 'VM Exception while processing transaction: invalid opcode'
const EVM_REVERT_ERR = 'VM Exception while processing transaction: revert'

function wasEthereumTxError(error) {
    if (!error || !error.message) return false
    return (error.message === EVM_INVALID_OPCODE_ERR || error.message === EVM_REVERT_ERR)
}

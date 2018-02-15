pragma solidity ^0.4.18;

/// @title A solidity proxy contract for testing functions which should 'throw' errors
/// @author Rick Behl
contract ConnectionsProxy {
    address public target;
    bytes data;
    
    // Constructor which sets the real target contract for the function calls
    function ConnectionsProxy(address _target) public { target = _target; }

    /**
     * Prime the data using the fallback function
     */
    function() public { data = msg.data; }

    /**
     * Function used to call the real function with data
     */
    function execute() public returns (bool) { return target.call(data); }
}
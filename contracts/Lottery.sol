// SPDX-License-Identifier: MIT
 
pragma solidity 0.8.19;
 
contract Lottery {
    address public manager;
    address[] public players;

    constructor() {
        manager = msg.sender;
    }

    // Added receive function to accept ETH
    receive() external payable {
        enter();
    }

    function enter() public payable {
        require(msg.value > 0.01 ether, "Minimum entry fee is 0.01 ETH");
        players.push(msg.sender);
    }

    function random() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players)));
    }

    function pickWinner() public restricted {
        require(players.length > 0, "No players in lottery");
        uint256 index = random() % players.length;
        // Using call instead of transfer for safer ETH transfer
        (bool success, ) = players[index].call{value: address(this).balance}("");
        require(success, "Transfer failed");
        // Reset array more efficiently
        delete players;
    }

    modifier restricted() {
        require(msg.sender == manager, "Only manager can call this function");
        _;
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    // Added function to get contract balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
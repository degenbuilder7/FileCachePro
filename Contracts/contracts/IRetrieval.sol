// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;


interface IRetrieval {
    function getFileCid(string memory cid) external returns(string memory);
}
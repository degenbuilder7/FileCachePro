// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {SubnetActorDiamond} from "./ipc/SubnetActorDiamond.sol";

interface IRegisterSubnetFacet {
    function newSubnetActor(
        SubnetActorDiamond.ConstructorParams calldata _params
    ) external returns (address subnetAddr);
}

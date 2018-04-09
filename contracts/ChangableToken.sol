pragma solidity ^0.4.0;

// Интерфейс токена
interface ChangableToken {
    function stop();
    function start();
    function changeSymbol(string name);
    function changeName(string name);
    function balanceOf(address user) returns (uint256);
}

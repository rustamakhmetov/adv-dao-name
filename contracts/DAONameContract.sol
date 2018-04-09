pragma solidity ^0.4.11;

import "./ChangableToken.sol";
import "./DAOBaseContract.sol";

// Контракт ДАО
contract DAONameContract is DAOBaseContract {

    // Функция для смены имени токена
    function changeName() active public {

        // Проверяем, что было достаточное количество голосов
        require(election.numberOfVotes >= minVotes);

        // Логика для смены символа
        if (election.current > 0) {
            token.changeName(proposalName);
        }

        resetVoted();
    }
}
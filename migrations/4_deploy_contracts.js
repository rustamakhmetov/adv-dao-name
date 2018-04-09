var DAOSymbolContract = artifacts.require("DAOSymbolContract");
var DAOToken = artifacts.require("DAOToken");

module.exports = function(deployer) {
    deployer.deploy(DAOSymbolContract, DAOToken.address)
};
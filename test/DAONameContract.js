require('chai').use(require('chai-as-promised')).should();
const Reverter = require('./helpers/reverter');
const Asserts = require('./helpers/asserts');
const DAONameContract = artifacts.require('DAONameContract');

contract('ERC20TokenSimpleDAO', function(accounts) {
    const reverter = new Reverter(web3);
    afterEach('revert', reverter.revert);

    let simple_dao;
    let proposal_name = "new name";
    const ERROR_MSG = 'VM Exception while processing transaction: revert';

    before('setup', () => {
        return DAONameContract.deployed()
            .then(instance => simple_dao = instance)
            .then(reverter.snapshot);
    });

    it('buy tokens', async function() {
        for(let i=0; i<2; i++) {
            let account = web3.eth.accounts[i];

            let account_balance = (await simple_dao.balanceOf(account)).toNumber();
            assert.equal(account_balance, 0, 'account balance should be 0');

            let result = await simple_dao.buy({from: account, value: web3.toWei(0.01, "ether")});
            account_balance = (await simple_dao.balanceOf(account)).toNumber();
            assert.equal(account_balance, 1, 'account balance should be 1 token (with considering decimals)');
        }
    });

    it('new name', async function(){
        let voteActive = (await simple_dao.voteActive());
        let name = (await simple_dao.name());
        assert.isFalse(voteActive);
        assert.equal(name, "DAOToken");

        await simple_dao.newName(proposal_name);
        voteActive = (await simple_dao.voteActive());
        assert.isTrue(voteActive);
        name = (await simple_dao.name());
        assert.equal(name, "DAOToken");
    });

    it('vote', async function() {
        let account = web3.eth.accounts[0];

        await simple_dao.buy({from: account, value: web3.toWei(0.01, "ether")}); // 1 token
        await simple_dao.newName(proposal_name);
        // первое голосование
        await simple_dao.vote(true, {from: account});
        let election = (await simple_dao.election());
        assert.equal(election[0].toNumber(), 1); //current
        assert.equal(election[1].toNumber(), 1); //numberOfVotes
        // запрещено повторное голосование
        await simple_dao.vote(false, {from: account}).should.be.rejectedWith(ERROR_MSG); // ловим require
        election = (await simple_dao.election());
        assert.equal(election[0].toNumber(), 1); //current
        assert.equal(election[1].toNumber(), 1); //numberOfVotes
    });

    it('change name', async function() {
        let account1 = web3.eth.accounts[0];

        await simple_dao.buy({from: account1, value: web3.toWei(0.01, "ether")}); // 1 token
        await simple_dao.newName(proposal_name);
        // first vote
        await simple_dao.vote(true, {from: account1});
        let election = (await simple_dao.election());
        assert.equal(election[0].toNumber(), 1); //current
        assert.equal(election[1].toNumber(), 1); //numberOfVotes
        // недостаточно голосов
        await simple_dao.changeName().should.be.rejectedWith(ERROR_MSG); // ловим require

        // 2 голосование от другого аккаунта
        let account2 = web3.eth.accounts[1];
        await simple_dao.buy({from: account2, value: web3.toWei(0.05, "ether")}); // 5 token
        let account_balance = (await simple_dao.balanceOf(account2)).toNumber();
        assert.equal(account_balance, 5, 'account balance should be 5');

        await simple_dao.vote(true, {from: account2});
        // проверка на кол-во голосом
        election = (await simple_dao.election());
        assert.equal(election[0].toNumber(), 6); //current
        assert.equal(election[1].toNumber(), 6); //numberOfVotes
        // меняем имя
        await simple_dao.changeName();
        let name = (await simple_dao.name());
        assert.equal(name, proposal_name);

        // проверяем очистку DAO переменных
        let voteActive = (await simple_dao.voteActive());
        assert.isFalse(voteActive);
        election = (await simple_dao.election());
        assert.equal(election[0].toNumber(), 0); //current
        assert.equal(election[1].toNumber(), 0); //numberOfVotes
        let _proposalName = (await simple_dao.proposalName());
        assert.equal(_proposalName, "");
    });

});
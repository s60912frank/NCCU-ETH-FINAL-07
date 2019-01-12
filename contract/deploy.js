const fs = require('fs')
const Web3 = require('web3')

let web3 = new Web3('http://localhost:8545')

const abi = JSON.parse(fs.readFileSync('./abi.json'))
const bytecode = '0x' + fs.readFileSync('./bytecode').toString()

let ftrc_forum = new web3.eth.Contract(abi)

web3.eth.getAccounts().then(function (accounts) {

    // deploy contract
    // your code
    console.log("user: "+accounts[0]);
    
    // if (web3.personal.unlockAccount(accounts[0], 'user')) {
    //     console.log(`${accounts[0]} is unlocaked`);
    // }else{
    //     console.log(`unlock failed, ${accounts[0]}`);
    // }
    
    // let gasEstimate = web3.eth.estimateGas({data: bytecode});
    // console.log('gasEstimate = ' + gasEstimate);

    ftrc_forum.deploy({
        data: bytecode,
    })
    .send({
        from: accounts[0],
        gas: 4700000
        // gas: '4700000'
    })
    .on('error', function(error){ 
        console.log(error);
    })
    .on('transactionHash', function(transactionHash){
        // console.log("transactionHash: "+transactionHash);
    })
    .on('receipt', function(receipt){
       console.log('receipt');
       console.log(receipt);
    //    console.log("receipt.contractAddress");
    //    console.log(receipt.contractAddress); // contains the new contract address
    })
    .on('confirmation', function(confirmationNumber, receipt){
        console.log("confirmationNumber: "+confirmationNumber);
        // console.log("receipt:");
        // console.log(receipt);
    })
    .then(function(newContractInstance){
        console.log("Save newContractInstance.options.address: ");
        console.log(newContractInstance.options.address);
        fs.writeFileSync('address.txt',newContractInstance.options.address);
        
        console.log("Save newContractInstance.options.address in GlobalSetting ");
        fs.writeFileSync('../docs/GlobalSetting/address.txt',newContractInstance.options.address)
    });
})
const fs = require('fs')
const Web3 = require('web3')

let web3 = new Web3('http://localhost:8545')

const abi = JSON.parse(fs.readFileSync('./abi.json'))
const bytecode = '0x' + fs.readFileSync('./bytecode').toString()

let ftrc_forum = new web3.eth.Contract(abi)
ftrc_forum.options.address = fs.readFileSync('./address.txt').toString()

const theTime = 60;

const changeQuestionExpireTimeAfter = async(deployerAddress,time) => new Promise((resolve,reject)=>{
  ftrc_forum.methods.changeQuestionExpireTime(time).send({
    from: deployerAddress,
    gas: 3400000
  }).on('receipt', function (receipt) {
    console.log(receipt);
    resolve(receipt);
  })
  .on('error', function (error) {
    console.error(error);
    reject(error);
  })
});

const run = ()=>{
  web3.eth.getAccounts().then(async function (accounts) { 
    // console.log(accounts);
  
    const deployer = accounts[0];
    
    await changeQuestionExpireTimeAfter(deployer,theTime);
  });
}

run();

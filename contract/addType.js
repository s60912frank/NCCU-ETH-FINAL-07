const fs = require('fs')
const Web3 = require('web3')

let web3 = new Web3('http://localhost:8545')

const abi = JSON.parse(fs.readFileSync('./abi.json'))
const bytecode = '0x' + fs.readFileSync('./bytecode').toString()

let ftrc_forum = new web3.eth.Contract(abi)
ftrc_forum.options.address = fs.readFileSync('./address.txt').toString()


const questionType = ["Ethernum","Javascript","Swift"]


web3.eth.getAccounts().then(function (accounts) { 
  // console.log(accounts);

  const deployer = accounts[0];
  
  // console.log(deployer);
  // parrell,so the order is not the same as above;
  questionType.forEach(ele=>{
    ftrc_forum.methods.addQuestionType(ele).send({
      from: deployer,
      gas: 3400000
    }).on('receipt', function (receipt) {
      console.log(receipt);
    })
    .on('error', function (error) {
      console.error(error);
    })
    
  })
});






// login/logout section //
const getProvider = async () => {
  const our_server_url = "http://localhost:8545"
  try {
    if (typeof web3 !== 'undefined') {
      web3_Metamask = new Web3(web3.currentProvider);
      web3_localhost = new Web3(new Web3.providers.HttpProvider(our_server_url));

      return {
        "web3MetamaskProvider": web3_Metamask,
        "web3LocalhostProvider": web3_localhost
      }

    } else {
      console.log("no metamsk");
      alert("no metamsk");
      // no metamask
      web3_localhost = new Web3(new Web3.providers.HttpProvider(our_server_url));

      return {
        "web3MetamaskProvider": undefined,
        "web3LocalhostProvider": web3_localhost
      }

    }
  } catch (error) {
    console.error(error);
  }
}

const login = async () => {
  try {

    const {
      web3MetamaskProvider,
      web3LocalhostProvider
    } = await getProvider();
    
    if(web3MetamaskProvider){
      const accounts = await web3MetamaskProvider.eth.getAccounts()
      console.log(accounts);
      if(accounts.length < 1){
        throw new Error("Have metamask,No login");
      }
      const firstUser = accounts[0]

      // set person img and name
      var icon = blockies.create({
        seed: firstUser,
      });
      $('#login-panel img').attr('src',icon.toDataURL());
      $('#login-panel p').text(firstUser.slice(2,8));
      const metaMaskUserObject = {
          'account': firstUser,
          'img':icon.toDataURL()
      }
      localStorage.setItem('metaMaskUserObject', JSON.stringify(metaMaskUserObject));
      checkUser();
    }
    const localAccounts = await web3LocalhostProvider.eth.getAccounts()
    console.log(localAccounts);
    
    
  } catch (error) {
    console.error(error);
    alert("login error");
  }
}

const checkUser = ()=>{
    try {
      const metaMaskUserObject = JSON.parse(localStorage.getItem('metaMaskUserObject'));
      console.log(metaMaskUserObject.account);
      console.log("user login");
      $('.metaMaskUser img').each(function(){
        $(this).attr('src',metaMaskUserObject.img);
      })
      $('.metaMaskUser p').each(function(){
        $(this).text(metaMaskUserObject.account.slice(2,8));
      })
      $( "#afterlogin" ).toggle("d-none");
      $( "#beforelogin" ).toggle("d-none");
      // $( "#beforelogin" ).toggle("d-none");
    } catch (error) {
      console.log("no user");
    }
}


$('#beforelogin button').click(async function(){
  // login button
  await login();
})
$('#afterlogin button').click(function(){
  // logout button
  localStorage.removeItem('metaMaskUserObject')
  $( "#afterlogin" ).toggle("d-none");
  $( "#beforelogin" ).toggle("d-none");
  console.log("remove");
})


// .... section //


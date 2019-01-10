//global variable
let  web3MetamaskProvider,web3LocalhostProvider;
const our_server_url = "http://localhost:8545";

// login/logout section //
const getProvider = async () => {
  try {
    if (typeof web3 !== 'undefined') {
      web3_Metamask = new Web3(web3.currentProvider);
      web3_localhost = new Web3(new Web3.providers.HttpProvider(our_server_url));

      web3MetamaskProvider  = web3_Metamask;
      web3LocalhostProvider = web3_localhost;

    } else {
      console.log("no metamsk");
      alert("no metamsk");
      // no metamask
      web3_localhost = new Web3(new Web3.providers.HttpProvider(our_server_url));

      web3LocalhostProvider = web3_localhost;
    }
  } catch (error) {
    console.error(error);
  }
}

const login = async () => {
  try {
    await getProvider();
    let metaMaskUserObject,localAccounts;

    try {
      const accounts = await web3MetamaskProvider.eth.getAccounts()
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
      metaMaskUserObject = {
          'account': firstUser,
          'img':icon.toDataURL()
      }
      localStorage.setItem('metaMaskUserObject', JSON.stringify(metaMaskUserObject));
      checkUser();

      console.log("localStorage:metaMaskUserObject");
      console.log(metaMaskUserObject);
      
    } catch (error) {
      console.error(error);
      alert("metamask problem");
    }

    try {
      localAccounts = await web3LocalhostProvider.eth.getAccounts()
      console.log("local server:"+our_server_url);
      
      console.log(localAccounts);

    } catch (error) {
      console.error(error);
      alert("server error");
    }

    
    
  } catch (error) {
    console.error(error);
    alert("login error");
  }
}

const logout = ()=>{
  // remove user storage
  localStorage.removeItem('metaMaskUserObject')
  // remove web3 Provider
  web3MetamaskProvider = undefined;
  web3LocalhostProvider = undefined;
  // remove user object
  $('.person-panel-box img').each(function(){
    $(this).attr('src','');
  })
  $('.person-panel-box p').each(function(){
    $(this).text('name');
  })
  // toggle login/logout button
  $( "#afterlogin" ).toggle("d-none");
  $( "#beforelogin" ).toggle("d-none");
}

const checkUser = async ()=>{
    try {
      await getProvider();
      const metaMaskUserObject = JSON.parse(localStorage.getItem('metaMaskUserObject'));
      console.log(metaMaskUserObject.account);
      console.log("user login");
      $('.person-panel-box img').each(function(){
        $(this).attr('src',metaMaskUserObject.img);
      })
      $('.person-panel-box p').each(function(){
        $(this).text(metaMaskUserObject.account.slice(2,8));
      })
      $( "#afterlogin" ).toggle("d-none");
      $( "#beforelogin" ).toggle("d-none");
    } catch (error) {
      // localstorage no metaMaskUserObject
      logout()
      console.log("no user");
    }
}

const bindLoginButton = ()=>{
  $('#beforelogin button').click(async function(){
    // login button
    await login();
  });

  $('#afterlogin button').click(function(){
    // logout button
    logout()
    console.log("log out");
  })
}


// .... section //


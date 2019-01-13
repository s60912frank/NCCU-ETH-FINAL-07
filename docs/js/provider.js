//global variable
let  web3MetamaskProvider;
// util section //
const getProvider = async () => {
  try {
    if (typeof web3 !== 'undefined') {
      web3_Metamask = new Web3(web3.currentProvider);
      console.log("metamask connect");
      web3MetamaskProvider  = web3_Metamask;
    }else{
      console.log("no metamsk");
    }
  } catch (error) {
    console.error(error);
  }
}
const checkUser = async ()=>{
  try {
    await getProvider();
    const metaMaskUserObject = JSON.parse(localStorage.getItem('metaMaskUserObject'));
    console.log("check user");
    if(metaMaskUserObject.account){
      $('.person-panel-box img').each(function(){
        $(this).attr('src',metaMaskUserObject.img);
      })
      $('.person-panel-box p').each(function(){
        $(this).text(metaMaskUserObject.account.slice(2,8));
      })
      loginButtleToggle()
    }
  } catch (error) {
    // localstorage no metaMaskUserObject
    clear()
    console.log("no user");
  }
}
const getFtrcContract = async()=>{
  const contractAddress = 
  await fetch("./GlobalSetting/address.txt")
    .then(res => res.text());
  const abi = await fetch("./GlobalSetting/abi.json").then(res=>res.json());

  let ftrc_forum = new web3MetamaskProvider.eth.Contract(abi);
  ftrc_forum.options.address = contractAddress;
  return ftrc_forum
}
const getMappingQuestion = (question)=>{
  // 依序回傳問題的: 發問者、獎勵、類別、標題、接受的回答id、收到多少斗內、發問時間、回應數量
  const mappingQuestion = {
    "qsID": question.id,
    "asker": question[0],
    "reward": question[1],
    "qsType": question[2],
    "qsTitle": question[3],
    "acceptAnswer": question[4],
    "donate": question[5],
    "time": question[6],
    "replyNumber": question[7]
  }
  return mappingQuestion;
}
const getMappingComment = (comment)=>{
  // 依序回傳回答(回應)的: 回答者、所屬問題id、所屬回答id、內容、收到多少斗內、留言時間
  const mappingComment = {
    "cmID": comment.id,
    "answerUserID": comment[0],
    "questionID": comment[1],
    "belongCommentID": comment[2],
    "content": comment[3],
    "donate": comment[4],
    "time": comment[5]
  }
  return mappingComment;
}

// login/logout section //
const login = async () => {
  try {
    await getProvider();
    let metaMaskUserObject;
    const accountNumber = 0;
    try {
      // const accounts = await web3MetamaskProvider.eth.getAccounts()
      const accounts = await web3MetamaskProvider.eth.getAccounts()
      if(accounts.length < 1){
        throw new Error("Have metamask,No login");
      }
      const firstUser = accounts[accountNumber]
  
      // set person img and name
      var icon = blockies.create({
        seed: firstUser,
      });
      $('#login-panel img').attr('src',icon.toDataURL());
      $('#login-panel p').text(firstUser.slice(2,8));
      metaMaskUserObject = {
          'account': firstUser,
          'img':icon.toDataURL(),
      }
      localStorage.setItem('metaMaskUserObject', JSON.stringify(metaMaskUserObject));
      checkUser();
      console.log("Metamask get user account[0]");
      console.log(metaMaskUserObject);
      
    } catch (error) {
      console.error(error);
      alert("metamask problem");
    }
    
  } catch (error) {
    console.error(error);
    alert("login error");
  }
}

const clear = ()=>{
  // remove user storage
  localStorage.removeItem('metaMaskUserObject')
  $('.person-panel-box img').each(function(){
    $(this).attr('src','');
  })
  $('.person-panel-box p').each(function(){
    $(this).text('name');
  })
}

const loginButtleToggle = ()=>{
  $( "#afterlogin" ).toggle("d-none");
  $( "#beforelogin" ).toggle("d-none");
}

const bindLoginButton = ()=>{
  $('#beforelogin button').click(async function(){
    // login button
    await login();
  });

  $('#afterlogin button').click(function(){
    // logout button
    clear();
    loginButtleToggle();
    console.log("log out");
  })
}


// index section //
const getAllQuestion = async()=>{
  const ftrc_forum = await getFtrcContract();
  let allQuestionCount = await ftrc_forum.methods.getTotalQuestionLength().call()
  const N = allQuestionCount; 
  let queryQSArray = Array.apply(null, {length: N}).map(Number.call, Number)
  
  const qsArray = await Promise.all(queryQSArray.map(async (questionID) => {
    let result = await ftrc_forum.methods.getQuestionById(questionID).call();
    result.id = questionID;
    return result
  }));

  const allMappingResult = qsArray.map((question) => {
    return getMappingQuestion(question);
  });
   // 依序回傳問題的: 發問者、獎勵、類別、標題、接受的回答id、收到多少斗內、發問時間、回應數量
  return allMappingResult;
}

const filterProblemList = async(filterString) => {
  const qsResultArray = await getAllQuestion();
  console.log(qsResultArray);
  const qsQuestionTypes = await getAllQuestionTypes()

  $('#questionMainPage').html(`<ul id="questionMainUl" class="questions list-group"></ul>`);
  
  qsResultArray.map(ele=>{
    const {qsID,asker,reward,qsType,qsTitle,acceptAnswer,donate,time,replyNumber} = ele;
    const askerAddress = asker.slice(2,8);
    const postDay = new Date(parseInt(time,10)*1000);
    const showDay = postDay.getFullYear()+"-"+(postDay.getMonth()+1)+"-"+postDay.getDate();
    const finneyAmount = Web3.utils.fromWei(reward,'finney');
    const qsTypeString = qsQuestionTypes[qsType]
    const qsHtmlLi = 
      `
      <li class="question list-group-item">
        <div class="row">
          <div class="functions col d-flex flex-row justify-content-between">
            <a href="./singleQuestion.html?q=${qsID}" class="btn text-light bg-danger mx-1 d-flex flex-column">
              <span>${finneyAmount}</span>
              <span>Finney</span>
            </a>
            <a href="./singleQuestion.html?q=${qsID}" class="btn text-viridian-green btn-outline-viridian-green mx-1 d-flex flex-column">
              <span>${replyNumber}</span>
              <span>回答</span>
            </a>
          </div>
          <div class="col-9 questionLink">
            <a href="./singleQuestion.html?q=${qsID}">
              <h5>${qsTitle}</h5>
            </a>
            <div class="row d-flex justify-content-between">
              <div class="col-6">
                <p class="badge badge-light">${askerAddress}</p>
                <p class="badge badge-light">${qsTypeString}</p>
              </div>
              <div class="col-6 text-right font-weight-light text-secondary font-italic"><small>${showDay}</small></div>
            </div>
          </div>
        </div>
      </li>
        `;
        
    if (qsTypeString == filterString) return qsHtmlLi;
  }).forEach(ele=>{
    $('#questionMainUl').append(ele);
  })
}

const setProblemList = async() =>{

  const qsResultArray = await getAllQuestion();
  console.log(qsResultArray);
  const qsQuestionTypes = await getAllQuestionTypes()

  $('#questionMainPage').html(`<ul id="questionMainUl" class="questions list-group"></ul>`);
  
  qsResultArray.map(ele=>{
    const {qsID,asker,reward,qsType,qsTitle,acceptAnswer,donate,time,replyNumber} = ele;
    const askerAddress = asker.slice(2,8);
    const postDay = new Date(parseInt(time,10)*1000);
    const showDay = postDay.getFullYear()+"-"+(postDay.getMonth()+1)+"-"+postDay.getDate();
    const finneyAmount = Web3.utils.fromWei(reward,'finney');
    const qsTypeString = qsQuestionTypes[qsType]
    const qsHtmlLi = 
      `
      <li class="question list-group-item">
        <div class="row">
          <div class="functions col d-flex flex-row justify-content-between">
            <a href="./singleQuestion.html?q=${qsID}" class="btn text-light bg-danger mx-1 d-flex flex-column">
              <span>${finneyAmount}</span>
              <span>Finney</span>
            </a>
            <a href="./singleQuestion.html?q=${qsID}" class="btn text-viridian-green btn-outline-viridian-green mx-1 d-flex flex-column">
              <span>${replyNumber}</span>
              <span>回答</span>
            </a>
          </div>
          <div class="col-9 questionLink">
            <a href="./singleQuestion.html?q=${qsID}">
              <h5>${qsTitle}</h5>
            </a>
            <div class="row d-flex justify-content-between">
              <div class="col-6">
                <p class="badge badge-light">${askerAddress}</p>
                <p class="badge badge-light">${qsTypeString}</p>
              </div>
              <div class="col-6 text-right font-weight-light text-secondary font-italic"><small>${showDay}</small></div>
            </div>
          </div>
        </div>
      </li>
        `;
    return qsHtmlLi;
  }).forEach(ele=>{
    $('#questionMainUl').append(ele);
  })
}


// postQuestion section //
const getAllQuestionTypes = async()=>{
  // getAllQuestionTypes
  const ftrc_forum = await getFtrcContract();
  const result = await ftrc_forum.methods.getAllQuestionTypes().call();
  const resultArray = result.split(",");
  console.log(resultArray);
  return resultArray;
}

const postQuestion = async(userAddress,qsType,qsTitle,qsContent,qsAmount)=>{
  const ftrc_forum = await getFtrcContract();
  const newContractInstance = await ftrc_forum.methods.askQuestion(qsType,qsTitle,qsContent).send({
    from: userAddress,
    gas: 3400000,
    value: Web3.utils.toWei(qsAmount,'finney')
  });
  console.log(newContractInstance);
  return newContractInstance;
}

// single Question section //

function getQueryString (){
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++)
  {
      var pair = vars[i].split("=");
      // If first entry with this name
      if (typeof query_string[pair[0]] === "undefined")
      {
          query_string[pair[0]] = pair[1];
          // If second entry with this name
      } else if (typeof query_string[pair[0]] === "string")
      {
          var arr = [query_string[pair[0]], pair[1]];
          query_string[pair[0]] = arr;
          // If third or later entry with this name
      } else
      {
          query_string[pair[0]].push(pair[1]);
      }
  }
  return query_string;
}

const getQuesionContent = async(_questionID)=>{
  // getAllQuestionTypes
  const ftrc_forum = await getFtrcContract();
  let allQuestionCount = await ftrc_forum.methods.getTotalQuestionLength().call()
  const N = allQuestionCount; 
  if(_questionID > N){
    throw new Error("page number error")
  }
  let result = await ftrc_forum.methods.getQuestionById(_questionID).call();
  result.id = _questionID;
  return result
}

const getQuestionDetailById = async(_questionID)=>{
  // getAllQuestionTypes
  const ftrc_forum = await getFtrcContract();
  let result = await ftrc_forum.methods.getQuestionDetailById(_questionID).call();
  return result;
}

const getCommentById = async(_commentID)=>{
  const ftrc_forum = await getFtrcContract();
  let result = await ftrc_forum.methods.getCommentById(_commentID).call();
  // console.log(result);
  return result;
}

const getQuestionAndAllAnswerFrom = async(_questionID)=>{
  let question = await getQuesionContent(_questionID);
  const questionDetail = await getQuestionDetailById(_questionID);
  question.id = _questionID;
  let mappingQuestion = getMappingQuestion(question)
  mappingQuestion.qsContent = questionDetail[0];


  let commentIDArray = questionDetail[1].slice().map(ele=>parseInt(ele,10));
  const commentObjectArray = await Promise.all(commentIDArray.map(async(commentID) => {
    let result = await getCommentById(commentID);
    result.id = commentID;
    return getMappingComment(result);
  }));

  
  return {
    question:mappingQuestion,
    commentArray:commentObjectArray
  };
}


const setQuestionOnSingleQuestionHtml = (question)=>{

  const postDay = new Date(parseInt(question.time,10)*1000);
  const showDay = postDay.getFullYear()+"-"+(postDay.getMonth()+1)+"-"+postDay.getDate();
  const questionData = {
    qsTitle:question.qsTitle,
    qsAsker:question.asker.slice(2,8),
    qsDay: "張貼於:"+showDay,
    qsContent:question.qsContent,
    qsAskerPicText:question.asker
  }
  for (let [key, value] of Object.entries(questionData)) {
      $('#'+key).text(value);
      if(key === "qsAskerPicText"){
        // qsAskerPic
        let icon = blockies.create({
          seed: value,
        });
        $('#qsAskerPic').attr('src',icon.toDataURL());
      }
  }
  
} 

const setAnswerOnSingleQuestionHtml = (commentArray)=>{
  console.log(commentArray);
  
  $('#commentList').html('');
  commentArray.filter(ele=>{
    return ele.belongCommentID === "4294967295"
  })
  .forEach(ele=>{
    const iconUrl = blockies.create({seed: ele.answerUserID,}).toDataURL();
    const userName = ele.answerUserID.slice(2,8);
    const answerHtml = `
      <div class="media mb-4">
        <img class="d-flex mr-3 rounded-circle" src="${iconUrl}">
        <div class="media-body">
          <h5 class="mt-0">${userName}</h5>
          <p>${ele.content}</p>
        </div>
      </div>
    `
    $('#commentList').append(answerHtml)
  });

}

const setQuestionAndAnswerList = async(questionID)=>{
  try {
    const {question,commentArray} = await getQuestionAndAllAnswerFrom(questionID)

    setQuestionOnSingleQuestionHtml(question);
    setAnswerOnSingleQuestionHtml(commentArray);
    
  } catch (error) {
    console.error(error);
    // window.location = '/singleQuestion.html?q=0';
  }
}

const addAnswer= async(userAddress,questionId,content)=>{

  const ftrc_forum = await getFtrcContract();
  console.log({userAddress,questionId,content});
  
  
  const newContractInstance = await ftrc_forum.methods.addAnswer(questionId,content).send({
    from: userAddress,
    gas: 3400000,
  });
  
  console.log(newContractInstance);
  return newContractInstance;
}



// ... section //

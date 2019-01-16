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
const checkUser = async (isToggle=true)=>{
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
      if(isToggle){
        loginButtleToggle()
      }
    }
    return true;
  } catch (error) {
    // localstorage no metaMaskUserObject
    clear()
    console.log("no user");
    return false;
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
  // 依序回傳問題的: 發問者、獎勵、類別、標題、是否已經被回答了、收到多少斗內、發問時間、回應數量
  const mappingQuestion = {
    "qsID": question.id,
    "asker": question[0],
    "reward": question[1],
    "qsType": question[2],
    "qsTitle": question[3],
    "hasBestAnswer": question[4],
    "donate": question[5],
    "time": question[6],
    "untilTime": question[7],
    "replyNumber": question[8]
  }
  return mappingQuestion;
}
const getMappingQuestionDetail = (questionDetail)=>{
  // 這裡回傳問題的內容，回應的list，是否已被解答，以及最佳解答id
  const mappingQuestionDetail = {
    "qsContent": questionDetail[0],
    "commentList": questionDetail[1].map(ele=>parseInt(ele,10)),
    "hasBestAnswer": questionDetail[2],
    "bestAnswer": questionDetail[3],
  }
  return mappingQuestionDetail;
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
      location.reload();

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
    location.reload();
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
                <p class="badge badge-light">${qsTypeString}</p>
              </div>
              <div class="col-6 text-right font-weight-light text-secondary font-italic"><small class="badge badge-light">${qsTypeString}</small><small>${showDay}</small></div>
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
                <p class="badge badge-light">${qsTypeString}</p>
              </div>
              <div class="col-6 text-right font-weight-light text-secondary font-italic"><small class="badge badge-light">${qsTypeString}</small><small>${showDay}</small></div>
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
  try {
    const ftrc_forum = await getFtrcContract();
    console.log(ftrc_forum);
    const result = await ftrc_forum.methods.getAllQuestionTypes().call();
    console.log(result);
    if(result !== undefined){
      const resultArray = result.split(",");
      console.log(resultArray);
      return resultArray;
    }else{
      throw new Error("type array unformated")
    }
  } catch (error) {
    console.log(error);
  }
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
  question.id = _questionID;
  const mappingQuestionShort = getMappingQuestion(question)
  console.log(mappingQuestionShort);
  

  const questionDetail = await getQuestionDetailById(_questionID);
  const mappingQuestionDetail = getMappingQuestionDetail(questionDetail);
  console.log(mappingQuestionDetail);
  
  const mappingQuestion =  {"id":_questionID,...mappingQuestionShort,...mappingQuestionDetail}

  let commentIDArray = mappingQuestion.commentList.slice().map(ele=>parseInt(ele,10));
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
  console.log(question); 
  const postDay = new Date(parseInt(question.time,10)*1000);
  const showDay = postDay.getFullYear()+"-"+(postDay.getMonth()+1)+"-"+postDay.getDate();
  const questionData = {
    qsTitle:question.qsTitle,
    qsAsker:question.asker.slice(2,8),
    qsDay: "張貼於:"+showDay,
    qsContent:question.qsContent,
    qsAskerPicText:question.asker,
    donateDisplay:"收到金額: "+ changeDonateToBetterShow(question.donate),
    qsReward: "獎賞: "+ Web3.utils.fromWei(question.reward,"finney") +" Finney"
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
  if(question.hasBestAnswer){
    $('#badgeForBest').html('<span class="badge badge-success">已選出最佳解答</span>')
  }else{
    $('#badgeForBest').html('<span class="badge badge-light">尚未選出最佳解答</span>')
  }
  
} 

const setAnswerQuestionOnSingleQuestionHtml = (question,userAddress)=>{
  const {hasBestAnswer,asker,untilTime} = question
  
  const nowTimestamp = +new Date();
  const questionIsOutDate = nowTimestamp > untilTime*1000;
  
  if(asker === userAddress){
    $('.sqPostAnswer').first().css("display","none");
  }else{
    if(questionIsOutDate){
      $('.sqPostAnswer').first().css("display","none");
    }else{
      if(hasBestAnswer){
        $('.sqPostAnswer').first().css("display","none");
      }else{
        $('#answerSubmit').click(async function () {
          if(userAddress){
            try {
              await addAnswer(userAddress,questionID, $('#Answer').val());
              alert("發布留言成功");
              location.reload();
            } catch (error) {
              console.error(error);
              alert("發布留言失敗");
            }  
          }else{
            alert("發布留言失敗");
          }
        });
      }
    }
  }
}

const setAnswerOnSingleQuestionHtml = (commentArray,question,userAddress)=>{
  const {untilTime} = question
  console.log(question);
  

  const buttonClass="donateCommentToAnswer"
  const unitM = ['ether','finney','szabo','shannon','mwei','kwei','wei'];

  const nowTimestamp = +new Date();
  const questionIsOutDate = nowTimestamp > untilTime*1000;

  //未選解答
  //判斷是不是發問者，且沒有選解答
  let showCheckBox = false;
  if(question.asker === userAddress && !question.hasBestAnswer && !questionIsOutDate){
    showCheckBox = true;
  }else{
    showCheckBox = false;
  }

  // add Comment List 
  $('#commentList').html('');
  commentArray.filter(ele=>{
    //篩調非回答的
    return ele.belongCommentID === "4294967295"
  })
  .forEach((ele,index)=>{
    const iconUrl = blockies.create({seed: ele.answerUserID,}).toDataURL();
    const userName = ele.answerUserID.slice(2,8);
    const content = ele.content;
    const answerListID = ele.answerUserID+"-"+ele.cmID+"-"+ele.questionID;

    const donateDisplay = changeDonateToBetterShow(ele.donate)
    
    let checkBox = "";
    if(showCheckBox){
      checkBox = `<input type="checkbox" class="checkBestAnswer" data-answer="${answerListID}"></input>`;
    }
    const answerHtml = `
      <div class="media mb-4">
          ${checkBox}
          <img class="d-flex mr-3 rounded-circle" src="${iconUrl}" alt="">
          <div class="media-body">
            <h5 class="mt-0">${userName}</h5>
            <p>${content}</p>
            
            <p><span class="badge badge-primary">收到金額:</span>&nbsp&nbsp${donateDisplay}</p>
          </div>
          <div class="d-flex commentDonateList">
            <div class="input-group mb-3">
              <input type="number" min="1" required value="1" data-answer="${answerListID}">
              <select data-answer="${answerListID}">
                <option value="0">Ether</option>
                <option value="1">Finney</option>
                <option value="2">Szabo</option>
                <option value="3">Shannon</option>
                <option value="4">MWei</option>
                <option value="5">KWei</option>
                <option value="6">Wei</option>
              </select>
              <div class="input-group-prepend">
                <button class="btn btn-outline-secondary ${buttonClass}" type="button" data-answer="${answerListID}"><img alt="Tweet" src="images/like.png"/></button>
              </div>
            </div>
          </div>
        </div>
    `
    $('#commentList').append(answerHtml)
  });

  // set donate button function and will need user id
  if(questionIsOutDate && !question.hasBestAnswer){
    $('.commentDonateList .input-group').each(function(){
      $(this).css('display','none');
    })
  }else{
    $('.'+buttonClass).each(function(index){
    
      $(this).on("click",async function(){
        try {
          var dataAnswerKey = $(this).data('answer');
          
          const input = $('.input-group input[data-answer=' + dataAnswerKey + ']');
          let inputVal = '1';
          
          if(input.val()===''){
            alert('沒有輸入數字');
            return;
          }else if(input.val()<=0){
            alert('數字最小為1');
            return;
          }else{
            inputVal = input.val();
          }
  
          const select = $('.input-group select[data-answer=' + dataAnswerKey + ']');
          const selectID = select.children("option:selected").val();
          console.log(inputVal);
          console.log(unitM[selectID]);
          const commentID = dataAnswerKey.split('-')[1];
          console.log(commentID);
  
          if(userAddress){
            await donateAnswer(userAddress,commentID,inputVal,unitM[selectID]);
            alert("按讚成功");
            location.reload();
          }else{
            alert("donate button will not work until logining and render");
            alert("按讚失敗");
            return 
          }
        } catch (error) {
          console.log(error);
          alert("按讚失敗");
        }
      })
    })
  }



  if(showCheckBox){
    $('input.checkBestAnswer').on('change', function() {
        $('input.checkBestAnswer').not(this).prop('checked', false);  
    });

    // 添加選解答按鈕
  
    // !question.hasBestAnswer && question.asker === userAddress
    $('#commentList').append('<button id="chooseTheBestAnswer" class="btn btn-outline-secondary" type="button" >選為最佳解答</button>')

    $('#chooseTheBestAnswer').click(async function(){
      try {
        const dataString = $("input.checkBestAnswer:checked").first().data('answer')
        const chooseCommentID = dataString.split('-')[1];
        const questionID = dataString.split('-')[2];
        // .data("answer")
        if(checkUser(isToggle=false)){
          const metaMaskUserObject = JSON.parse(localStorage.getItem('metaMaskUserObject'));
          const userAddress = metaMaskUserObject.account;
          const ftrc_forum = await getFtrcContract();
          const newContractInstance = await ftrc_forum.methods.acceptAnswer(questionID,chooseCommentID).send({
            from: userAddress,
            gas: 3400000
          });
          console.log(newContractInstance);
          alert("已選擇最佳答案");
        }else{
          // it shouldn't
          console.log("no user");
        }
      } catch (error) {
        console.log("chooseTheBestAnswerError");
        console.log(error);
        alert("無法選擇最佳答案")
      }
    })
  }

  //過期了
  if(questionIsOutDate){
    if(!question.hasBestAnswer){
      if(commentArray.length > 0){
        //幫忙發獎金XDDD
        $('#commentList').append('<button id="checkExpired" class="btn btn-outline-warning" type="button" >幫忙選解答分錢囉</button>')
      }else{
        // alert("過期沒人回答")
        //返回金額
        $('#commentList').append('<button id="checkExpired" class="btn btn-outline-warning" type="button" >幫QQ，沒人回答，退問問題的人$$</button>')
      }

      $('#checkExpired').click(async function(){
        try {
          const ftrc_forum = await getFtrcContract();
          const newContractInstance = await ftrc_forum.methods.checkExpire(question.id).send({
            from: userAddress,
            gas: 3400000
          });
          console.log(newContractInstance);
          alert("觸發成功");
          location.reload();
        } catch (error) {
          console.error(error);
          alert("觸發失敗");
        }
      })


    }
  }


  
}

const setQuestionAndAnswerList = async(questionID)=>{
  try {
    const {question,commentArray} = await getQuestionAndAllAnswerFrom(questionID)
    let userAddress;
    try {
      const metaMaskUserObject = JSON.parse(localStorage.getItem('metaMaskUserObject'));
      userAddress = metaMaskUserObject.account;
      console.log(userAddress);
    } catch (error) {
      console.error(error);
      console.log("no user id");
    }

    setQuestionOnSingleQuestionHtml(question);

    setAnswerQuestionOnSingleQuestionHtml(question,userAddress);

    setAnswerOnSingleQuestionHtml(commentArray,question,userAddress);
    
  } catch (error) {
    console.error(error);
    window.location = '/singleQuestion.html?q=0';
  }
}

// answer section //
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

const donateAnswer = async(userAddress,commentID,amount,amountUnit)=>{
  console.log("donating");
  const ftrc_forum = await getFtrcContract();
  const newContractInstance = await ftrc_forum.methods.donateComment(commentID).send({
    from: userAddress,
    gas: 3400000,
    value: Web3.utils.toWei(amount,amountUnit)
  });
  console.log(newContractInstance);
  return newContractInstance;
}

const changeDonateToBetterShow = (donateString)=>{
  try {
    const unitM = ['ether','finney','szabo','shannon','mwei','kwei','wei'];
    let fitString = "";
    unitM.map(ele=>{
      //轉換成特定單位
      let donateUnitString = Web3.utils.fromWei(donateString,ele);
      //只要整數部分
      donateUnitString = donateUnitString.split(".")[0];
      //大數轉換
      let a = new Web3.utils.BN(donateUnitString,10)
      let b = new Web3.utils.BN('1000',10)
       //只取千位三數
      let Remainder = a.mod(b).toString()
      // console.log(Remainder);
      // console.log(ele);
      return `${Remainder} ${ele} `;
    }).forEach(ele=>fitString+=ele);
    return fitString;
  } catch (error) {
    console.log(error);
    return
  }

  
}

// ... section //

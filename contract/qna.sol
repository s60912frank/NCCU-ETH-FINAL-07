pragma solidity ^0.5.0;

contract QnA {
    /*
        Local vars
    */
    address private owner;
    mapping (address => User) public members;
    Question[] public questions;
    Comment[] public comments;
    QuestionType[] public questionstypes;
    uint32 donate_ratio;
    uint32 constant uint32Max = 4294967295;
    uint constant question_expire_after = 30; // 2592000 = 一個月
    
    /*
        Structs
    */
    struct User {
        uint received_val;
        uint32[] ownQuestion;
        uint32[] ownComment;
    }
    
    struct QuestionType {
        string name;
        uint32[] questions;
    }

    struct Question {
        address payable owner;
        uint value;
        uint32 qTypeId;
        string title;
        string content;
        uint32[] comments;
        // 如果acceptedAnswer == uint32最大值 表示這個問題還沒被回答
        bool isAnswered;
        uint32 acceptedAnswer;
        uint received_val;
        uint time;
    }

    struct Comment {
        address payable owner;
        // 紀錄所屬問題
        uint32 questionId;
        // 階層式留言，目前設定這個值是uint32最大值的話為回答，其他為留言，只有回答能被接受
        uint32 parentId;
        string content;
        uint received_val;
        uint time;
    }
    
    /*
        Events
    */
    event questionAsked(address user, uint32 qId);
    event answerAdded(address user, uint32 qId, uint32 cId);
    event commentAdded(address user, uint32 qId, uint32 pcId, uint32 cId);
    event questionAnswered(uint32 qId, uint32 cId, uint reward);
    event commentDonated(uint32 cId, address donator, uint value);
    event questionDonated(uint32 qId, address donator, uint value);
    
    /*
        Modifiers
    */
    modifier onlyOwner() {
        require(owner == msg.sender); // 要求是owner
        _;
    }

    // 建構子
    constructor() public payable {
        donate_ratio = 10;
        owner = msg.sender;
    }
    
    /*
        Private Functions
    */
    
    function transferAndRecordForComment(uint value, uint32 cId) private {
        address payable addr = comments[cId].owner;
        addr.transfer(value);
        comments[cId].received_val += value;
        members[addr].received_val += value;
    }
    
    function transferAndRecordForQuestion(uint value, uint32 qId) private {
        address payable addr = questions[qId].owner;
        addr.transfer(value);
        questions[qId].received_val += value;
        members[addr].received_val += value;
    }
    
    function commentFactory(uint32 qId, string memory content, uint32 pcId) private returns (uint32) {
        // 製造新的comment並且加進comment array
        Comment memory newCom;
        newCom.owner = msg.sender;
        newCom.questionId = qId;
        newCom.parentId = pcId;
        newCom.content = content;
        newCom.received_val = 0;
        newCom.time = now;
        uint32 cId = uint32(comments.length);
        comments.push(newCom);
        return cId;
    }
    
    /*
        Public Functions
    */
    
    function changeDonateRatio(uint32 ratio) public onlyOwner {
        donate_ratio = ratio;
    }
    
    function addQuestionType(string memory name) public onlyOwner {
        QuestionType memory qt;
        qt.name = name;
        questionstypes.push(qt);
    }
    
    function checkExpire(uint32 questionId) public {
        Question storage q = questions[questionId];
        if(q.isAnswered // 已經被回答了
            || now < q.time + question_expire_after) // 問題還沒過期
            revert();
        if(q.comments.length == 0) {
            // 沒人回QQ 退錢給發問者
            q.owner.transfer(q.value);
            // 紀錄這個問題已經回答了
            q.acceptedAnswer = uint32Max;
            q.isAnswered = true;
        } else {
            uint bestAnswerVal = 0;
            uint32[] memory candidateAnswerIds = new uint32[](q.comments.length);
            uint cciIndex = 0; // 上面那個array的index啦
            for(uint i = 0;i < q.comments.length;i++) {
                uint32 cId = q.comments[i];
                Comment memory c = comments[cId];
                if(c.parentId == uint32Max) {
                    if(c.received_val > bestAnswerVal) {
                        // 清掉temp array
                        candidateAnswerIds = new uint32[](q.comments.length);
                        cciIndex = 1;
                        candidateAnswerIds[0] = cId;
                        bestAnswerVal = c.received_val;
                    } else if(c.received_val == bestAnswerVal) {
                        // 放入temp array
                        candidateAnswerIds[cciIndex] = cId;
                        cciIndex ++;
                    }
                }
            } // 這個for執行完後array應該會有所有最高獎金的留言id
            // cciIndex會等於所有最多讚回答的數量
            uint valPerBestAns = q.value / cciIndex;
            for(uint i = 0;i < cciIndex;i++) {
                transferAndRecordForComment(valPerBestAns, candidateAnswerIds[i]);
            }
            // 紀錄這個問題已經回答了
            q.isAnswered = true;
            if(cciIndex == 1) {
                q.acceptedAnswer = candidateAnswerIds[0];
            } else {
                q.acceptedAnswer = uint32Max;
            }
        }
    }
    
    function askQuestion(uint32 questionTypeId, string memory title, string memory content) public payable {
        if(msg.value == 0 // 沒給獎勵
            || questionTypeId > questionstypes.length) // 問題類型不存在
            revert();
        // new a question
        Question memory newQ;
        newQ.owner = msg.sender;
        newQ.value = msg.value;
        newQ.title = title;
        newQ.content = content;
        newQ.qTypeId = questionTypeId;
        // newQ.acceptedAnswer = uint32Max;
        newQ.time = now;
        // recored BEFORE append question(qId start from 0)
        uint32 qId = uint32(questions.length);
        questions.push(newQ);
        // push question to accoring type
        questionstypes[questionTypeId].questions.push(qId);
        // Add connection between user and question
        members[msg.sender].ownQuestion.push(qId);
        // Emit event
        emit questionAsked(msg.sender, qId);
    }
    
    function addAnswer(uint32 questionId, string memory content) public {
        if(questionId > questions.length // 問題不存在
            || now > questions[questionId].time + question_expire_after) // 問題已經過期不能答了
            revert();
        // new a Comment
        uint32 cId = commentFactory(questionId, content, uint32Max);
        // Add connection between user and comment, comment and question
        questions[questionId].comments.push(cId);
        members[msg.sender].ownComment.push(cId);
        // Emit event
        emit answerAdded(msg.sender, questionId, cId);
    }
    
    function addComment(uint32 questionId, uint32 parentCommentId, string memory content) public {
        if(questionId > questions.length // 問題不存在
            || parentCommentId > comments.length) // 回應的回答不存在
            revert();
        // new a Comment
        uint32 cId = commentFactory(questionId, content, parentCommentId);
        // Add connection between user and comment, comment and question
        questions[questionId].comments.push(cId);
        members[msg.sender].ownComment.push(cId);
        // Emit event
        emit commentAdded(msg.sender, questionId, parentCommentId, cId);
    }
    
    function acceptAnswer(uint32 questionId, uint32 commentId) public {
        Question storage Q = questions[questionId];
        Comment memory A = comments[commentId];
        if(Q.isAnswered // 已經解答的不能再選
            || Q.owner != msg.sender // 提問者才能選
            || now > Q.time + question_expire_after // 問題已經過期
            || questionId > questions.length // 問題id不存在
            || commentId > comments.length // 回答id不存在
            || A.parentId != uint32Max // 不能選回應
            || A.questionId != questionId) // 回答id跟問題id不合
            revert();
        // Give accepted answer question value
        uint rewardToAnswer = Q.value * 80 / 100; // 80%給答題 20%返還給提問者
        uint valueToQMaker = Q.value - rewardToAnswer;
        Q.owner.transfer(valueToQMaker);
        transferAndRecordForComment(rewardToAnswer, commentId);
        // Mark this question as answered
        Q.isAnswered = true;
        Q.acceptedAnswer = commentId;
        // Emit event
        emit questionAnswered(questionId, commentId, rewardToAnswer);
    }
    
    function donateComment(uint32 commentId) public payable {
        if(msg.value == 0 // 不能捐0元啦
            || commentId > comments.length) // 找不到comment
            revert();
        // 計算該給發問者跟回答者的斗內
        uint toQuestionMaker = msg.value / donate_ratio;
        // 因為沒有浮點數所以用減的 因為上面除起來可能是0 donate以comment優先~
        uint toCommentMaker = msg.value - toQuestionMaker;
        
        // 分別轉帳給發問者跟回答者
        // 紀錄收到多少斗內
        transferAndRecordForComment(toCommentMaker, commentId);
        uint32 qId = comments[commentId].questionId;
        transferAndRecordForQuestion(toQuestionMaker, qId);
        
        // Emit event
        emit commentDonated(commentId, msg.sender, toCommentMaker);
        emit questionDonated(qId, msg.sender, toQuestionMaker);
    }
    
    function donateQuestion(uint32 questionId) public payable {
        if(msg.value == 0 // 不能捐0元啦
            || questionId < questions.length) // 找不到問題
            revert();
        transferAndRecordForQuestion(msg.value, questionId);
        // Emit event
        emit questionDonated(questionId, msg.sender, msg.value);
    }
    
    /*
        Getters
    */
    function getAllQuestionIdByAddr(address addr) public view returns (uint32[] memory) {
        return members[addr].ownQuestion;
    }
    
    function getAllCommentIdByAddr(address addr) public view returns (uint32[] memory) {
        return members[addr].ownComment;
    }
    
    function getQuestionById(uint32 id) public view returns (address, uint, uint32, string memory, bool, uint, uint, uint) {
        require(id < questions.length); // 找不到問題
        Question memory q = questions[id];
        // 依序回傳問題的: 發問者、獎勵、類別、標題、是否已經被回答了、收到多少斗內、發問時間、回應數量
        return (q.owner, q.value, q.qTypeId, q.title, q.isAnswered, q.received_val, q.time, q.comments.length);
    }
    
    function getQuestionDetailById(uint32 id) public view returns (string memory, uint32[] memory, bool, uint32) {
        // 這裡回傳問題的內容，回應的list，是否已被解答，以及最佳解答id
        require(id < questions.length);  // 找不到問題
        Question memory q = questions[id];
        return (q.content, q.comments, q.isAnswered, q.acceptedAnswer);
    }
    
    function getCommentById(uint32 id) public view returns (address, uint32, uint32, string memory, uint, uint) {
        require(id < comments.length); // 找不到回應
        Comment memory c = comments[id];
        // 依序回傳回答(回應)的: 回答者、所屬問題id、所屬回答id、內容、收到多少斗內、留言時間
        return (c.owner, c.questionId, c.parentId, c.content, c.received_val, c.time);
    }
    
    function getAllQuestionTypes() public view returns (string memory) {
        if(questionstypes.length == 0) return "";
        string memory s = questionstypes[0].name;
        for(uint i = 1;i < questionstypes.length;i++) {
            s = string(abi.encodePacked(s, ",", questionstypes[i].name));
        }
        return s;
    }
    
    function getAllQuestionsByTypeId(uint32 id) public view returns (uint32[] memory) {
        return questionstypes[id].questions;
    }
    
    function getTotalQuestionLength() public view returns(uint256) {
        return questions.length;
    }
}
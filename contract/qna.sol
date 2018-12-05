pragma solidity ^0.5.0;

contract QnA {
    address private owner;
    mapping (address => User) public members;
    Question[] public questions;
    Comment[] public comments;

    event registered(address user, string nickname);
    event questionAsked(address user, uint qId);
    event commentAdded(address user, uint qId, uint cId);
    event questionAnswered(uint qId, uint cId, uint reward);
    event commentDonated(uint cId, address donator, uint value);

    struct User {
        bool isRegistered;
        string nickname;
        uint[] ownQuestion;
        uint[] ownComment;
        // More attributes?
    }

    struct Question {
        address payable owner;
        uint value;
        string title;
        // TODO: 改成ipfs/swarm hash
        string content;
        uint[] comments;
        bool isAnswered;
        uint acceptedAnswer;
        // TODO: 目前不能捐錢給提問者
    }

    struct Comment {
        address payable owner;
        // TODO: 改成ipfs/swarm hash
        string content;
        uint received_val;
        // TODO: 目前留言=回答 要分開嗎? 階層式留言?(紀錄parentid)
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "you are not owner");
        _;
    }
    
    modifier onlyMember() {
        require(members[msg.sender].isRegistered, "Please register first");
        _;
    }

    // 建構子
    constructor() public payable {
        owner = msg.sender;
    }
    
    function register(string memory name) public {
        require(!members[msg.sender].isRegistered, "You have registered!");
        members[msg.sender].nickname = name;
        members[msg.sender].isRegistered = true;
        emit registered(msg.sender, name);
    }
    
    function askQuestion(string memory title, string memory content) public payable onlyMember {
        require(msg.value > 0, "You need to give reward!");
        // new a question
        Question memory newQ;
        newQ.owner = msg.sender;
        newQ.value = msg.value;
        newQ.title = title;
        newQ.content = content;
        // recored BEFORE append question(qId start from 0)
        uint qId = questions.length;
        questions.push(newQ);
        // Add connection between user and question
        members[msg.sender].ownQuestion.push(qId);
        // Emit event
        emit questionAsked(msg.sender, qId);
    }
    
    function addComment(uint questionId, string memory content) public onlyMember {
        require(questionId < questions.length, "Question not found!");
        // new a Comment
        Comment memory newCom;
        newCom.owner = msg.sender;
        newCom.content = content;
        newCom.received_val = 0;
        uint cId = comments.length;
        comments.push(newCom);
        // Add connection between user and comment, comment and question
        questions[questionId].comments.push(cId);
        members[msg.sender].ownComment.push(cId);
        // Emit event
        emit commentAdded(msg.sender, questionId, cId);
    }
    
    function acceptAnswer(uint questionId, uint commentId) public onlyMember {
        require(!questions[questionId].isAnswered, "This question already answered.");
        require(questions[questionId].owner == msg.sender, "You cannot accept answer!");
        require(questionId < questions.length, "Question not found!");
        require(commentId < comments.length, "Comment not found!");
        // Give accepted answer question value
        uint reward = questions[questionId].value;
        comments[commentId].owner.transfer(reward);
        // Mark this question as answered
        questions[questionId].isAnswered = true;
        questions[questionId].acceptedAnswer = commentId;
        // Emit event
        emit questionAnswered(questionId, commentId, reward);
    }
    
    function donateComment(uint commentId) public payable {
        comments[commentId].owner.transfer(msg.value);
        comments[commentId].received_val += msg.value;
        // Emit event
        emit commentDonated(commentId, msg.sender, msg.value);
        // TODO: 分給發問者
    }
    
    // getters
    function getAllQuestionIdByAddr(address addr) public view returns (uint[] memory) {
        require(members[addr].isRegistered, "User not found");
        return members[addr].ownQuestion;
    }
    
    function getAllCommentIdByAddr(address addr) public view returns (uint[] memory) {
        require(members[addr].isRegistered, "User not found");
        return members[addr].ownComment;
    }
}
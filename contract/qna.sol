pragma solidity ^0.5.0;

contract QnA {
    address private owner;
    mapping (address => User) public members;
    Question[] public questions;
    Comment[] public comments;
    uint32 donate_ratio;
    
    // events
    event registered(address user, string nickname);
    event questionAsked(address user, uint32 qId);
    event answerAdded(address user, uint32 qId, uint32 cId);
    event commentAdded(address user, uint32 qId, uint32 pcId, uint32 cId);
    event questionAnswered(uint32 qId, uint32 cId, uint reward);
    event commentDonated(uint32 cId, address donator, uint value);
    event questionDonated(uint32 qId, address donator, uint value);

    struct User {
        bool isRegistered;
        string nickname;
        uint32[] ownQuestion;
        uint32[] ownComment;
        // More attributes?
    }

    struct Question {
        address payable owner;
        uint value;
        string title;
        // TODO: 改成ipfs/swarm hash
        string content;
        uint32[] comments;
        bool isAnswered;
        uint32 acceptedAnswer;
        uint received_val;
    }

    struct Comment {
        address payable owner;
        // 紀錄所屬問題
        uint32 questionId;
        // 階層式留言，目前設定這個值是uint32最大值的話為回答，其他為留言，只有回答能被接受
        uint32 parentId;
        // TODO: 改成ipfs/swarm hash
        string content;
        uint received_val;
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
        donate_ratio = 10;
        owner = msg.sender;
    }
    
    function changeDonateRatio(uint32 ratio) public onlyOwner {
        donate_ratio = ratio;
    }
    
    function uint32Max() private pure returns (uint32) {
        uint32 i = 0;
        return i - 1;
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
        uint32 qId = uint32(questions.length);
        questions.push(newQ);
        // Add connection between user and question
        members[msg.sender].ownQuestion.push(qId);
        // Emit event
        emit questionAsked(msg.sender, qId);
    }
    
    function commentFactory(uint32 qId, string memory content, uint32 pcId) private returns (uint32) {
        // 製造新的comment並且加進comment array
        Comment memory newCom;
        newCom.owner = msg.sender;
        newCom.questionId = qId;
        newCom.parentId = pcId;
        newCom.content = content;
        newCom.received_val = 0;
        uint32 cId = uint32(comments.length);
        comments.push(newCom);
        return cId;
    }
    
    function addAnswer(uint32 questionId, string memory content) public onlyMember {
        require(questionId < questions.length, "Question not found!");
        // new a Comment
        uint32 cId = commentFactory(questionId, content, uint32Max());
        // Add connection between user and comment, comment and question
        questions[questionId].comments.push(cId);
        members[msg.sender].ownComment.push(cId);
        // Emit event
        emit answerAdded(msg.sender, questionId, cId);
    }
    
    function addComment(uint32 questionId, uint32 parentCommentId, string memory content) public onlyMember {
        require(questionId < questions.length, "Question not found!");
        require(parentCommentId < comments.length, "Parent comment not found!");
        require(parentCommentId != uint32Max(), "This is not an answer!");
        // new a Comment
        uint32 cId = commentFactory(questionId, content, parentCommentId);
        // Add connection between user and comment, comment and question
        questions[questionId].comments.push(cId);
        members[msg.sender].ownComment.push(cId);
        // Emit event
        emit commentAdded(msg.sender, questionId, parentCommentId, cId);
    }
    
    function acceptAnswer(uint32 questionId, uint32 commentId) public onlyMember {
        require(!questions[questionId].isAnswered, "This question already answered.");
        require(questions[questionId].owner == msg.sender, "You cannot accept answer!");
        require(questionId < questions.length, "Question not found!");
        require(commentId < comments.length, "Comment not found!");
        require(comments[commentId].parentId == uint32Max(), "You cannot accept a comment!");
        // Give accepted answer question value
        uint reward = questions[questionId].value;
        comments[commentId].owner.transfer(reward);
        // Mark this question as answered
        questions[questionId].isAnswered = true;
        questions[questionId].acceptedAnswer = commentId;
        // Emit event
        emit questionAnswered(questionId, commentId, reward);
    }
    
    function donateComment(uint32 commentId) public payable {
        // 計算該給發問者跟回答者的斗內
        uint toCommentMaker = (msg.value * (donate_ratio - 1)) / donate_ratio;
        uint toQuestionMaker = msg.value - toCommentMaker; // 因為沒有浮點數所以用減的
        
        // 分別轉帳給發問者跟回答者
        comments[commentId].owner.transfer(toCommentMaker);
        uint32 qId = comments[commentId].questionId;
        questions[qId].owner.transfer(toQuestionMaker);
        
        // 紀錄收到多少斗內
        comments[commentId].received_val += toCommentMaker;
        questions[qId].received_val += toQuestionMaker;
        
        // Emit event
        emit commentDonated(commentId, msg.sender, toCommentMaker);
        emit questionDonated(qId, msg.sender, toQuestionMaker);
    }
    
    function donateQuestion(uint32 questionId) public payable {
        questions[questionId].owner.transfer(msg.value);
        
        // 紀錄收到多少斗內
        questions[questionId].received_val += msg.value;
        
        // Emit event
        emit questionDonated(questionId, msg.sender, msg.value);
    }
    
    // getters
    function getAllQuestionIdByAddr(address addr) public view returns (uint32[] memory) {
        require(members[addr].isRegistered, "User not found");
        return members[addr].ownQuestion;
    }
    
    function getAllCommentIdByAddr(address addr) public view returns (uint32[] memory) {
        require(members[addr].isRegistered, "User not found");
        return members[addr].ownComment;
    }
}
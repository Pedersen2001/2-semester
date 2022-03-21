
let msgBoard={
    handlers: [],
    messages: [],
    boardName: "IWP Chat", 
    register: function(f){
      this.handlers.push(f);
    },
    printMessages: function(){
      console.log("Messages History in board "+ this.boardName+":");
      for(let m of this.messages)
        console.log(m);
    },
    putMessage: function (m){
      this.messages.push(m);
    },
    sendAndNotifyMessage: function(message){
      this.messages.push(message); //better: this.putMessage(message);
      for(let f of this.handlers) 
       f(this.boardName,message);   
    }
  };
       
       
      
  msgBoard.putMessage("Hej, dette er en test");
  msgBoard.putMessage("Hej IWP");
  msgBoard.printMessages();
      
  //register eventHandlers (call-back functions)
  function briansHandler(boardName,message){
    console.log(`Brian! A message from ${boardName}: ${message}`);
    }
   msgBoard.register(briansHandler);
   msgBoard.register((board,message)=>console.log(`Board ${board} says to Michele: ${message}`));
   msgBoard.sendAndNotifyMessage("URGENT: Opgaveregning nu!")
      
  /* EXERCISE, brug gerne et constructor funktion til at oprette msgBoards */    
      
  function MessageBoard(boardname){
    this.handlers= [];
    this.messages= [];
    this.boardName=boardname; 
    this.register= function(f){
      this.handlers.push(f);
    };
    this.printMessages =function(){
      console.log("Messages History in board "+ this.boardName+":");
      for(let m of this.messages)
        console.log(m);
      };
      this.putMessage= function (m){
      this.messages.push(m);
    };
    this.sendAndNotifyMessage= function(message){
      this.messages.push(message); //better: this.putMessage(message);
      for(let f of this.handlers) 
        f(this.boardName,message);
    }
  }
  let board2= new MessageBoard("Opgave Regning");
       
  board2.putMessage("Hej, dette er en test");
  board2.printMessages();
      
  //register eventHandler, get message, call all back
      
  board2.register(briansHandler);
  board2.register((board,message)=>console.log(`Board ${board} says to Michele: ${message}`));
  board2.sendAndNotifyMessage("URGENT: Opgaveregning nu!")
      
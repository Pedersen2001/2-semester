import {noRounds,playRound,roll,isSpecialRound, newScoreBoard,roundsText,getTotalScore} from "./yatzy-game.js"
import {Validation} from "./yatzy-site-forms-handling.js"
export {yatzyController, YatzyGame}

/* *****************************************************************
  DISCLAIMER: This code is developed to support education and demo 
  purposes and certain simplifications have been made to keep the code
  short(ish) and comprehensible.
  ****************************************************************** */

/* **************************************************************************** *
  The Yatzy Controller tracks the state of all games in the system: past and ongoing.
  Multiple-users can play the game at the same time, so these are tracked by gameID,
  and a "game" object instance per game.
  It also assigns gameIDs to new games. It creates a YatzyGame object for each game.
  Game objects are stored in the games array "database"
* ******************************************************************************** */

let yatzyController={
    games: [],   //"DB" for storeing the ongoing and past games
    emptyGame: new YatzyGame(-1,"Unknown Player",5), //to be able to generate an empty scoreboard HTML page.
    hasGame:function(gameID) {
      return (gameID>=0 && gameID<this.games.length && this.getGame(gameID));
    },
    getGame:function(gameID){ //looksup game by gameID
      return this.games[gameID];
    },
    newYatzyGame: function (gameData){        //initiates a new game; allocate empty game and assign gameID; store in DB
      let gameID=this.games.length;
      let game=new YatzyGame(gameID,gameData.name, gameData.diceCount);
      this.games[gameID]=game;
      return game;
    }
  }

/* **************************************************************************** *
  This YatzyGame constructor function creates objects that tracks the state of a aingle game. 
  GameID is the assigned gameID, name is playerName, diceCount the number of dice used in this game.
  It uses the yatzy-game module to imlement the core game logic, score counting, and dice tossing.
  In the current version, the user plays the game round by round as controlled by the "playRound" method.
  The most part of the subsequent code is "trivial" and just produces the HTML of the scoreboard and forms.
 * ******************************************************************************** */

function YatzyGame(gameID,name,diceCount){
  this.gameTitle="IWP Multi Yatzy";
  this.gameID=gameID;
  this.name=name;
  this.diceCount=diceCount;
  this.roundNo=0;  //the next round to play
  this.scoreTable=newScoreBoard();
  this.gameOn=false; //game has not been started yet. 
  this.gameOver=function(){ //if all rounds have been played, stop the game
      return (this.roundNo>=noRounds)
    }; 
  this.start=function(){
    this.gameOn=true;
  };
  
  //The main function for playing a game:plays the next round as executedby playRound. 
  //This implementation only allows the game to be played sequentially from top to button
  this.playRound=function(){
    console.log("playing:" +this.roundNo );
    //skip over special rounds of the scoreboard
    let r=roll(this.diceCount);  
    playRound(this.scoreTable,this.roundNo, r);
    this.roundNo++;
    while(isSpecialRound(this.roundNo) && !this.gameOver()){
      this.roundNo++; 
    }
  };

  /* **************************************************************************** *
  Produce HTML og Game Configuration Form 
  * ******************************************************************************** */
  //Functions to render the two forms of the page: game configuration, and the game-state itself.
  this.printGameFormHTML= function (){
    let gameConfigFormHTML=`
    <h1> ${this.gameTitle}</h1>
    <form action="/newgame" method="post">
    <fieldset>
      <legend>Configure Game:</legend>
       <div class="myFormLayout">
       <label for="name_id"> Name</label>
       <input type="text" id="name_id" name="name" placeholder="Navn" autofocus required minlength="${Validation.minNameLength}" maxlength="${Validation.maxNameLength}"> 
       <label for="diceCount_id"> Number of Dice:</label> 
       <input type="number" id="diceCount_id" name="diceCount" placeholder="${Validation.minDiceCount}" min="${Validation.minDiceCount}" max="${Validation.maxDiceCount}" required>
       <input type="submit"  value="New Game">
      </div>
    </fieldset>
    </form>`;
    let page=printHTMLHdr("IWP Yatzy Game",["css/style.css"]);
    page+= printHTMLBody(gameConfigFormHTML);

    return page;
  }

  /* **************************************************************************** *
     Produce HTML of "new Round" form 
  * ******************************************************************************** */
  this.printRoundFormHTML=function(){
  let scoreTableHTML=this.printScoresHTML();
  let newRoundFormHTML= `<h1> ${this.gameTitle}</h1>
  <form id="gameControl_id"  action="/nextround" method="post">
  <fieldset>
  <legend>Play Game:</legend>
  
  <input type="text" name="gameID" value="${this.gameID}" style="display:none" required minlength="1" maxlength="30">
    <input type="submit" value="Next Round" ${(this.gameOn && !this.gameOver()) ? "" : "disabled"}>
    </fieldset>
  </form>
  <div>
  ${scoreTableHTML}
  </div> \n`;
  let page=printHTMLHdr("IWP Yatzy Game",["css/style.css"]);
  page+=printHTMLBody(newRoundFormHTML);
 
  return page;
  };

 
  /* **************************************************************************** *
     A series of yatzy game (score table) specific functions form HTML'ifying the scoreboard
  * ******************************************************************************** */

  //Print table header and caption
  this.printScoreTableHdrHTML= function(){
    let res=`
    <caption> Yatzy Scores </caption>
     <thead><tr> <th colspan="3"> ${this.name} </th></tr>
     <tr> <th>Round Name </th> <th> Dice </th> <th>Score</th></tr>
    </thead>`;
    return res;
  };
  
  //generates the HTML code for the play scores table, assumed to be complete.
  this.printScoresHTML= function(){
    //Print table header and caption
    let res=`<table id="scoretable" ${(this.gameOn)?"":"class=\"greyed\""}> \n`;
    res+=this.printScoreTableHdrHTML();
    let rows="";
    //print the table body, one row at a time
    for(let round=0;round<this.scoreTable.length;round++) {
      let row="";
      //and one column at a time, first "round name"
      let clmn1 =printTableCellHTML("class=\"left-text\"", roundsText[round]);
    
      let c2="";   //contents cell2
    
      //then the actual dice roll, if any (special rounds do not have a roll)
      if(!isSpecialRound(round)){
        c2+="<span>";
        for(let d=0;d<this.scoreTable[round].diceRoll.length;d++){ //BN: SOLUTION
          const imgName=`${this.scoreTable[round].diceRoll[d]}`;
          c2+=`<img src="img/${imgName}-dice.png" width="20" height="20" alt="dice ${imgName}" title="dice ${imgName}">`;
        }
        c2+="</span>";
      }
      let clmn2 =printTableCellHTML("", c2);
     
      //finally the score column
      let clmn3 = printTableCellHTML("class=\"right-text\"", this.scoreTable[round].score);
  
      if(isSpecialRound(round))
        row+=printTableRowHTML("class=\"row-fill\"", clmn1+clmn2+clmn3);
      else
        row+=printTableRowHTML("", clmn1+clmn2+clmn3);
  
      rows+=row;
    }
    res+=printTableBodyHTML("",rows); //add BODY start/end tags
    res+="</table>"
    return res;
  };
}

/* *************************************************************************************
 * functions common to both Yatzy Controller and Yatzy Game
   *************************************************************************************** */

//main function for generating the HTML code for the play
function printHTMLPage(scoreTable){
  let page=printHTMLHdr("IWP Yatzy Game");
  page+=printHTMLBody(printScoresHTML(scoreTable));
  return page;
}

/* *************************************************************************************
A set of general functions to generate a basic HTML page and table
  *************************************************************************************** */

function printTableBodyHTML(attr,code){
  return `<tbody${attr}>\n ${code} </tbody>\n`;
}
  
function printTableRowHTML(attr,code){
  return `<tr ${attr}> ${code} </tr>\n`;
}
  
function printTableCellHTML(attr,code){
  return `<td ${attr}> ${code} </td>\n`;
}


//The page needs a HTML header with a suitable title
//Optionally, allows css files and in-header scipts to be added
function printHTMLHdr(title,csss=[],scripts=[]){

  let cssString="";
  for(let i=0;i<csss.length;i++){
    let css=csss[i];
    cssString+=`${css===""?"":"<link rel=\"stylesheet\" href=\""+css+"\">\n"}`;
  } 
  let scriptString="";
  for(let i=0;i<scripts.length;i++){
    let script=scripts[i];
    scriptString+=   `${script===""?"":"<script defer src=\""+script+"\"></script>\n"}`;
  } 
  
  let str=`
  <!DOCTYPE html>
  <html lang="da">
  <head>
    <title>${title}</title>
    <meta charset="utf-8">
    ${cssString}
    ${scriptString}
      </head>`;
  return str;
}


//The page needs a body, with html contents given in body parameter
//Optionally, allows a set of ES6 modules (type attribute=module)to be loaded as well at the end of the body
function printHTMLBody(body,scripts=[]){
  let scriptString="";
  for(let i=0;i<scripts.length;i++){
    let script=scripts[i];
    scriptString+=   `${script===""?"":"<script type=\"module\" src=\""+script+"\"></script>\n"}`;
  } 
  let str=`
  <body>
  ${body}
  ${scriptString}
   </body>
</html>`;
return str;
}


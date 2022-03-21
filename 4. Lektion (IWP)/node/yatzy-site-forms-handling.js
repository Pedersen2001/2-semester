import {noRounds,playRound,roll,isSpecialRound, newScoreBoard,roundsText} from "./yatzy-game.js"
import {yatzyController, YatzyGame} from "./yatzy-site-game-control.js"
export {yatzyHomePage,newYatzyGamePage,newYatzyRoundPage,validateYatzyConfigData,validateYatzyRoundData,
  validateYatzyHighScoreData,yatzyHighScorePage,ValidationError,Validation}

/* *****************************************************************
  DISCLAIMER: This code is developed to support education and demo 
  purposes and certain simplifications have been made to keep the code
  short(ish) and comprehensible.
  ****************************************************************** */

/* **************************************************************************** *
   The first series of functions are called by the server module as result of HTTP
   communication with the client caused by the user submitting forms.
   Forms Data is transfered to this "application" module, it two steps:
  1) The raw forms data is sent to a validator functions that retuns a  validated data-object with the forms data.
  2) Then, the now validated data is forwarded to a function that computes the actual client response (HTML page). 
 * ******************************************************************************** */

const ValidationError="Validation Error";


//constants for validating input from the network client
//constants for validating input from the network client
const Validation = {
  maxDiceCount:20,
  minDiceCount:5,
  minNameLength:1,
  maxNameLength:30,
  minDifficultyLevel:1.0,
  maxDifficultyLevel:2.0,
  difficultySteps:10, //0.1 increments of dificultyLevelFactor
  difficultyStepFactor:"0.1",
  topDownOrder:"topDownOrder",
  bottomUpOrder:"bottomUpOrder",
};

//Called by the server when it has received the Yatzy Game configuration form
//It must validate the included forms data and return an object with valid data. 
//gameFormData is an instance of "URLSearchParams", se chap 9.11 
function validateYatzyConfigData(gameFormData){
  let playerName;
  let playerNameLen;
  let diceCount;
  //ensure that data contains the right fields
  if(gameFormData.has("name") && gameFormData.has("diceCount")){
    playerName=gameFormData.get("name");
    playerNameLen=playerName.length;
    diceCount=Number(gameFormData.get("diceCount"));
    //and right values
    if((playerNameLen>=Validation.minNameLength) && (playerNameLen<=Validation.maxNameLength) &&
       (diceCount >= Validation.minDiceCount) && (diceCount <=Validation.maxDiceCount) ){
       //strip other fields from the form
      let gameData={name: playerName, diceCount: diceCount}; 
      return gameData;
    }
  }
  //anything else: No Go! 
  throw(new Error(ValidationError));
}



//Called by the server when it has received the Yatzy Round form
//todo: decrypt gameID
//roundFormData is an instance of "URLSearchParams", se chap 9.11 
function validateYatzyRoundData(roundFormData){
  //gameID should be encrypted
  if(roundFormData.has("gameID")) {
     let roundData={gameID:Number(roundFormData.get("gameID"))};
     let game=yatzyController.getGame(roundData.gameID);
     if(game && !game.gameOver())
       return roundData;
  }
  //any other case: no go! 
  throw(new Error(ValidationError));
}

//Called by the server when it has received a GET on the root "/" resource
//eg. 127.0.0.1:3000/
//It is expected to produce an HTML "front page" for the game
function yatzyHomePage(){
  let page=yatzyController.emptyGame.printGameFormHTML();
  return page; 
}
//Called by the server after the "new game config" form has been validated
//ie, it transfers the validate gameData object produced by the validator function
//The function is expected to return an HTML page with the scoreboard and functionality to play a next round
function newYatzyGamePage(gameData){
  let game=yatzyController.newYatzyGame(gameData);
  game.start(); 
  let page=game.printRoundFormHTML();
  return page;
}

//Called by the server when a request for a new round has been issued (after the form has been validated)
//It is expected to produce an HTML File with the results from playing a round.
function newYatzyRoundPage(roundData){
  let gameID=roundData.gameID;

  let game=yatzyController.getGame(gameID);
  game.playRound();
  let page=game.printRoundFormHTML();
  return page;
}

//called by the server when the user has requested the highscore
function validateYatzyHighScoreData(formsData){
  //Validate
  return formsData;
}
//called by the server when the user has requested the highscore (after validation)
//It is to return a complete HTML page with the high-score contents.  
function yatzyHighScorePage(validatedData){
return ""; //Add me
}

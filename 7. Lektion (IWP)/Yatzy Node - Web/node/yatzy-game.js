/*
This program is inspired by Kurt Nørmarks exam assignment for C-programming for first semester students.
This version of Yatzy is intentionally programmed as a simple C-style implementation in JavaScript; 
Hence, more elegant JS implementations can be programmed. For IWP, this imperative style version is perfectly OK! 
*/

"use strict";
//import fs from 'fs'; //make use of file system module
export {noRounds, rounds,isSpecialRound,newScoreBoard,playRound,roll};

const M=10; //Number of dice >=5 , <=20
const minDice=1; const maxDice=6; //min and max value of a normal dice.


//A Yatzy "play" consists of completing 15 game rounds, plus computing 3 "special" status (sum,bonus,total).
//Here simplified to 18 rounds.
const noRounds=18;
const rounds={ //as C-enums doesn't directly exist in JS, we emulate it using an object
  ones:   0,
  twos:   1,
  threes: 2,
  fours:  3,
  fives:  4,
  sixes:  5,
  sum:    6,
  bonus:  7,
  onePair:  8,
  twoPairs:  9,
  threeId:  10,
  fourId:   11,
  littleS:  12,
  bigS:     13,
  house:    14,
  chance:   15,
  yatzy:    16,
  total:    17
};

function isSpecialRound(round){ 
  return ((round===rounds.sum || round===rounds.bonus || round===rounds.total));
}


const roundsText=["1s", "2s",  "3s", "4s", "5s", "6s", "Sum", "Bonus", "1 Pair", "2 Pairs", "Three Identical", "Four Identical",
  "Little Straight",  "Big Straight",   "House",   "Chance",   "Yatzy",  "Total Score"
];


//return a random number between min and max
function random(min,max){
    return Math.floor(Math.random() * (+max + 1 - +min)) + +min; 
}
//returns an array that represents the outcome of rolling M dice
///e.g diceRoll [1,6,5,5,2] 
function roll(M){
    let diceRoll=[];
    for(let i=0;i<M;i++){
       diceRoll[i]= random(minDice,maxDice); 
    }
    return diceRoll;
}

//We maintain an array containing the counts of each dice
//count[0] gives the number of 1s in the roll; count[5] gives the numberof 6s
function i2d(index){ //converts index to dice value
  return index+1;
}
function d2i(dice){ //converts dice value to its index position
  return dice-1;
}

//computes the counts array, given an array of dice values.
function countDice(diceRoll){
    let diceCount=[]; 
    for(let i=0;i<maxDice;i++){ //initialize with 0 counts
      diceCount[i]=0;
    }
    for(let i=0;i<diceRoll.length;i++){ //foreach dice, increment the corresponding count entry
        diceCount[d2i(diceRoll[i])]++;
    }
  return diceCount;
}

//the state of a game play is stored in a acoreboard array; 
//each entry is a "struct" (object) with the  round id, round name, score, and the original dice roll array 

//record a round into the scoreboard given in "play" 
function noteScore(play,round,score,roll){
  play[round]= {roundID: round, roundName: roundsText[round], score: score, diceRoll:roll};
}

//construct and initialize scoreboard  
function newScoreBoard(){
  let scoreBoard=[];
  for(let roundNo=0;roundNo<noRounds;roundNo++){ 
    noteScore(scoreBoard, roundNo, 0,[]); 
  }
  return scoreBoard;
}

/*
  A large collection of helper function to compute scores
*/

//computes the sum of the first 6 rounds (1nes to 6es)
function calcSum(play){
  let sum=0;
  for(let round=rounds.ones; round<=rounds.sixes;round++)
    sum+=play[round].score;
  return sum;
}
//computes if the sum warrants a "bonus"
function calcBonus(sum){
  if(sum>=63) 
      return 50;
    else 
      return 0;
}

//Compute the score of N identical dice
//start backwards to find the larges N
function calcIdentical(diceCount,N){
  for(let i=d2i(maxDice);i>=d2i(minDice);i--)
   if(diceCount[i]>=N) 
      return i2d(i)*N;
  return 0;
}

//the score of "a pair"
function calcPair(diceCount){
  return calcIdentical(diceCount,2)
}

//computes the score for "two pairs" game
//we need to find the two largest pairs, not being the same dice value
//dices [2,2,5,5,6,6,6,6] should give 6+6+5+5
function calcTwoPairs(diceCount){
  let found=0;
  let pair=[];
  for(let i=d2i(maxDice);i>=d2i(minDice) && found <2; i--)
   if(diceCount[i]>=2){ 
      pair[found]= i2d(i)*2;
      found++;
   }
  if(found===2) 
    return pair[0]+pair[1];
    else 
  return 0;
}

//Little straight: 1-5; big straight 2-6
//start and stop are the dice value (to be converted into array index starting at 0)
function calcSeries(diceCount,start,stop){
  let sum=0;
  for(let i=d2i(start);i<=d2i(stop);i++)
    if(diceCount[i]<1) return 0;
  else 
    sum+=i2d(i);
  return sum;
}

//a hous mandates 3 of one kind and 2 of (another) kind
//first find the position of 3 largest identical dice, then 
//the largest 2 (different) identical
function calcHouse(diceCount){
  let found3=-1;  //position where 3 identicals is found
  let threes=0;  //score of 3 identical
  let twos=0;    //score of 2 identical
  for(let i=d2i(maxDice);i>=d2i(minDice)&&threes===0; i--)
   if(diceCount[i]>=3){ 
      threes= i2d(i)*3;
      found3=i;//save position 
   }
  for(let i=d2i(maxDice);i>=d2i(minDice)&&twos===0; i--)
   if(diceCount[i]>=2 && i!==found3){ //skip position of three identical 
      twos= i2d(i)*2;
   }

  if(twos > 0 && threes > 0) //did we have a house?
    return twos+threes;
   else 
    return 0;
}

//chance: calc sum of largest 5 dice
function calcChance(diceCount){
  let rest=5; //Use only 5 (largest) dice 
  let sum=0; 
  for(let i=d2i(maxDice);i>=d2i(minDice) && rest>0; i--)
    for(let j=0;j<diceCount[i] && rest>0; j++){
      sum += i2d(i);
      rest--;
    }
  return sum;
}

//In this implementation it takes 5 identical to get yatzy!
function calcYatzy(diceCount){
  if(calcIdentical(diceCount,5)>0) 
    return 50;
  else
    return 0;  
}

//sum up total score
function calcTotal(play){
  let total=0;
  for(let round=rounds.sum ; round<rounds.total;round++){
    total+=play[round].score;
  }
  return total;
}

//two functions to print the score board
//padString creates a string of ' ' characters of length 'length' 
function paddString(length){
  let padding ="";
  for (;length>0;length--) 
    padding+=" ";
  return padding
}

//pretty print the scoreboard to a string; then print to console
function printScores(play){
  for(let round=0;round<play.length;round++) {
    let roundName=play[round].roundName;
    let score=String(play[round].score);
    let dices=""; 

    for(let i=0;i<play[round].diceRoll.length;i++) 
      dices+= play[round].diceRoll[i];
    if(dices.length===0) 
      dices+=paddString(M);
    
    let output=roundName;
    output+=paddString(15-roundName.length) + "  " + dices +"  " + paddString(5-score.length)+score;
    console.log(output);
  }
}

//this function plays the 'roundNo' of scoreboard 'play', given diceroll array 'roll'
function playRound(play,roundNo,roll){
  let c=countDice(roll);
  let score=0;
  switch(roundNo){
    case rounds.ones: 
        score=1*c[d2i(1)];
      break;
      case rounds.twos:
        score=2*c[d2i(2)];
      break;
      case rounds.threes: 
        score=3*c[d2i(3)];
      break;
      case rounds.fours: 
        score=4*c[d2i(4)];
      break;
      case rounds.fives:
        score=5*c[d2i(5)];
      break;
      case rounds.sixes:
        score=6*c[d2i(6)];
      break;
      case rounds.onePair:
        score=calcPair(c);
      break;
      case rounds.twoPairs:
        score=calcTwoPairs(c);
      break;
      case rounds.threeId:
        score=calcIdentical(c,3);
      break; 
      case rounds.fourId:
        score=calcIdentical(c,4);
      break; 
      case rounds.littleS:
        score=calcSeries(c,1,5);
      break; 
      case rounds.bigS:
        score=calcSeries(c,2,6);
      break; 
      case rounds.house:
        score=calcHouse(c);
      break; 
      case rounds.chance:
        score=calcChance(c);
      break;
      case rounds.yatzy:
        score=calcYatzy(c);
      break; 
      default: 
        console.log("no such game:"+roundNo);
      }
  noteScore(play,roundNo,score,roll); //record the score in scoreboard

  //compute sum,bonus, total and update scoreboard
  let sumScore=calcSum(play);
  noteScore(play,rounds.sum,sumScore,[]);
  let bonusScore= calcBonus(sumScore);
  noteScore(play,rounds.bonus,bonusScore,[]);
  let totalScore=calcTotal(play);
  noteScore(play,rounds.total,totalScore,[]); 
}


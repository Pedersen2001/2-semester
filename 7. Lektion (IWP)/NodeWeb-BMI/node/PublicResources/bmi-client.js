'use strict'
//SEE: https://javascript.info/strict-mode


function showDate(data){
    let p=document.getElementById("id1");
    let d=document.createElement("pre");
    d.innerHTML=String("Fetched date object: "+data);
    p.parentNode.appendChild(d);
   
}


function jsonParse(response){
  if(response.status==200) 
     return response.json();
 else 
    throw new Error("Non HTTP OK response");
}

function jsonFetch(url){
  return  fetch(url).then(jsonParse);
}




function jsonPost(url = '', data={}){
  const options={
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    body: JSON.stringify(data) // body data type must match "Content-Type" header
    };
  return fetch(url,options).then(jsonParse);
}
/*
function jsonPost(url = '', data={}){
  const options={
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    };
  return fetch(url,options).then(jsonParse);
}
*/

console.log("JS er klar!");
//console.log(jsonFetch("/bmi-records"));
jsonFetch("/bmi-records").then(v=> {console.log("BMI Records"); console.log(v);}).catch(e=>console.log("Ooops"+e.message));
jsonFetch("/bmi-records/Mickey").then(v=> {console.log("Sample BMI Record"); console.log(v);}).catch(e=>console.log("Ooops"+e.message));
function extractBMIData(){
  let bmiData={};
  bmiData.name=document.getElementById("name").value;
  bmiData.height=document.getElementById("height").value;
  bmiData.weight=document.getElementById("weight").value;
  console.log("Extracted"); console.log(bmiData);
  return bmiData;
}

function sendBMI(event) {
  event.preventDefault(); //we handle the interaction with the server rather than browsers form submission
  document.getElementById("submitBtn").disabled=true; //prevent double submission
  let bmiData=extractBMIData();
  

  jsonPost(document.getElementById("bmiForm").action,bmiData).then(bmiStatus=>{
    console.log("Status="); console.log(bmiStatus);
    document.getElementById("result").innerHTML="Hi "+bmiData.name +"! Your BMI is " +bmiStatus.bmi +". Since last it has changed " +bmiStatus.delta+ "!";+"! Your BMI is " +bmiStatus.bmi +". Since last it has changed " +bmiStatus.delta+ "!";
    document.getElementById("result").style.visibility="visible";
    //document.getElementById("bmiForm").reset();
    document.getElementById("submitBtn").disabled=false; //prevent double submission
  }).catch(e=>console.log("Ooops "+e.message));;
}
//document.getElementById("bmiFormular").action="/bmi.records";
//document.getElementById("bmiFormular").method="post";

document.getElementById("bmiForm").addEventListener("submit", sendBMI);

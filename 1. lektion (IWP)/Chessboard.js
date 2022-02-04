// Set the grid size
var size = 8;

// set a variable for the grid output string
var gridOutput = "";

// set a variable for the row output string
var rowOutput = "";

// set variables for the things that make up the grid
var gridSpace = " ";
var gridHash = "#";

// Set an outer loop for the number of rows
for ( var row = 1; row <= size; row++ ) {
  
  // if the row is odd, start with a space
  if ( row%2 != 0 ) {
    var currItem = gridSpace;
    var nextItem = gridHash;
  }
    
  // otherwise start with # 
  else {
    var currItem = gridHash;
    var nextItem = gridSpace;
  }
  
  // reset the rowOutput variable
  rowOutput = "";
    
  // Set an inner loop for the number of columns
  for ( var column = 1; column <= size; column++ ) {
  	
    // build the row by adding each column
    if ( column%2 != 0 )
      rowOutput += currItem;
    else
      rowOutput += nextItem;

  }
  
  // add the row to the grid output
  gridOutput += rowOutput + "\n";

}

//print the grid to the console
console.log( gridOutput );
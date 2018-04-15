function myFunction() {
  var sheet = SpreadsheetApp.getActive()
  var data = sheet.getRange('A1:FH').getValues();
  
}

function isBikeId(cell) {
  if (isNaN(cell.charAt(1))  && isNaN(cell.charAt(2)) || cell == "") {
    return false;
  }
  else {
    return true;
  }
}
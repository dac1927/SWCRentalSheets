//TODO line 128~
//get checked: var isChecked = document.getElementById('id_of_checkbox').checked; 
//setup for the spreadsheet, mostly script properties
function setUp() {
    onOpen();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("rentals");
    var idList = retriveObject("IDLIST");  //storing the current list of current ids in memory
    var count = 0;
    var cacher = [];                       //cache to store all objects using the ids in the id list
    while(count<idList.length) {           //storing each object
      cacher[count] = retriveObject(idList[count]);
      count++;
    }
    PropertiesService.getScriptProperties().deleteAllProperties();  //clear ALL propeties
    count = 0;
    while(count<idList.length) {             //restore all objects with their ids
      storeObject(idList[count], cacher[count]);
      count++;
    }
    storeObject('IDLIST', idList);           //store the id list
    storeObject('IDCOUNTER', 0);
    var columnDict = {String : String};      //dictionary for column labels/position
    var rowDict = {String : String};         //dictionary for row labels
    var temp;
    var columnKeyStringArray = sheet.getRange('rentals!A1:' + columnToLetter(sheet.getLastColumn()) + '1').getValues().join().split(','); //retrive the rental's x-keys
    var rowKeyStringArray = sheet.getRange('rentals!A1:' + 'A' + sheet.getLastRow()).getValues().join().split(',');       //retrive the rental's y-keys
    var BreakException = {};
      for(i = 0; i < rowKeyStringArray.length; i++) {              //entering key-value pairs for rental bikes on rental sheet
        if (rowKeyStringArray[i] != "" && rowKeyStringArray[i] != undefined && rowKeyStringArray[i] != null) { // the cell isn't empty
           if (rowDict[rowKeyStringArray[i]] != undefined) {
               var result = ui.alert('Bike ID duplicate of "' + String(rowKeyStringArray[i]) + '" : Please fix and Reload the spreadsheet.',
               ui.ButtonSet.OK_CANCEL);
               if (result.OK || result.CANCEL || result.CLOSE) {
                  break;
               }
            }
            rowDict[rowKeyStringArray[i]] = String((i + 1).toFixed(0));
          }
    }
    rowKeyStringArray.forEach(function(item, index) {
                                                        rowDict[item] = index + 1;
                                                     })
    PropertiesService.getScriptProperties().setProperties(rowDict);
    var rezsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("reservations");
    var rezRowArray = rezsheet.getRange('reservations!A1:' + 'A' + rezsheet.getLastRow()).getValues().join().split(',');
    var rezRowDict = {};
    for(i = 0; i < rezRowArray.length; i++) {
       if (rezRowArray[i] != "" && rezRowArray[i] != undefined && rezRowArray[i] != null) {
           if(rezRowDict[rezRowArray[i]] != undefined) {
             rezRowDict[rezRowArray[i]].push(String((i + 1).toFixed(0)));
           }
           else {
             rezRowDict[rezRowArray[i]] = [String((i + 1).toFixed(0))];
           }
       }
    }
    for (var key in rezRowDict) {
      // check if the property/key is defined in the object itself, not in parent
      if (rezRowDict.hasOwnProperty(key) && key != undefined && key != null && key != "") {
          rezRowDict[key] = JSON.stringify(rezRowDict[key]);
      }
    }
    PropertiesService.getScriptProperties().setProperties(rezRowDict);
    var columnKeyDateArray = columnKeyStringArray.map( function(x) {
                                                                      temp = new Date(x);
                                                                      if (String(temp) == 'Invalid Date')
                                                                      return '0';
                                                                      else
                                                                      return dateFormat(temp);
                                                                    })
    for(i = 0; i < columnKeyStringArray.length; i++) {
        if (columnKeyStringArray[i] != "") {
           if (columnDict[columnKeyStringArray[i]] !== undefined) {
               var result = ui.alert('Date duplicate of "' + String(columnKeyStringArray[i]) + '" : Please fix and Reload the spreadsheet.',
               ui.ButtonSet.OK_CANCEL);
               if (result.OK || result.CANCEL || result.CLOSE) {
                  break;
               }
            }
            columnDict[dateFormat(new Date(columnKeyStringArray[i]))] = columnToLetter(i + 1);
          }
    }

    PropertiesService.getScriptProperties().setProperties(columnDict);
    colorToday();

}
//functions with auto triggers
function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .createMenu('Rental Tools')
      .addItem('Show Rental Tools', 'showRentalSidebar')
      .addItem('Show Reservation Tools', 'showReservationSidebar')
      .addToUi();
}

function showRentalSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('side')
      .setTitle('Rental Tools')
      .setWidth(300);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showSidebar(html);
}
function showReservationSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('rezside')
      .setTitle('Reservation Tools')
      .setWidth(300);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showSidebar(html);
}
//end of setup!
//INGEST ##################################################################################################################################################
function onEdit(e) {
   var sheet = SpreadsheetApp.getActiveSheet();
   if (sheet.getName() == "input" && sheet.getActiveRange().getColumn() == 1) {
     var i = -1;
     var erange = e.range.getValues();
     sheet.getRange(e.range.getA1Notation()).setValue("").activate();
     var rm = 0;
     var ct = 0;
     var id;
     var idList;
     var raw, stripped, rack, letter;
     while (erange[ct]) {
         var letter = "J"
         rm = 0;
       if (erange[ct][0][0] == "S") {
         rm = 2;
         switch(erange[ct][0][1]) {
           case "1":
            letter = "B"
            break;
           case "2":
            letter = "C"
            break;
           case "3":
            letter = "D"
            break;
           case "4":
            letter = "E"
            break;
           default:
            letter = "J"
            rm = 0;
         }
       }
       i = nextEmptyCell(sheet.getRange(letter + ":" + letter));
       if(erange[ct][0].substr(2) == "TOGGLE") {
         var b = sheet.getRange(letter + "2:" + letter + String(i.toFixed(0)));
         if(!b.isBlank()) {
         id = guid();
         idList = retriveObject("IDLIST");
         idList.push(id);
         storeObject("IDLIST",idList);
         raw = b.getValues().join().split(',').filter(Boolean);//FINISH THIS STUFF
         rack = (raw[0].matches(".*(-R)") ? "-R" : "");
         stripped = raw.replace('-R','');
	       letter = stripped.match(/^.*[A-J]$/);//id letter
         Logger.log(letter);
	       storeObject(id,raw);
         sheet.getRange(letter + "2:" + letter + String(i.toFixed(0))).clear();
         }
       } else {
       sheet.getRange(letter + String(i.toFixed(0)) +":" + letter + String(i.toFixed(0))).setValue(erange[ct][0].substr(rm));
       }
       ct++;
    }
  }
}
//class descriptions?
function Bike(idInput) {
  var id = idInput;
  var position = findRow('rental',idInput);
}
//lower level functions! #################################################################################################################################
function findColumn(dateInput) {
    var b;
    return (b = PropertiesService.getScriptProperties().getProperty(dateFormat(dateInput))) === 'undefined' ? -1:b;
}
function findRow(mode, bikeInput) {
    var b
    if(mode == 'rental')
      return ((b = parseInt(PropertiesService.getScriptProperties().getProperty(bikeInput))) === 'undefined' ? -1: b).toFixed(0);
    return retriveObject(bikeInput);
    
}
function storeObject (name, myObject) {
PropertiesService.getScriptProperties().setProperty(name, JSON.stringify(myObject) );
}
function retriveObject(name) {
  var b;
  return JSON.parse((b = PropertiesService.getScriptProperties().getProperty(name)) === 'undefined'? 'null':b);
}
function isBikeId(idInput) {
  if (isNaN(idInput.charAt(1))  && isNaN(idInput.charAt(2)) || idInput == undefined) {
    return false;
  }
  else {
    return true;
  }
}
function dateFormat(dateInput) {
    return String(dateInput.getMonth() + 1) + '/' + String(dateInput.getDate());
}
function columnToLetter(column)
{
  var temp, letter = '';
  while (column > 0)
  {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function letterToColumn(letter)
{
  var column = 0, length = letter.length;
  for (var i = 0; i < length; i++)
  {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}
function getRentalRange(sheet, startDate, endDate, bikeInput) {
  return sheet.getRange('rentals!' + String(findColumn(startDate)) + String(findRow('rental',bikeInput)) + ':' + String(findColumn(endDate)) + String(findRow('rental',bikeInput)));
}
function getRangeLength(a1Input){
  a1Input = a1Input.replace(/[^\D]/g, '');  //filtering out numbers
  letters = a1Input.split(':');
  return letterToColumn(letters[1]) - letterToColumn(letters[0]) + 1;
}
function writeName(nameInput, a1Input) {
  var array = [[]];
  for(var i = 0; i < getRangeLength(a1Input); i++)
  array[0].push(nameInput);
  return array;
}
function nextEmptyCell(range) {
  var values = range.getValues(); // get all data in one call
  var ct = 0;
  while ( values[ct] && values[ct][0] != "" ) {
    ct++;
  }
  return (ct+1);
}
//fcns for sidebars ################################################################################################################################
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return dateFormat(new Date()) + "-" + s4();
}
function getNextRentals() {
  var ids = retriveObject('IDLIST');
  var rentals = [];
  var rental;
  var string = new String();
  for(var  i = 0; i < ids.length; i++) {
    string = '';
    rental = retriveObject(ids[i])
    if(rental != null) {
      rental.forEach(function(element, index) {
          string += ((index == 0? ' ': ', ') + element)
          });
     rental = {id: ids[i], bikes: string};
     rentals.push(rental);
  }
  }
  return rentals;
}
//functions related to user-facing GUI:
function finishRentalOld(name, date, id) { ///finishes the rental with the given info
  var today = new Date();
  var endDate = new Date()
  endDate.setMonth(parseInt(date.split('-')[1]) - 1)
  endDate.setDate(date.split('-')[2])
  var x = [];
  var conflicts = [];
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("rentals")
  var bikes = [];
  for(var i = 0; i < id.length; i++) {
  bikes.push.apply(bikes , retriveObject(id[i]));
  }
  for(var i = 0; i < bikes.length; i++) {
    x[i] = getRentalRange(sheet, today, endDate, bikes[i])
    if (!x[i].isBlank()) {
      conflicts.push(bikes[i])
      }
  }
  if (conflicts.length == 0) {
    for(var i = 0; i < bikes.length; i ++) {
      x[i].setValues(writeName(name,x[i].getA1Notation()))
    }
    for(var i = 0; i < id.length; i++)
      PropertiesService.getScriptProperties().deleteProperty(id[i])
    return true;
  }
  else {
   var ui = SpreadsheetApp.getUi()
   var string = new String();
   conflicts.forEach(function(element){
               string += (" " + element);
             })
   ui.alert("Conflicts with bike" + (conflicts.length > 1? "s":"") + ":" + string)
   return false;
  }
}
function deleteRental(ids) { //deletes the specified rental
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert("Are you sure you want to delete these rentals?", ui.ButtonSet.YES_NO);
  if(response == ui.Button.YES) {
  var idList = retriveObject('IDLIST');
    for(var i = 0; i < ids.length; i++) {
      PropertiesService.getScriptProperties().deleteProperty(ids[i]);
      idList[idList.indexOf(ids[i])] = 'DELETE';
    }
    idList = idList.filter(function(n){return n != 'DELETE'});
    storeObject('IDLIST', idList)
    return true;
  }
  else {
    return false;
  }
}
//these functions revolve around splitting up a rental
function splitRentalsDialog(ids) { //creates dialog
  var bikes = [];
  for(var i = 0; i < ids.length; i++) {
  bikes.push.apply(bikes , retriveObject(ids[i]));
  }
  storeObject('splitBikes', bikes);
  storeObject('splitBikeIDs', ids)
  var ui = SpreadsheetApp.getUi()
  var html = HtmlService.createHtmlOutputFromFile('split')
  ui.showModalDialog(html, 'Split bikes')
}
function getBikes() {  //is called in script to get the bikes in question
  return retriveObject('splitBikes');
}
function createSplitRentals(rentals) { //performs the split
  var id1 = guid();
  var id2 = guid();
  var r1 = rentals.checked;
  var r2 =  rentals.unchecked;
  var idList = retriveObject('IDLIST');
  var oldIds = retriveObject('splitBikeIDs')
  idList[idList.indexOf(oldIds[0])] = 'DELETE' 
  idList[idList.indexOf(oldIds[1])] = 'DELETE'
  idList = idList.filter(function(n){return n != 'DELETE'});
  idList.push(id1);
  idList.push(id2);
  storeObject('IDLIST', idList);
  storeObject(id1, r1)
  storeObject(id2, r2)
  PropertiesService.getScriptProperties().deleteProperty(oldIds[0]).deleteProperty(oldIds[1]);
  showRentalSidebar();
  return true;
}
//other specific functions
function colorToday() {
  var today = new Date();
  var columnID = findColumn(today);
  if (columnID != -1) {
    var rental = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("rentals").getRange(columnID + ':' + columnID); //undefined, undefined
    rental.setBackgroundRGB(144, 206, 162);
    var rez = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('reservations').getRange(columnID + ':' + columnID);
    rez.setBackgroundRGB(144, 206, 162);
    if (SpreadsheetApp.getActiveSheet().getName() !== "input") {
      rental.activate();
      rez.activate();
    }
  }
}
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('side')
      .setTitle('Bike Rental Tools:')
      .setWidth(300);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showSidebar(html);
}
function resetList() {
  storeObject("IDLIST", [])
  storeObject("IDCOUNTER", 0)
}
function hardReset() {
  resetList();
  setUp();
}
function colorPotential(bikeID, name, endDate, hasRez) //desired bike, name on rental/rez, endDate(startDate is assumed to be today)
{ 
  var bikes = retriveObject(bikeID);
  var wRack = retriveObject(bikeID + "R");
  if(wRack != null)
    bikes.concat(wRack);
  var today = new Date();
  var startID = findColumn(today);
  var endID = findColumn(endDate);
  if(startID !== -1) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('reservations');
    var totalArea = sheet.getRange(startID + bikes[0] + ':' + endID + bikes[bikes.length - 1]);
    totalArea.setBackgroundRGB(0, 0, 255);
    var vals = totalArea.getValues();
    var row;
    var o = 0, d = 0;
    if (hasRez) {
      var rez = false;
      for(; o < vals.length; o++) { // while more to check and && rez not found
        rez = true;
        for(d = 0; d < vals[o].length && rez; d++) {  //while more to check && rez is found
          if (!(vals[o][d] === name))  //if cell isn't a rez, set to false
            rez = false;
        }
        if(rez === true)
          break;
      }
    } else {
      var flag = false;
      for(; o < vals.length; o++) { // while more to check and && rez not found
        flag = true;
        for(d = 0; d < vals[o].length && flag; d++) {  //while more to check && rez is found
          if (!(vals[o][d] === ""))  //if cell isn't empty , set to false
            flag = false;
        }
        if(flag === true)
          break;
      }
    }
    if(flag === false) {
      return "Conflict";
    }
    var chosenArea = sheet.getRange(startID + bikes[o] + ':' + endID + bikes[o]);
    chosenArea.setBackgroundRGB(0, 255, 0);
    return chosenArea;
  }
}
function finishRental(name, date, id) { ///finishes the rental with the given info
  var today = new Date();
  var endDate = new Date()
  endDate.setMonth(parseInt(date.split('-')[1]) - 1)
  endDate.setDate(date.split('-')[2])
  var x = [];
  var conflicts = [];
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("rentals")
  var bikes = [];
  for(var i = 0; i < id.length; i++) {
    bikes.push.apply(bikes , retriveObject(id[i]));
  }
  for(var i = 0; i < bikes.length; i++) {
    x[i] = colorPotential(bikes[i], name, endDate, false)
    if (x[i] === "Conflict") {
      conflicts.push(bikes[i])
      }
  }
  if (conflicts.length == 0) {
    for(var i = 0; i < bikes.length; i ++) {
      x[i].setValues(writeName(name,x[i].getA1Notation()))
    }
    for(var i = 0; i < id.length; i++)
      PropertiesService.getScriptProperties().deleteProperty(id[i])
    return true;
  }
  else {
   var ui = SpreadsheetApp.getUi()
   var string = new String();
   conflicts.forEach(function(element){
               string += (" " + element);
             })
   ui.alert("Conflicts with bike" + (conflicts.length > 1? "s":"") + ":" + string)
   return false;
  }
}
function test() {
      var date = new Date();
      date.setDate(date.getDate() + 1);
      Logger.log(colorPotential("H17", "Dude", date, false));
}

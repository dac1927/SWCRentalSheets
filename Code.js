//TODO line 128~
//get checked: var isChecked = document.getElementById('id_of_checkbox').checked; 
//setup for the spreadsheet, mostly script properties
function test() {
   var bikes = [];
   bikes.push({type: "H17", letter: ["A"], rack: [false]});
   bikes.push({type: "H17", letter: ["B"], rack: [true]});
   bikes.push({type: "H19", letter: ["A"], rack: [false]});
   bikes.push({type: "H19", letter: ["B"], rack: [false]});
   bikes.push({type: "WH19", letter: ["C"], rack: [false]});
   bikes.push({type: "WH19", letter: ["D"], rack: [false]});
   var combined = combineRentalBikes(bikes);
   var date = new Date();
   for(var i = 0; i < combined.length; i++)
    findPotential(combined[i], "Devin", date, date, false);
}
function logSomething() {
  Logger.log('something');
}
function onInstall() {
  hardReset();
}
function onOpen() {
    addUI();
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
    var BreakException = {};
    var rezsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("rentals");
    var rezRowArray = rezsheet.getRange('rentals!A1:' + 'A' + rezsheet.getLastRow()).getValues().join().split(',');
    var rezRowDict = {};
    for(i = 0; i < rezRowArray.length; i++) {
       if (rezRowArray[i] !== "" && rezRowArray[i] !== undefined && rezRowArray[i] !== null && rezRowArray[i].charAt(0) !== '*') {
           if(rezRowDict[rezRowArray[i]] !== undefined) {
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
function addUI() {
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .createMenu('Rental Tools')
      .addItem('Show Rental Form', 'showRentalForm')
      .addItem('Show Rez Form', 'showRezSidebar')
      .addItem('Show Rental Tools', 'showRentalSidebar')
      .addToUi();
}

function showRentalSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('side')
      .setTitle('Rental Tools')
      .setWidth(300);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showSidebar(html);
}
function showRezSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('rez')
      .setTitle('Rez Form')
      .setWidth(300);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showSidebar(html);
}
function showRentalForm() {
  var html = HtmlService.createHtmlOutputFromFile('rental')
      .setTitle('Rental Form')
      .setWidth(300);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showSidebar(html);
}
//end of setup!
//INGEST ##################################################################################################################################################
function checkIn(bike) {
  
}
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
     var raw, split;
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
       if(erange[ct][0].substr(2) == "TOGGLE") { //TODO: and not in checkout mode
         var b = sheet.getRange(letter + "2:" + letter + String(i.toFixed(0)));
         if(!b.isBlank()) {
         id = guid();
         idList = retriveObject("IDLIST");
         idList.push(id);
         storeObject("IDLIST",idList);
         raw = b.getValues().join().split(',').filter(Boolean);//new syntax: H19:A-R
         var bikeList = [];
         var bikeTemp;
         for(var a = 0; a < raw.length; a++) {
            split = raw[a].split(/:|-/);    //splitting id into it's components
            bikeTemp = {type: split[0], letter: [split[1]], rack: [(split[2] ? true : false)]};
            bikeList.push(bikeTemp); //adding the bike to the list
         }
         storeObject(id, bikeList);                 //storing the list
         sheet.getRange(letter + "2:" + letter + String(i.toFixed(0))).clear();
         }
       } else {  //TODO else if checkout mode, checkout bike && ignore toggle then this vv else
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
  return JSON.parse((b = PropertiesService.getScriptProperties().getProperty(name)) === undefined? null:b);
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
function getHMTL(name) {
    return HtmlService.createHtmlOutputFromFile(name).getContent();
}
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
  var exitRental;
  var string = new String();
  for(var  i = 0; i < ids.length; i++) {
    string = '';
    rental = retriveObject(ids[i])
    if(rental != null) {
      for(var b = 0; b < rental.length; b++)
          string += ((b == 0? ' ': ', ') + rental[b].type + rental[b].letter + (rental[b].rack ? '-R': ''))
     exitRental = {id: ids[i], bikes: string};
     rentals.push(exitRental);
  }
  }
  return rentals;
}
//functions related to user-facing GUI:
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
  var bike;
  var g = "";
  var idList = [];
  var bIdO = [];
  for(var i = 0; i < ids.length; i++) {
    bike = retriveObject(ids[i]);
    bikes = bikes.concat(bike);
  }
  for(var i = 0; i < bikes.length; i++) {
    g = guid();
    idList.push(g);
    bIdO.push(bikes[i]);
  }
  storeObject('splitRIds', ids);
  storeObject('splitBikes', {ids: idList, bikes: bIdO});
  var ui = SpreadsheetApp.getUi()
  var html = HtmlService.createHtmlOutputFromFile('split')
  ui.showModalDialog(html, 'Split bikes')
}
function getBikes() {  //is called in script to get the bikes in question
  var b = retriveObject('splitBikes');
  return b;
}
function createSplitRentals(rentals) { //performs the split
  var id1 = guid();                    //new ids for the new rentals
  var id2 = guid();
  var bIdO = retriveObject('splitBikes'); //retrive the bikes and their special ids
  var r1 = [[],[]];                        //new rental 1  && 2
  for(var i = 0; i < rentals.checked.length; i++ ) { //adding bikes to r1 using ids marked checked
    r1[0].push(bIdO.bikes[bIdO.ids.indexOf(rentals.checked[i])]);
  }
  for(var i = 0; i < rentals.unchecked.length; i++ ) {//adding bikes to r2 using ids marked unchecked
    r2[1].push(bIdO.bikes[bIdO.ids.indexOf(rentals.unchecked[i])]);
  }
  var idList = retriveObject('IDLIST');
  var oldIds = retriveObject('splitRIds');
  for(var i = 0; i < oldIds.length; i++) {
    idList[idList.indexOf(oldIds[i])] = 'DELETE';
    PropertiesService.getScriptProperties().deleteProperty(oldIds[i]);
  } 
  PropertiesService.getScriptProperties().deleteProperty('splitBikes');

  idList = idList.filter(function(n){return n != 'DELETE'});
  idList.push(id1);
  storeObject(id1, r1[0]);
  if(r1[1].length !== 0) {
    idList.push(id2);
    storeObject(id2, r1[1]);
  }
  storeObject('IDLIST', idList);
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
    if (SpreadsheetApp.getActiveSheet().getName() !== "input") {
      rental.activate();
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
  onOpen();
}
function combineRentalBikes(bikes) {
  var cbikes = [];
  var duplicate = false;
  for(var i = 0; i < bikes.length; i ++) {
    for(var j = 0; j < cbikes.length && !duplicate; j++) {
      if(cbikes[j].type === bikes[i].type) {
        duplicate = true;
        cbikes[j].letter.push(bikes[i].letter[0]);
        cbikes[j].rack.push(bikes[i].rack[0]);
      }
    }
    if(duplicate === false)
      cbikes.push(bikes[i]);
    duplicate = false;
  }
  return cbikes;
}
function findPotential(bike, name, startDate, endDate, hasRez) //desired bike, name on rental/rez, endDate(startDate is assumed to be today)
{ 
  var bikes = retriveObject(bike.type);                    //retriving potential area w/o rack
  var wRack = retriveObject(bike.type + "R");              //retriving potential area w/ rack  
  var rackIndex = -1;  
  if(bikes === null && wRack === null) {
    return ["Conflict"]
  } else if (bikes === null && wRack !== null) {
    bikes = wRack;
  } else {  //if the bike must have rack and non rack options, note where racked bikes start and concatenate
    rackIndex = bikes.length
    bikes = bikes.concat(wRack);
  }
  var startID = findColumn(startDate);
  var endID = findColumn(endDate);
  if(startID !== -1) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('rentals');
    var nArea = sheet.getRange(startID + bikes[0] + ':' + endID +  bikes[bikes.length - 1]);
    var rArea = false;
    var rvals = false;
    if(wRack !== null && rackIndex !== -1) {
      rArea = sheet.getRange(startID + bikes[rackIndex] + ':' + endID + bikes[bikes.length - 1]);
      rvals = rArea.getValues();
    }
    var nvals = nArea.getValues();
    var vals = nvals;
    var row;
    var unused = true;
    var o = 0, d = 0;
    var options = [];
    var found = false;
    var regex;
    var length;
    if (hasRez) {
      var rez = false;
      for(var b = 0; b < bike.letter.length; b++) {
        rez = false;
        found = false;
        o = (bike.rack[b] ? rackIndex : 0 );
        regex = new RegExp('^' + bike.letter[b] + ':.*' + '$');
        for(; o < vals.length && unused; o++) { // while more to check and && rez not found
          rez = true;
          for(d = 0; d < vals[o].length && rez; d++) {  //while more to check && rez is found
            if (!(vals[o][d] === name))  //if cell isn't a rez, set to false
            rez = false;
            if(!(vals[o][d] === "") && (vals[o][d].match(regex))) {
              unused = false;
            }
          }
          if(rez === true && unused && options.indexOf(o) === -1) {
            options.push(o);
            found = true;
          }
        }
        if(!found) {
          options.push("Conflict");
        } else if (!unused) {
          options.pop();
          options.push("Conflict");
        }
      }
    } else {
      var found = false;
      for(var b = 0; b < bike.letter.length; b++) {
        regex = new RegExp('^' + bike.letter[b] + ':.*' + '$');
        flag = false;
        found = false;
        o = (bike.rack[b] ? rackIndex : 0 );
        for(; o < vals.length && unused; o++) { // while more to check and && bike's letter hasn't been spotted
          flag = true;
          for(d = 0; d < vals[o].length && flag; d++) {  //while more to check && the cells are empty, keep checking row
            if (!(vals[o][d] === "")) { //if cell isn't empty , set to false
              flag = false;
              if (vals[o][d].match(regex)) {
                unused = false;
              }
            }
          }
          if(flag === true && !found && unused && options.indexOf(o) === -1) { //if the current row works, and a row hasn't been picked yet
            options.push(o);
            found = true;
          } else {          }
        }
        if(!found) {
          options.push("Conflict");
        } else if (!unused) {
          options.pop();
          options.push("Conflict");
        }
      }
    }
    for(var c = 0; c < options.length; c++) {
    }
    var chosenArea = [];
    for(var q = 0; q < options.length; q++) {
      if(options[q] !== "Conflict") {
      chosenArea.push(sheet.getRange(startID + bikes[options[q]] + ':' + endID + bikes[options[q]]));
      } else {
        chosenArea.push("Conflict")
      }
    }
    return chosenArea;
  }
  return ["Conflict"];
}
function inputBikes(name, sdate, edate, bikes, hasRez) {
  var endDate = new Date();
  var startDate = new Date();
  endDate.setMonth(parseInt(edate.split('-')[1]) - 1);
  endDate.setDate(edate.split('-')[2]);
  startDate.setMonth(parseInt(sdate.split('-')[1]) - 1);
  startDate.setDate(sdate.split('-')[2]);
  var regex1 = new RegExp('^.*R$');
  for(var i = 0; i < bikes.length; i++) {
    if (regex1.test(bikes[i].type)) {
      bikes[i].type = bikes[i].type.substr(0,bikes[i].type.length - 1);
      bikes[i].rack[0] = true;
    }
  }
  bikes = combineRentalBikes(bikes);
  var x = [];  //holds ranges for each bike
  var conflicts = []; //holds conflicts
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("rentals");
  for(var i = 0; i < bikes.length; i++) {
    x[i] = findPotential(bikes[i], name, startDate, endDate, hasRez);
    while (x[i].indexOf("Conflict") !== -1) {
      conflicts.push(bikes[i].type + bikes[i].letter[x[i].indexOf("Conflict")] + (bikes[i].rack[x[i].indexOf("Conflict")] ? "R" : ""));
      x[i].splice(x[i].indexOf("Conflict"), 1, "X");
    }
  }
  if (conflicts.length == 0) {
    for(var i = 0; i < x.length; i ++) {
      for(var b = 0; b < x[i].length; b++) 
        x[i][b].setValue(bikes[i].letter[b] + ":" + name);
    }
    return true;
  } else {
   var ui = SpreadsheetApp.getUi();
   var string = new String();
   conflicts.forEach(function(element){
               string += (" " + element);
             })
   ui.alert("Conflicts with bike" + (conflicts.length > 1? "s":"") + ":" + string)
   return false;
  }
}
function finishRental(name, sdate, edate, id, hasRez) { ///finishes the rental with the given info
  if(sdate === null)
    sdate = new Date();
  var endDate = new Date();
  endDate.setMonth(parseInt(edate.split('-')[1]) - 1)
  endDate.setDate(edate.split('-')[2])
  var x = [];  //holds ranges for each bike
  var conflicts = []; //holds conflicts
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("rentals")
  var bikes = []; //holds bike objects
  for(var i = 0; i < id.length; i++) {
    bikes.push.apply(bikes , retriveObject(id[i]));
  }
  bikes = combineRentalBikes(bikes);
  for(var i = 0; i < bikes.length; i++) {
    x[i] = findPotential(bikes[i], name, sdate, endDate, hasRez);
    while (x[i].indexOf("Conflict") !== -1) {
      conflicts.push(bikes[i].type + bikes[i].letter[x[i].indexOf("Conflict")] + (bikes[i].rack[x[i].indexOf("Conflict")] ? "R" : ""));
      x[i].splice(x[i].indexOf("Conflict"), 1, "X");
    }
  }
  if (conflicts.length == 0) {
    for(var i = 0; i < x.length; i ++) {
      for(var b = 0; b < x[i].length; b++) 
        x[i][b].setValue(bikes[i].letter[b] + ":" + name);
    }
    var idList = retriveObject('IDLIST');
    for(var i = 0; i < id.length; i++) {
      PropertiesService.getScriptProperties().deleteProperty(id[i]);
      idList[idList.indexOf(id[i])] = 'DELETE';
    }
    idList = idList.filter(function(n){return n != 'DELETE'});
    storeObject('IDLIST', idList)
    return true;
  } else {
   var ui = SpreadsheetApp.getUi();
   var string = new String();
   conflicts.forEach(function(element){
               string += (" " + element);
             })
   ui.alert("Conflicts with bike" + (conflicts.length > 1? "s":"") + ":" + string)
   return false;
  }
}
function finishRez(name, sDate, eDate, bikeStrings) {
  var startDate = new Date();
  var endDate = new Date();
  endDate.setMonth(parseInt(eDate.split('-')[1]) - 1);
  endDate.setDate(eDate.split('-')[2]);
  startDate.setMonth(parseInt(sDate.split('-')[1]) - 1);
  startDate.setDate(sDate.split('-')[2]);
  var bikes = [];
  var rack;
  var regex1 = new RegExp('^.*R$');
  for(var i = 0; i < bikeStrings.length; i++) {
    rack = regex1.test(bikeStrings[i]);
    if (rack)
      bikeStrings[i] = bikeStrings[i].substr(0,bikeStrings[i].length - 1);
    bikes.push({type:  bikeStrings[i], letter: [""], rack: [rack]});
  }
  bikes = combineRentalBikes(bikes);
  var x = [], conflicts = [];
  for(var i = 0; i < bikes.length; i++) {
    x[i] = findPotential(bikes[i], name, startDate, endDate, false);
    while (x[i].indexOf("Conflict") !== -1) {
      conflicts.push(bikes[i].type + bikes[i].letter[x[i].indexOf("Conflict")] + (bikes[i].rack[x[i].indexOf("Conflict")] ? "R" : ""));
      x[i].splice(x[i].indexOf("Conflict"), 1, "X");
      w++;
    }
  }
  if (conflicts.length == 0) {
    for(var i = 0; i < x.length; i ++) {
      for(var b = 0; b < x.length; b ++)
        x[i][b].setValue(name);
    }
    return true;
  } else {
   var ui = SpreadsheetApp.getUi()
   var string = new String();
   conflicts.forEach(function(element){
               string += (" " + element);
             })
   ui.alert("Conflicts with bike" + (conflicts.length > 1? "s":"") + ":" + string)
   return false;
  }
}
# SWCRentalSheets
Rental Sheet GUI/backend using GAS
## How to create sheet
Make a copy of this [Demo Sheet](https://docs.google.com/spreadsheets/d/1aCLgKzn3c1kc_lLb4aoxDrGMwyWGG4-88-tAvaLwpHY/edit?usp=sharing).
Under "Rental Tools" select "Hard Reset", then authorize the script to run (on the "This app isn't verified" page click advanced, then "go to Rental Script", then click "allow").
There you go, you have a working sheet!
## How to set up sheet
If you want to be able to stay up do date with this repo, you'll need to use clasp to clone the script. In the spreadsheet, go to the dropdown Tools -> Script Editor. In a new directory clone this repo using `git clone https://github.com/dac1927/SWCRentalSheets.git`. In the Script editor, go to Project Properites and copy the value next to Script ID. Then in the same directory where you ran git clone, run `clasp clone <Script ID>`
## How to use
### How to create barcodes
Make a copy of this [Bike counts sheet](https://docs.google.com/spreadsheets/d/1jW1Hz1jzbLHGpmWtI6gAdNBklT3NDX1-owTGyz8Q_dg/edit?usp=sharing) and enter bikes there, then if you want to rearrange them to save paper, copy barcodes generated in the 'barcode' tab, and paste them(paste special -> values only) into a different sheet so you can rearrange them before printing them off.
### Rental Form
This is a manual method of entering rentals (sans scanner), which requires you to enter the bike's number.
### Rez Form
This is a form to enter Rental Reservations.
### Scanner
Scan the 
### Rental tools
This is how you finish rentals scanned with scanner.
## Troubleshooting
## How to open an Issue
Go to 'Isues' tab above this README. Tell me what the issue is and steps for me to reproduce- what were you trying to do when you ran into the issue?

## Default Printer Changer

With Default Printer Changer can change the default printer of remote computer doing api requests


================================================================================

## Resources
* [NodeJS](https://nodejs.org/es/download/)
* [Python 2.7.16](https://www.python.org/downloads/release/python-2716/)
* [Printer Module](https://www.npmjs.com/package/printer)
* [Electron Module](https://www.npmjs.com/package/electron)
* [Electron-builder Module](https://www.npmjs.com/package/electron-builder)
* [Node-gyp Module](https://www.npmjs.com/package/node-gyp)
* [GitHub Repository](https://github.com/TheCruZ/printer_service)


================================================================================
## Installation

	In linux, the config file (.env) go with the app in the same folder
		Warning: Linux need lang folder with the app too
		
	In Windows the config file go in the installation folder
	In mac the config file go in the package->Contents/.env
	
	In firefox need to do this:
		1.- In about:config set print.save_print_settings from true to false
		2.- In about:config set the print_printer to empty
		
	In chrome dont work, have his own default printers

================================================================================
## Development Instructions


### Development Enviroment Requirements

* NodeJS
* Python 2.7.16
* Visual Studio Tools
* Node module printer
* Node module electron
* Node module electron-builder
* Node module node-gyp


### Building the electron file

	Only In Linux:
		sudo apt-get install g++
		sudo apt-get install libcups2-dev
		sudo apt-get install build-essential clang libdbus-1-dev libgtk-3-dev \
						   libnotify-dev libgnome-keyring-dev libgconf2-dev \
						   libasound2-dev libcap-dev libcups2-dev libxtst-dev \
						   libxss1 libnss3-dev gcc-multilib g++-multilib curl \
						   gperf bison python-dbusmock

	npm install -g node-gyp
	#Printer require python and other visual studio things
	#In windows 10 install from powershell and not from normal cmd
	npm install printer --msvs_version=2013
	npm install electron-packager --save-dev
	npm install electron-builder -g
	npm install electron
	build

================================================================================
## API

### getprinters
Description:
Give you a JSEND response with status and data with the name list of printers

Input:

- NONE

Output:

- {"status": 200,"data": ["Printer 1","Printer 2","Printer 3",...]}
       
### setprinter
Description:
Set default printer of the system

Input:

- Printer id of the config, Example: 1

Output:

- {"status": 200,"data": "response menssage"}

### test
Description:
Help you to know if the server is running

Input:

- NONE

Output:

- {"status": 200,"data": ["Printer 1","Printer 2","Printer 3",...]}

## .env config file example:
PORT=3333
PRINTER_1=PDF24 PDF
PRINTER_2=OneNote
LANG=lang_es.cfg
# Printer_server

With printer service can change the default printer of remote computer doing api requests

## How to build

	In linux:
	```bash
		sudo apt-get install g++
		sudo apt-get install libcups2-dev
		sudo apt-get install build-essential clang libdbus-1-dev libgtk-3-dev \
						   libnotify-dev libgnome-keyring-dev libgconf2-dev \
						   libasound2-dev libcap-dev libcups2-dev libxtst-dev \
						   libxss1 libnss3-dev gcc-multilib g++-multilib curl \
						   gperf bison python-dbusmock
	```

	```cmd
	npm install -g node-gyp
	#Printer require python and other visual studio things
	#In windows 10 install from powershell and not from normal cmd
	npm install printer --msvs_version=2013
	npm install electron-packager --save-dev
	npm install electron-builder -g
	npm install electron
	build
	```

## How to use
	In linux, the config file (.env) go with the app in the same folder
		Warning: Linux need lang folder with the app too
		
	In Windows the config file go in the installation folder
	In mac the config file go in the package->Contents/.env
	
	In firefox need to do this:
		1.- In about:config set print.save_print_settings from true to false
		2.- In about:config set the print_printer to empty
		
	In chrome dont work, have his own default printers

## API
	localhost:port/api/v1/

	COMMAND			METHOD		PARAMS EXAMPLE		RESPONSE EXAMPLE
	getprinters		GET			NONE				{"status": 200,"data": ["OneNote","PDF24 Fax","PDF24 PDF","Microsoft XPS Document Writer","Microsoft Print to PDF","Fax"]}
	test			GET			NONE				{"status": 200,"data": ["OneNote","PDF24 Fax","PDF24 PDF","Microsoft XPS Document Writer","Microsoft Print to PDF","Fax"]}
	setprinter		POST		1					{"status": 200,"data": "Default printer changed"}


.env config file example:
`
#Defalt port 3333, you can set it here
PORT=3333

#Printers, you can add any amount that you want with PRINTER_$NUMBER=$NAME
PRINTER_1=PDF24 PDF
PRINTER_2=OneNote

#Lang for the response messages
LANG=lang_es.cfg
`
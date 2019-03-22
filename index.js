var http = require('http');
var fs = require('fs');
var url = require('url');
var printer = require('printer');
const { exec } = require('child_process');

//config app path for mac os
var baseP=".";
if (process.platform === "darwin"){
	baseP= __dirname;
	baseP= baseP.substring(0,baseP.lastIndexOf("/"));
	baseP= baseP.substring(0,baseP.lastIndexOf("/"));
}

//reading config
var config = getConfig();
if (config.port==null){
   config.port = 3333;//default port
}

//lang works
if (config.lang==null){
   config.lang = "lang_en.cfg";//default lang
}
var textData=[];

try{
   textData=fs.readFileSync(baseP+"/lang/"+config.lang,"utf8");
   if (textData.includes("\n")){
      textData=textData.replace("\r\n","\n");
      textData=textData.split("\n");
   }
   else{
      textData=[textData];
   }
}
catch(e){
   throw new Error('Can\'t load any language! path:'+baseP+"/lang/"+config.lang+' more info: '+e.message);
}

startPrintServer(config.port);

//--------------GETS------------------------------

//read the config
function getConfig(){
   var data = "";
   try{
      data = fs.readFileSync(baseP+"/.env","utf8")
   }
   catch(err){
      return {};
   }
   var conf={};
   if (data.includes("\n")){
      data=data.replace("\r\n","\n");
      data=data.split("\n");
      for(var i = 0;i<data.length;i++){
         procLine(conf, data[i]);
      }
      return conf;
   }
   else{
      procLine(conf, data);
   }
   return conf;
}

//get message from actual loaded translation file
function getMessage(name){
   for(var i = 0;i<textData.length;i++){
      if (textData[i].startsWith(name) && textData[i].indexOf("=",name.length)>=0){
         return textData[i].substring(textData[i].indexOf("=",name.length)+1);
      }
   }
   return "Unknown message "+name;
}

//get array of printers names
function getPrintersNameList(){
   let printers = printer.getPrinters();
   var names = [];
	if (printers.length==0){
		return names;
   }
   
	for (var i = 0;i<printers.length;i++){
      names.push(printers[i].name);
	}
	return names;
}

//get printer by his name
function getPrinterByName(name){
	let printers = printer.getPrinters();

	if (printers.length==0){
		return null;
	}

	for (var i = 0;i<printers.length;i++){
		if (printers[i].name==name){
			return printers[i];
		}
	}
	return null;
}

//get printer by his id in the config
function getPrinterById(id){
   if (config.printers==null || config.printers.length==0){
      return null;
   }

	for (var i = 0;i<config.printers.length;i++){
		if (config.printers[i].id==id){
			return getPrinterByName(config.printers[i].name);
		}
   }
   return null;
}

//--------------------Funcs---------------------
//start http listener with the url calls
function startPrintServer(port){
   http.createServer( function (request, response) {
      //get request query data
      var url_parts = url.parse(request.url,true);
      if (url_parts.pathname.toLowerCase().startsWith("/api/v1/")){
         var command = url_parts.pathname.substring(8);
         switch(request.method){
            case "GET":
               if (command.startsWith("getprinters") || command.startsWith("test")){
                  doResponse(response, 200, getPrintersNameList());
               }
               else{
                  doResponse(response,404,null);
               }
               break;
            case "POST":
               if (command.startsWith("setprinter")){
                  let body = '';
                  request.on('data', chunk => {
                     body += chunk.toString();
                  });
                  request.on('end', () => {
                     var printer_id = parseInt(body);
                     if (printer_id==null){
                        doResponse(response,200,getMessage("IDNOTFOUND"));
                        return;
                     }
                     setPrinter(printer_id,function(code){
                        switch(code){
                           case 0:
                              doResponse(response,200,getMessage("CHANGED"));
                              break;
                           case -1:
                              doResponse(response,200,getMessage("CANNOTSAVECONFIG"));
                              break;
                           case -2:
                              doResponse(response,200,getMessage("IDNOTFOUND"));
                              break;
                           default:
                              doResponse(response,404,null);
                        }
                     });
                  });
               }
               else{
                  doResponse(response,404,null);
               }
               break;
            case "PUT":
               doResponse(response,404,null);
               break;
            case "DELETE":
               doResponse(response,404,null);
               break;
            default:
               doResponse(response,404,null);
         }
      }
      else{
         doResponse(response,404,null);
      }
   }).listen(port);
}

//finish one response with the given data
function doResponse(responseObj,status,content){

   responseObj.writeHead(status, {'Content-Type': 'text/html'});
   if (status!=404){
      var res = {};
      res.status = status;
      res.data = content;
      responseObj.write(JSON.stringify(res));
   }
   responseObj.end();
}

//set printer data by id in the config
function setPrinter(id,cb){
   
   if (config.printers==null){
      cb(-2);
      return;
   }
   else{
      var prin = getPrinterById(id);
      if (getPrinterById(id) == null){
         cb(-2);
         return;
      }
      else{
         if (process.platform === "win32"){
            exec("reg add \"HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows\" /v \"LegacyDefaultPrinterMode\" /t \"REG_DWORD\" /d 1 /f",  (err, stdout, stderr) => {
               if (err) {
                  cb(-1);
               }
               else{
                  exec('RUNDLL32 PRINTUI.DLL,PrintUIEntry /y /q /n "'+prin.name+'"', (err, stdout, stderr) => {
                     if (err) {
                        cb(-1);
                     }
                     else{
                        cb(0);
                     }
                  });
               }
             });
         }
         else if (process.platform === "darwin"){
            exec('defaults write ~/Library/Preferences/org.cups.PrintingPrefs.plist UseLastPrinter -bool FALSE', (err, stdout, stderr) => {
               if (err) {
                  cb(-1);
               }
               else{
                  exec('lpoptions -d '+prin.name, (err, stdout, stderr) => {
                     if (err) {
                        cb(-1);
                     }
                     else{
                        cb(0);
                     }
                  });
               }
            });
         }
         else{
            exec('lpoptions -d '+prin.name, (err, stdout, stderr) => {
               if (err) {
                  cb(-1);
                  return;
               }
               else{
                  cb(0);
                  return;
               }
             });
         }
      }
   }
}

//read line of text about the config and edit the object by reference
function procLine(conf, line){
   if (line.startsWith("PORT") && line.indexOf("=","PORT".length)>=0){
      var tmp = line.substring(line.indexOf("=","PORT".length)+1);
      conf.port = tmp.trim();
   }
   else if (line.startsWith("LANG") && line.indexOf("=","LANG".length)>=0){
      var tmp = line.substring(line.indexOf("=","LANG".length)+1);
      conf.lang = tmp.trim();
   }
   else if (line.startsWith("PRINTER_") && line.indexOf("=","PRINTER_".length)>=0){
      var id = parseInt(line.substring("PRINTER_".length,line.indexOf("=","PRINTER_".length)).trim());
      if (id==null){
         return;
      }
      var name = line.substring(line.indexOf("=","PRINTER_".length)+1).trim();
      if (conf.printers==null){
         conf.printers=[];
      }
      conf.printers.push({"id":id,"name":name});
   }
}
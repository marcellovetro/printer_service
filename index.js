var http = require('http');
var fs = require('fs');
var url = require('url');
var ippPrinter = require('ipp');
var printer = require('printer');
var pdfkit = require('pdfkit');
var mime = require('mime');

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
   textData=fs.readFileSync("./lang/"+config.lang,"utf8");
   if (textData.includes("\n")){
      textData=textData.replace("\r\n","\n");
      textData=textData.split("\n");
   }
   else{
      textData=[textData];
   }
}
catch(e){
   throw e;
}




startPrintServer(config.port);


//--------------GETS------------------------------

//read the config
function getConfig(){
   var data = "";
   try{
      data = fs.readFileSync(".env","utf8")
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

//get printer set as default on the system
function getSystemDefaultPrinter(){
	let printers = printer.getPrinters();

	if (printers.length==0){
		return null;
	}

	//get default system printer
	for (var i = 0;i<printers.length;i++){
		if (printers[i].isDefault){
			return printers[i].name;
		}
	}
	return null;
}

//get printer by his name
function getPrinterByName(name){
	let printers = printer.getPrinters();

	if (printers.length==0){
		return null;
	}

	//get default system printer
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

//get the first printer data in the config
function getFirstPrinter(){
   if (config.printers==null || config.printers.length==0){
      return null;
   }
   return config.printers[0];
}
//--------------------Funcs---------------------

function printFile(file,printer,cb){
   // Read the requested file content from file system
   fs.readFile(file, function (err, data) {
      if (err) {
         cb(-4);
		   return;
      } else {
         print(data,mime.getType(file),printer,cb)
      }
   });
}

function print(buffer,mimetype,printer_id,cb){
   //converting to correct format to print
   if(mimetype!="application/pdf" && mimetype!="text/plain"){
      if (mimetype==null){
         cb(-2);
         return;
      }
      else{
         cb(-1);
         return;
      }
   }

   var pri = getPrinterById(printer_id);
   if (pri==null){
      cb(-3);
      return;
   }
   console.log(pri);

   /*printer.printDirect({
      data: buffer,
      type: 'TEXT',
      success: function(id) {
         console.log('printed with id ' + id);
      },
      error: function(err) {
         console.error('error on printing: ' + err);
      }
   });*/
   cb(0);
   return;
   var p = ippPrinter.Printer(config.defaultPrinter);
   var msg = {
      "operation-attributes-tag": {
         "requesting-user-name": "test",
         "job-name": "test1",
         "document-format": mimetype
      },
      data: buffer
   };
   //imprime
   //p.execute("Print-Job", msg, function(err, res){
   //   if (err){
   //      cb(-5);
   //   }
   //      else{
            cb(0);
         return;
   //      }
   //   console.log(res);
   //});
}

//save the config
function saveConfig(config){
   try{
      var dataSave="";
      if (config.port!=null){
         dataSave+="PORT="+config.port+"\r\n";
      }
      if (config.testMessage!=null){
         dataSave+="TEST_MESSAGE="+config.testMessage+"\r\n";
      }
      if (config.lang!=null){
         dataSave+="LANG="+config.lang+"\r\n";
      }
      if (config.printers!=null){
         for(var i = 0;i<config.printers.length;i++){
            dataSave+="PRINTER_"+config.printers[i].id+"="+config.printers[i].name+"\r\n";
         }
      }
      fs.writeFileSync(".env",dataSave);
      return true;
   }
   catch(err){
      console.log(err);
      return false;
   }
}

//start http listener with the url calls
function startPrintServer(port){
   http.createServer( function (request, response) {
      //get request query data
      var url_parts = url.parse(request.url,true);
      if (url_parts.pathname.startsWith("/api/v1/")){
         var command = url_parts.pathname.substring(8);
         switch(request.method){
            case "GET":
               if (command.startsWith("getprinters") || command.startsWith("test")){
                  doResponse(response, 200, getPrintersNameList());
               }
               else if (command.startsWith("printtest")){
                  if (config.testMessage==null){
                     config.testMessage="Hello World!";
                  }
                  var pf=getFirstPrinter();
                  if (pf==null){
                     doResponse(response,404,null);
                  }
                  else{
                     print(config.testMessage,"text/plain",pf.id,function(code){
                        if (code==0){
                           doResponse(response,200,"OK")
                        }
                        else{
                           doResponse(response,303,"Error code: "+code)
                        }
                     });
                  }
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
                     var printers = JSON.parse(body).printers; //read printers to set
                     var data = [];
                     if (printers != null){
                        for (var i = 0;i<printers.length;i++){
                           let code = setPrinter(printers[i].id,printers[i].name); //set every printer
                           switch(code){
                              case 0:
                                 data.push({"id":printers[i].id,"status":getMessage("ADDED")});
                                 break;
                              case -1:
                                 data.push({"id":printers[i].id,"status":getMessage("CANNOTSAVECONFIG")});
                                 break;
                              case -2:
                                 data.push({"id":printers[i].id,"status":getMessage("NOTFOUND")});
                                 break;
                           }
                        }
                        doResponse(response,200,data);
                     }
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

//set printer data by id or add new printer to the config
function setPrinter(id,name){
   let printers = printer.getPrinters();

   if (printers.length==0){
      return -2;
   }

   if (config.printers==null){
      config.printers=[];
   }
   else{
      for (var i = 0;i<config.printers.length;i++){
         if (config.printers[i].id==id){
            config.printers.splice(i, 1);
            break;
         }
      }
   }

   var isSet=false;
   for (var i = 0;i<printers.length;i++){
      if (printers[i].name==name){
         isSet=true;
         config.printers.push({"id":id,"name":printers[i].name});
         break;
      }
   }
   if (!isSet){
      return -2;
   }

   if (saveConfig(config)){
      return 0;
   }
   return -1;
}

//read line of text about the config and edit the object by reference
function procLine(conf, line){
   if (line.startsWith("PORT") && line.indexOf("=","PORT".length)>=0){
      var tmp = line.substring(line.indexOf("=","PORT".length)+1);
      conf.port = tmp.trim();
   }
   else if (line.startsWith("TEST_MESSAGE") && line.indexOf("=","TEST_MESSAGE".length)>=0){
      var tmp = line.substring(line.indexOf("=","TEST_MESSAGE".length)+1);
      conf.testMessage = tmp.trim();
   }
   else if (line.startsWith("LANG") && line.indexOf("=","LANG".length)>=0){
      var tmp = line.substring(line.indexOf("=","LANG".length)+1);
      conf.lang = tmp.trim();
   }
   else if (line.startsWith("PRINTER_") && line.indexOf("=","PRINTER_".length)>=0){
      var id = line.substring("PRINTER_".length,line.indexOf("=","PRINTER_".length)).trim();
      var name = line.substring(line.indexOf("=","PRINTER_".length)+1).trim();
      if (conf.printers==null){
         conf.printers=[];
      }
      conf.printers.push({"id":parseInt(id),"name":name});
   }
}
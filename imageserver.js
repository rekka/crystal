var util = require("util"),  
    http = require("http"),
    url = require("url"),
    fs = require("fs");

util.puts(process.cwd());    
    
// start the server
http.createServer(function(request,response){  
    if (request.method == 'POST') {
        var parsedurl = url.parse(request.url, true);
        util.puts(util.inspect(parsedurl));
        
        var filename = parsedurl.pathname;
        
        // empty string
        var image = '';
        // receive data
        request.on('data', function (data) {
                image += data;
            });
        // data finished
        request.on('end', function () {
                // convert the data to binary
                var binary = new Buffer(image.split(',')[1], 'base64');
                // save the file
                fs.writeFile(process.cwd() + filename, binary, 'binary', function(err) {
                        if (err) {
                            util.puts('Error saving file (' + filename + '): ' + err); 
                        } else {
                            util.puts('File saved: ' + filename);
                        }
                    });
            });
        response.writeHeader(200, {"Content-Type": "text/plain"});  
        response.end("File saved");  
    }
}).listen(8080);  
util.puts("Server Running on 8080"); 
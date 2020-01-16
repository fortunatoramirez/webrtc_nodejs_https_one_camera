'use strict';

var express = require('express')
var fs = require('fs')
var https = require('https')
var path = require('path')

var os = require('os');
//var nodeStatic = require('node-static');
//var http = require('http');
var socketIO = require('socket.io');

/*
var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8080);
*/

const app = express()
const directoryToServe = 'client'
const port = 5002

app.use('/', express.static(path.join(__dirname, '..', directoryToServe)))

const httpsOptions = {
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt')),
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key'))
}

var svr = https.createServer(httpsOptions, app)
  .listen(port, function(){
    console.log(`Serving the ${directoryToServe}/ directory at https://localhost:${port}`)
})


var io = socketIO.listen(svr);
io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);https://192.168.180.13:5002/
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });


	/* comandos para controlar el brazo */
	socket.on('nuevo_mensaje', function(msg){
			//console.log(msg);
			socket.broadcast.emit('nuevo_mensaje',msg);
	});
	/* ********************************** */

  socket.on('bye', function(){
    console.log('received bye');
  });

});


var net = require('net');
var isocks = require('.');
var socks = isocks.createServer();

socks.on('connect', (socket, request, reply) => {
  var sockeT = net.createConnection(request, () => {
    console.log('connected', request);
    reply(isocks.success);
    socket.pipe(sockeT);
    sockeT.pipe(socket);
  })
  .on('error', () => reply(isocks.failure));
});

socks.listen(61080);
console.log("Socks5 server listening on ::61080");

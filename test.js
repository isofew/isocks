var net = require('net');
var isocks = require('.');
var socks = isocks.createServer();

socks.on('connect', (socket, request, reply) => {
  var sockeT = net.createConnection(request, () => {
    console.log('connected', request);
    clearTimeout(timer);
    socket.pipe(sockeT);
    sockeT.pipe(socket);
    reply();
  })
  .on('error', reply);
  var timer = setTimeout(() => {
    console.log('timeout', request);
    reply('timeout');
    socket.destroy();
  }, 3000);
});

socks.listen(61080);
console.log("Socks5 server listening on ::61080");

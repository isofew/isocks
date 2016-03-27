
var net = require('net');

var init = () => {
  var server = net.createServer();
  server.on('connection', (socket) => {
    socket.once('data', (buffer) => noauth(socket, buffer));
    socket.onRequest = (buffer) => request(server, socket, buffer);
  });
  return server;
};

var noauth = (socket, buffer) => {
  if (buffer[0] !== 5) {
    // only socksv5
    socket.end();
    return ;
  }
  var length = buffer[1];
  var ok = false;
  for (var i = 2; i < 2 + length; ++i) {
    if (buffer[i] === 0) {
      // client supports noauth method
      ok = true;
      break;
    }
  }
  if (ok) {
    socket.write(Buffer([5, 0]));
    socket.once('data', socket.onRequest);
  } else {
    // no acceptable methods
    socket.end(Buffer([5, 255]));
  }
};

var request = (server, socket, buffer) => {
  if (buffer[0] !== 5 || buffer[1] !== 1) {
    // only socksv5 connect command
    socket.end();
    return ;
  }
  var length = buffer.length;
  server.emit('connect', socket, {
    host: buffer.toString('utf8', 5, length - 2),
    port: buffer.readUInt16BE(length - 2),
    family: buffer[3] === 4 ? 6 : 4 // code 4 is for ipv6
  }, (code) => reply(socket, code));
};

var reply = (socket, code) => {
  try {
    socket.write(Buffer([5, code, 0, 1, 0, 0, 0, 0, 0, 80]));
  } catch (e) {
    // do nothing
  }
};

module.exports = {
  createServer: init,
  success: 0,
  failure: 1,
};
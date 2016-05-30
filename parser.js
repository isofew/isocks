var parser = {};

parser.ipv4 = {
  parse: (buffer, offset) => {
    offset = offset || 0;
    var array = [];
    for (var i = offset; i < offset + 4; ++i)
      array.push(buffer[i]);
    return array.join('.');
  },
  stringify: (ip) => {
    return Buffer(ip.split('.'));
  }
};

String.prototype.trimZero = function () {
  var str = this.replace(/0/g, ' ').trimLeft().replace(/ /g, '0');
  return str ? str : '0';
};
var zero = Buffer([0]);

parser.ipv6 = {
  parse: (buffer, offset) => {
    offset = offset || 0;
    var array = [];
    for (var i = offset; i < offset + 16; i += 2)
      array.push(buffer.toString('hex', i, i + 2).trimZero());
    var l, r, tl, tr;
    l = r = 0;
    for (var i = 0; i < array.length; ++i) {
      tl = i;
      while (array[i] === '0') ++i;
      tr = i;
      if (tr - tl > r - l) {
        r = tr;
        l = tl;
      }
    }
    if (r - l > 1)
      return array.slice(0, l).join(':') + '::' + array.slice(r).join(':');
    else
      return array.join(':');
  },
  stringify: (ip) => {
    var array = ip.split(':');
    var buffers = [];
    for (var i = 0; i < array.length; ++i) {
      if (array[i] !== '' || i === 0) {
        array[i] = '0'.repeat(4 - array[i].length) + array[i];
        buffers.push(Buffer(array[i], 'hex'));
      }
      else for (var j = 0; j < (9 - array.length) * 2; ++j)
        buffers.push(zero);
    }
    return Buffer.concat(buffers);
  }
};

parser.addr = { // socks5 scheme
  parse: (buffer, offset) => {
    offset = offset || 0;
    switch (buffer[offset]) {
      case 1: // ipv4
        return {
          length: 7,
          family: 4,
          host: parser.ipv4.parse(buffer, offset + 1),
          port: buffer.readUInt16BE(offset + 5)
        };
      case 4: // ipv6
        return {
          length: 19,
          family: 6,
          host: parser.ipv6.parse(buffer, offset + 1),
          port: buffer.readUInt16BE(offset + 17)
        };
      case 3: // domain name
        var namelen = buffer[offset + 1];
        return {
          length: namelen + 4,
          host: buffer.toString('utf8', offset + 2, offset + 2 + namelen),
          port: buffer.readUInt16BE(offset + 2 + namelen)
        };
    }
  },
  stringify: (addr) => {
    switch (addr.family) {
      case 4:
        return Buffer.concat([
          Buffer([1]),
          parser.ipv4.stringify(addr.host),
          Buffer([addr.port >> 8, addr.port & 255])
        ]);
      case 6:
        return Buffer.concat([
          Buffer([4]),
          parser.ipv6.stringify(addr.host),
          Buffer([addr.port >> 8, addr.port & 255])
        ]);
      default:
        return Buffer.concat([
          Buffer([3, addr.host.length]),
          Buffer(addr.host),
          Buffer([addr.port >> 8, addr.port & 255])
        ]);
    }
  }
};

parser._testsp = (parser, obj) => parser.parse( parser.stringify(obj) );

parser._testps = (parser, buf) => parser.stringify( parser.parse(buf) );

module.exports = parser;

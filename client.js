/* Client-side code for IDA project
 * RUN: $ node client.js <port_number>
 * Author: Bogdan Guna
 * Date: 08.12.2013
 */


// Variables
var net = require('net');              /* TCP connection */
var port = 8888;                       /* Server port number */
var host = '127.0.0.1';                /* Server IP address */
var address = host + ':' + port;       /* Server IP address + port number */
var input = process.stdin;             /* input */
var output = process.stdout;           /* output */
var socket = new net.Socket();         /* socket for TCP port */
var Buffer = require('buffer').Buffer; /* buffer for SEND method */
var dgram = require('dgram');          /* datagram - UDP */
var myPort = process.argv[2];          /* UDP port number */
var statemachine = require('child_process').fork('statemachine.js', ['client']);
var parser = require('child_process').fork('parser.js');
var sock = dgram.createSocket('udp4'); /* socket for UDP port */
sock.bind(myPort);
var myIP;


// Connecting the socket (TCP) to the Server
socket = net.connect(port, host, function() {
  myIP = socket.remoteAddress;

  output.write('Connected to server - ' + address + '\n');
  output.write('Date: ' + (new Date).toString() + '\n');
  output.write('You are listening to port: ' + myPort + '\n')
  socket.write('register ' + myPort + '\n');

  // Initiliase state of each socket
  sock.fd = 'undefined';

  // Handle input
  input.resume();
  input.on('data', function (data) {
    // Send messages to another node
    var res = data.toString().split(' ');
    if (res[0] === 'send' && !isNaN(res[2]) && res.length > 3) {
      var nodeIP = res[1];
      var nodePort = res[2];
      var msg = socket.remoteAddress + ':' + myPort + '>';
      for (i = 3; i < res.length; i++)
        msg += ' ' + res[i];
      var buffer = new Buffer(msg);
      sock.send(buffer, 0, buffer.length, nodePort, nodeIP.toString());
    }
    // Send messages to all nodes (broadcast)
    if (res[0] === 'send' && (res[1] === 'ALL' || res[1] === 'all')
        && res.length > 2) {
      var msg = '';
      for (i = 2; i < res.length; i++)
        msg += ' ' + res[i];
      msg = msg.trim();
      // Send a message that can be recognised by the server,
      // to retrieve the list of all clients and then broadcast a message.
      socket.write('ALL_' + msg);
    }
    // Load a specific protocol
    if (res[0] === 'load' && res.length === 2) {
      parser.send(res[1]);
    }

    // List of available commands
    command = data.toString().trim();
    switch (command) {
      case 'nodes':
        socket.write('nodes\n');
        break;
      case 'me':
        socket.write('me\n');
        break;
      case 'state':
        output.write(sock.fd + '\n');
        break;
      case 'commands':
        output.write('Available commands:\n');
        output.write('(1) nodes -- list of available nodes\n');
        output.write('(2) me -- displays your address\n');
        output.write('(3) state -- displays your state\n');
        output.write('(4) send <port> <msg> -- send message to another node\n');
        output.write('(5) send ALL <msg> -- send message to all nodes\n');
        output.write('(6) load <file> -- load protocol\n');
        output.write('(7) commands -- list of available commands\n');
        output.write('(8) close -- disconnect from server\n\n');
        break;
      case 'bla':
        //output.write('host: ' + server.gazda + '\n');
        break;
      case 'close':
        output.write('Disconnected from server\n');
        sock.close();
        process.exit(0);
        break;
      default:
        //output.write('Unknown command\n');
        break;
    } // switch
  })
});


// TO DO on closing socket
socket.on('end', function() {
  output.write('Disconnected from server\n');
  process.exit(0);
});


// TO DO on receving messages from other nodes
sock.on('message', function(buffer) {
  buffer = buffer.toString();
  output.write(buffer);
  statemachine.send(buffer);
});


// TO DO on receiving data from Server
socket.on('data', function(data) {
  data = data.toString().trim();
  var res = data.toString().trim().split('_');
  var nodes = []; /* array to store the ips and ports of all clients */
  // TO DO if first token received is nodes (in case of a broadcast)
  if (res[0] === 'nodes') {
    for (i = 1; i < res.length - 1; i++)
      nodes.push(res[i]);
    for ( i = 0; i < nodes.length; i++)
      nodes[i] = nodes[i].toString().split(':');
    console.log(res[res.length-1]);
    // The message to be broadcast: sender(broadcast)> message
    var msg = myIP + ':' + myPort + ' (broadcast)> ' + res[res.length - 1] + '\n';
    var buffer = new Buffer(msg);
    // Send the message to all clients to their UDP port
    for (i = 0; i < nodes.length; i++)
      sock.send(buffer, 0, buffer.length, nodes[i][1], nodes[i][0]);
  } else {
    // For any other data received from server, output it
    output.write(data + '\n');
  }
});


// TO DO on receiving messages from Child
statemachine.on('message', function(m) {
  console.log('Got message from child: ', m);
});


// TO DO on receiving messages from the parserr
parser.on('message', function(m) {
  console.log(m);
});
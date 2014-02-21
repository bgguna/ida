/* Server-side code for IDA project
 * RUN: $ node server.js
 * Author: Bogdan Guna
 * Date: 08.12.2013
 */


// Variables
var net = require('net');        /* TCP connection */
var port = 8888;                 /* Server port number */
var host = '192.168.11.6';       /* Server IP address */
var address = host + ':' + port; /* Server IP address + port number */
var nodes = [];                  /* array to store the address of each node */
var nodePorts = [];              /* array to store the UDP port of each node */
var input = process.stdin;       /* input */
var output = process.stdout;     /* output */


// Create the Server
var server = net.createServer(function (socket) {
  // Create a name for each node and push it to the node list.
  socket.name = socket.remoteAddress + ':';
  nodes.push(socket);


  // Welcoming nodes connecting to the server > ip address.
  socket.write('Your IP address: ' + socket.remoteAddress + '\n');

  // Giving responses to nodes' requests.
  socket.on('data', function (data) {
    // Read data as strings
    data = data.toString().trim();

    // CLIENT is asking for the details of connected nodes to the server
    if (data === 'nodes') {
      socket.write('List of connected nodes (' + nodePorts.length + '):');
      for (i = 0; i < nodePorts.length; i++)
        socket.write('(' + (i + 1) + ') ' + nodes[i].name + '\n');
    } // if

    // CLIENT is asking for IP and UDP port details
    if (data === 'me') {
      socket.write('You are ' + socket.name + '\n');
    }

    
    // Tokenize data received from CLIENT for broadcast
    broad_res = data.toString().trim().split('_');
    // CLIENT wants to send a broadcast message to all connected nodes
    if (broad_res[0] === 'ALL') {
      var nodeList = 'nodes';
      for (i = 0; i < nodes.length; i++) {
        nodeList += '_' + nodes[i].name;
      }
      nodeList += '_' + broad_res[1];
      nodeList = nodeList.trim();
      // send ['nodes', 'ip_address:port', 'msg'] to CLIENT
      socket.write(nodeList);
    }
    

    // Tokenize data received from CLIENT for register
    res = data.toString().trim().split(' ');
    // CLIENT is sending its UDP port to the server for it to register
    if (res[0] === 'register') {
      nodePorts.push(res[1]);
      socket.name += res[1];
      broadcast(socket.name + ' connected to server\n', socket);
    }
    
  });

  // TO DO on disconnecting nodes.
  socket.on('end', function() {
    nodes.splice(nodes.indexOf(socket), 1);
    nodePorts.splice(nodePorts.indexOf())
    broadcast(socket.name + ' disconnected from server\n');
    server.getConnections(function(err, count) {
      if (count === 0)
        output.write('\nNo connections to the server\n');
    });
  });

});


// Broadcast functionality
function broadcast (message, sender) {
  nodes.forEach(function (node) {
    if (node === sender)
      return;
     node.write(message);
  });
  output.write(message);
} // broadcast function


// Start the Server
server.listen(port, host);


// Listening to the Server
server.on('listening', function() {
  output.write('Server listening to ' + address + '\n');
  output.write('Date: ' + (new Date).toString() + '\n');
  output.write('\n--- Server ---\n\n');

  // TO DO on receiving input from user
  input.resume();
  input.on('data', function(data) {
    data = data.toString().trim();
    switch(data) {
      case 'nodes':
        output.write('Number of connected nodes: ' + nodes.length + '\n');
        output.write('List of connected nodes:\n');
        for (i = 0; i < nodes.length; i++)
          output.write('(' + (i + 1) + ') ' + nodes[i].name + ' - ' + nodes[i].fd + '\n');
        output.write('\n');
        break;
      case 'commands':
        output.write('Available commands:\n');
        output.write('(1) nodes -- list of available nodes\n');
        output.write('(2) commands -- list of available commands\n');
        output.write('(3) close -- disconnect from server\n\n');
        break;
      case 'close':
        output.write('Server disconnected\n');
        process.exit(0);
        break;
      default:
        output.write('Unknown command\n');
        break;
    } // switch
  });
});
/* Parser for IDA project
 * Author: Bogdan Guna
 * Date: 08.02.2014
 */


// Variables
fs = require('fs');          /* file system */
var input = process.stdin;   /* input */
var output = process.stdout; /* output */
var protocol;                /* store the name of the protocol */
var states = [];             /* store the states of the protocol */
var events = [];             /* store the events of the protocol */
var tokens = [];             /* tokens */
var statemachine = require('child_process').fork('statemachine.js', ['parser']);


// Function to create tokens (states and events) by reading a protocol
function tokenize (title) {
  file = title.toString().trim();
  output.write('\n');
  fs.readFile(file, 'utf8', function(err, data) {
    // Error handler
    if (err) {
      return console.log(err);
    }

    // Split the data read from the file
    data = split(data, '\n');

    // The name of the protocol
    protocol = data[0];

    // Separate the read data from the name of the protocol
    data = data.splice(2, data.length - 2);

    // Create tokens as states (even index) and events (odd index)
    for (i = 0; i < data.length; i++)
      tokens[i] = data[i];
    tokens = split(tokens, ' ^ ');
    tokens = split(tokens, ',');

    // Store the states and the events of the protocol in arrays
    for (i = 0; i < tokens.length; i++) {
      if (i % 2 === 0)
        states[i/2] = tokens[i];
      else
        events[(i-1)/2] = tokens[i];
    }

    // Print the name of the protocol
    output.write('Protocol ' + protocol + '\n\n');

    statemachine.send(states + ' ' + events);

    // Terminate program
    process.exit(0);
  });
}


// Function to split some 'data' by a 'rule'
function split(data, rule) {
  data = data.toString().trim().split(rule);
  for (i = 0; i < data.length; i++)
    if (data[i] === '\n')
      data.splice(i, 1);
  return data;
}


// TO DO on receiving messages (loading protocols) from Clients
process.on('message', function(m) {
  m = m.toString().trim();
  tokenize(m);
});


// TO DO on receiving messages from the Statemachine
statemachine.on('message', function(m) {
  console.log(m);
});
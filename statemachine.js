/* State Machine for IDA Project to handle 'state x event -> action' situations
 * Author: Bogdan Guna
 * Date: 15.02.2014
 */


// Variables
var acceptableStates = ['INITIATOR', 'IDLE', 'DONE', 'ASLEEP', 'AWAKE',
                        'FOLLOWER', 'LEADER']; /* store states */
var acceptableEvents = ['init', 'receive'];           /* store events */
var parsedStates = [];          /* store parsed states */
var parsedEvents = [];          /* store parsed events */
var state = 'UNKNOWN';          /* initial state of the state machine */
var events = require('events'); /* module of event emitters */
var eventEmitter = new events.EventEmitter(); /* event emitter */
var stateMachine = {};          /* state machine structure */
var input = process.stdin;      /* input */
var output = process.stdout;    /* output */


// Function to change the state into an acceptable state
function become(newState) {
  if (acceptableStates.indexOf(newState) === -1) {
    console.log(newState + ' is not an acceptable state');
    return;
  }
  state = newState;
}


// Function to split some 'data' by a 'rule'
function split(data, rule) {
  data = data.toString().trim().split(rule);
  for (i = 0; i < data.length; i++)
    if (data[i] === '\n')
      data.splice(i, 1);
  return data;
}


/*-------------------- STATE MACHINE --------------------*/
/*---------- STATUS ^ EVENT -> ACTION ----------*/
stateMachine['INITIATOR'] = {
  'init': function() {
    // send(message) to ALL
    become('IDLE'); // become DONE
  },
  'receive': function(message, sender) {
    // nil
  }
};

stateMachine['IDLE'] = {
  'init': function() {
    // nil
  },
  'receive': function(message, sender) {
    console.log('received from ' + sender + '> ' + message);
    // send(message) to ALL-sender
    become('DONE');
  }
};

stateMachine['DONE'] = {
  'init': function() {
    // nil
    process.exit();
  },
  'receive': function() {
    // nil
  }
};

stateMachine['ASLEEP'] = {
  'init': function() {
    // TODO
  },
  'receive': function() {
    // TODO
  }
};

stateMachine['AWAKE'] = {
  'init': function() {
    // TODO
  },
  'receive': function() {
    // TODO
  }
};

stateMachine['FOLLOWER'] = {
  'init': function() {
    // TODO
  },
  'receive': function() {
    // TODO
  }
};

stateMachine['LEADER'] = {
  'init': function() {
    // TODO
  },
  'receive': function() {
    // TODO
  }
};
/*--------------------------------------------------*/


// Event dispatcher
var dispatcher = function(ev) {
  var extraArgs = [];
  if (acceptableStates.indexOf(state) != -1) {
    for (i = 1; i < arguments.length; i++) 
      extraArgs.push(arguments[i]);
    if (!(ev in stateMachine[state])) {
      console.log('I am not expecting event <' + ev + '> in state ' + state);
      process.exit();
    }
    stateMachine[state][ev].apply(null, extraArgs);
  }
}

// Emit acceptable events
for (eventIndex in acceptableEvents) {
  var ev = acceptableEvents[eventIndex];
  ev.dispatcher = dispatcher;
  eventEmitter.on(ev, dispatcher);
}


eventEmitter.emit('init', 'init');


// TO DO on receiving messages
process.on('message', function(m) {
  // Receiving messages from PARSER (States and Events)
  if (process.argv[2] === 'parser') {
    m = split(m, ' ');
    m = split(m, ',');
    for (i = 0; i < m.length / 2; i++)
      parsedStates[i] = m[i];
    console.log(parsedStates);
    var j = m.length / 2;
    for (i = 0; i < m.length / 2; i++) {
      parsedEvents[i] = m[j];
      j++;
    }
    console.log(parsedEvents);
  }
  // Receiving messages from CLIENT
  if (process.argv[2] === 'client') {
    m = m.trim().split(' ');
    str = m.splice(1, m.length);
    var message = '';
    for (i = 0; i < str.length; i++)
      message += ' ' + str[i];
    message = message.trim();
    sender = m.splice(0, 1).toString().split('>').splice(0, 1);
    eventEmitter.emit('receive', 'receive', message, sender);
  }
});
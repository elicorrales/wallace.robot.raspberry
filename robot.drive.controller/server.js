'use strict';

const serial = require('serialport');
const readline = require('@serialport/parser-readline');

//const raspberry2arduinoBaud = 9600;
//const raspberry2arduinoBaud = 19200;
//const raspberry2arduinoBaud = 57600;
//const raspberry2arduinoBaud = 74880;
const raspberry2arduinoBaud = 115200;
//const raspberry2arduinoBaud = 230400;
//const raspberry2arduinoBaud = 250000;
//const raspberry2arduinoBaud = 500000;
//const raspberry2arduinoBaud = 1000000;
//const raspberry2arduinoBaud = 2000000;

const raspberry2redboardBaud = 9600;
//const raspberry2redboardBaud = 115200;


//////////////////////////////////////////////////////////////////////////////////////////
// arduino backside serial port related stuff
//////////////////////////////////////////////////////////////////////////////////////////
 
const arduinoPort = new serial('/dev/ttyACM0',{baudRate:raspberry2arduinoBaud,autoOpen:false});
const arduinoParser = arduinoPort.pipe(new readline({ delimiter: '\n'}));

arduinoPort.on('open', () => {
        console.log('serial arduinoPort open');
});

arduinoPort.on('close', () => {
        console.log('serial arduinoPort closed');
        reconnectToArduino();
});

arduinoPort.on('error', () => {
        console.log('serial arduinoPort error');
        reconnectToArduino();
});

const connectToArduino = () => {
    arduinoPort.open();
}

const reconnectToArduino = () => {
    console.log('ATTEMPT RE-CONNECT TO ARDUINO');
    error = 'ATTEMPT RE-CONNECT TO ARDUINO';
    setTimeout(() => {
        connectToArduino();
    }, 2000);
}

connectToArduino();


//////////////////////////////////////////////////////////////////////////////////////////
// redboard backside serial port related stuff
//////////////////////////////////////////////////////////////////////////////////////////


/*
const redboardPort = new serial('/dev/ttyUSB0',{baudRate:raspberry2redboardBaud,autoOpen:false});
const redboardParser = redboardPort.pipe(new readline({ delimiter: '\n'}));

redboardPort.on('open', () => {
        console.log('serial redboardPort open');
});

redboardPort.on('close', () => {
        console.log('serial redboardPort closed');
        reconnectToRedboard();
});

redboardPort.on('error', () => {
        console.log('serial redboardPort error');
        reconnectToRedboard();
});

const connectToRedboard = () => {
    redboardPort.open();
}

const reconnectToRedboard = () => {
    console.log('ATTEMPT RE-CONNECT TO RED BOARD');
    setTimeout(() => {
        connectToRedboard();
    }, 2000);
}

connectToRedboard();
*/


//////////////////////////////////////////////////////////////////////////////////////////
// arduino - robot - driving functions
//////////////////////////////////////////////////////////////////////////////////////////

let timestamp = 0;
let volts = '';
let amps1 = '';
let amps2 = '';
let temp = '';
let speed1 = '';
let speed2 = '';
let cmds = '';
let lastcmd = '';
let msg = '';
let error = '';
let spdcmd = '';
let version = '';
let cmdNum = '';
let dropped = '';
let thereIsError = false;
let commandWasSentToArduino = false;
let millisSinceLastResponseFromArduino = new Date().getTime();
let showArduinoResponseInServerTerminal = true;



let lastCommandSentToArduino = '';
let lastCommandSentTimestamp = 0;

const arduinoHistory = [];

const clearAllStatusVariables = () => {
    timestamp = 0;
    volts = '';
    amps1 = '';
    amps2 = '';
    temp = '';
    speed1 = '';
    speed2 = '';
    cmds = '';
    lastcmd = '';
    msg = '';
    error = '';
    spdcmd = '';
    cmdNum = '';
    dropped = '';
    version = '';
    thereIsError = false;
    commandWasSentToArduino = false;
}

arduinoParser.on('data', data => {

    //console.log(data);

    millisSinceLastResponseFromArduino = new Date().getTime();

    clearAllStatusVariables();


    timestamp = new Date().getTime();

/*
    arduinoHistory.push(data);

    if (arduinoHistory.length > 50) {
        arduinoHistory.shift();
    }
*/

    if (showArduinoResponseInServerTerminal) {
        console.log(data);
    }

    try {

        const result = JSON.parse(data);

        if (result.v !== undefined) {
            volts = result.v;
        }
        if (result.a1 !== undefined) {
            amps1 = result.a1;
        }
        if (result.a2 !== undefined) {
            amps2 = result.a2;
        }
        if (result.t !== undefined) {
            temp = result.t;
        }
        if (result.s1 !== undefined) {
            speed1 = result.s1;
        }
        if (result.s2 !== undefined) {
            speed2 = result.s2;
        }
        if (result.c !== undefined) {
            cmds = result.c;
        }
        if (result.d !== undefined) {
            dropped = result.d;
        } 
        if (result.l !== undefined) {
            lastcmd = result.l;
        }
        if (result.p1 !== undefined) {
            spdcmd = result.p1;
        }
        if (result.msg !== undefined) {
            msg = result.msg;
        }
        if (result.e !== undefined) {
            error = result.e;
            //thereIsError = true;
        } 
        if (result.version !== undefined) {
            version = result.version;
            console.log('VERSION VERSION'+version);
        }

        if (thereIsError) { console.log(result); }

    } catch (e) {
        //console.log(e);
        console.log('corrupted JSON response from Arduino' + data); 
        error = 'corrupted JSON response from Arduino:'+data;
    }

});
//////////////////////////////////////////////////////////////////////


const express = require('express');
const app = express();
app.use(express.json());
app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



//default handler
const rootHandler = (request, response) => {
    response.send('Requested /');
}
app.get('/', rootHandler);



///////handler to respond with any arduino status data///////////////////////////////////
const respondWithCollectedDataHandler = (request, response) => {
    response.send({
        timestamp,
        volts,
        amps1,
        amps2,
        temp,
        speed1,
        speed2,
        msg,
        cmds,
        spdcmd,
        dropped,
        lastcmd,
        error,
        version
    });
}
app.get('/nodejs/data', respondWithCollectedDataHandler);


///////handler to respond with history ///////////////////////////////////
const respondWithHistoryHandler = (request, response) => {
    response.send(arduinoHistory);
}




///////arduino command handler command code with gamepad/joystick handler//////////
const parseAndSendCommandToArduino = (path) => {


    commandWasSentToArduino = false;

    const tokens = path.split('/',10);
    console.log(tokens);
    let baseUri = '';
    let gotBaseUri = false;
    let apiStr = '';
    let gotApiStr = false;
    let cmd = '';
    let gotCmd = false;
    let gotParm1 = false;
    let parm1 =  '';
    let gotParm2 = false;
    let parm2 =  '';
    let gotParm3 = false;
    let parm3 =  '';
    for (let i=0;i<tokens.length;i++) {
        if (!gotBaseUri && tokens[i] != '' && tokens[i] === 'nodejs' || tokens[i] === 'arduino' || tokens[i] === 'gamepad') {
            baseUri = tokens[i]; gotBaseUri = true; continue;
        }
        if (!gotApiStr && tokens[i] != '' && tokens[i] === 'api' || tokens[i] === 'axes') {
            apiStr = tokens[i]; gotApiStr = true; continue;
        }
        if (!gotCmd && tokens[i] != '' && tokens[i] !== 'nodejs' && tokens[i] != 'arduino' && tokens[i] != 'api') {
            cmd = tokens[i]; gotCmd = true; continue;
        }
        if (!gotParm1 && tokens[i] != '' && tokens[i] !== 'nodejs' && tokens[i] != 'arduino' && tokens[i] != 'api') {
            parm1 = tokens[i]; gotParm1 = true; continue;
       }
        if (!gotParm2 && tokens[i] != '' && tokens[i] !== 'nodejs' && tokens[i] != 'arduino' && tokens[i] != 'api') {
            parm2 = tokens[i]; gotParm2 = true; continue;
        }
        if (!gotParm3 && tokens[i] != '' && tokens[i] !== 'nodejs' && tokens[i] != 'arduino' && tokens[i] != 'api') {
            parm3 = tokens[i]; gotParm3 = true; continue;
        }
    }


    let commandStringToSend = '';
    let myRandom = Math.floor(Math.random()*100);


    const now = new Date().getTime();

    let cmdUri = baseUri + '.' + apiStr + '.' + cmd;
    switch (cmdUri) {
        case 'nodejs.api.start.console.log.response' :
                showArduinoResponseInServerTerminal = true;
                console.log('Show Arduino response');
                return;
                break;
        case 'nodejs.api.stop.console.log.response' :
                showArduinoResponseInServerTerminal = false;
                return;
                break;
        case 'arduino.api.status.stop':
                cmdNum = 2;
                commandStringToSend = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'arduino.api.status.start':
                cmdNum = 3;
                commandStringToSend = '5 ' + cmdNum + ' ' + myRandom + ' ' + ( parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1) + 5) + ' ' + parm1;
                break;
        case 'arduino.api.move.timeout':
                cmdNum = 6;
                commandStringToSend = '5 ' + cmdNum + ' ' + myRandom + ' ' + ( parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1) + 5) + ' ' + parm1;
                break;
        case 'arduino.api.clr.usb.err':
                cmdNum = 4;
                commandStringToSend = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'arduino.api.clr.num.usb.cmds':
                cmdNum = 5;
                commandStringToSend = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'arduino.api.version':
                cmdNum = 20;
                commandStringToSend = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'arduino.api.status':
                cmdNum = 24;
                commandStringToSend = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'arduino.api.stop':
                cmdNum = 28;
                commandStringToSend = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'arduino.api.forward':
                if (thereIsError) { return; }
                cmdNum = 29;
                commandStringToSend = '5 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1) + 5) + ' ' + parm1;
                break;
        case 'arduino.api.backward':
                if (thereIsError) { return; }
                cmdNum = 32;
                commandStringToSend = '5 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1) + 5) + ' ' + parm1;
                break;
        case 'arduino.api.left':
                if (thereIsError) { return; }
                cmdNum = 33;
                commandStringToSend = '5 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1) + 5) + ' ' + parm1;
                break;
        case 'arduino.api.right':
                if (thereIsError) { return; }
                cmdNum = 34;
                commandStringToSend = '5 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1) + 5) + ' ' + parm1;
                break;

        default:
                throw 'Unknown command :' + cmdUri;
                break;
    }


    console.log('=========================================');
    console.log('COMMAND TO SEND : ' + commandStringToSend);
    console.log('=========================================');
    //return;
    commandWasSentToArduino = true;

    lastCommandSentToArduino = commandStringToSend;
    lastCommandSentTimestamp = new Date().getTime();

    //arduinoHistory.push({lastCommandSentToArduino,lastCommandSentTimestamp});
    //console.log(arduinoHistory);

    arduinoPort.write(commandStringToSend + '\n', e => {
        if (e) {
            error = 'Error sending data to arduino: ', e.message;
            console.log('Error sending data to arduino: ', e.message);
        } else {
            console.log(cmd + ': command \'',commandStringToSend,'\' sent to arduino');
        }
    });
}



///////arduino command handler/////////////////////////////////////////////////////
const commandHandler = (request, response) => {

    console.log('server log: commandHandler : ' + request.path);

    try {
        parseAndSendCommandToArduino(request.path);
        if (commandWasSentToArduino) {
            response.status(200).send('Cmd Sent To Arduino. You requested ' + request.path);
        } else {
            response.status(500).send('{\"error\":\"CMD NOT SENT TO ARDUINO: You requested ' + request.path + '\"}');
        }
    } catch (e) {
        response.status(500).send('{\"error\":\"Error: ' + e + ' : You requested ' + request.path + '\"}');
        error = 'Error: ' + e + ' requesting ' + request.path;
    }
}
app.get('/arduino/api/*', commandHandler);




///////node.js server command handler/////////////////////////////////////////////////////
const nodeJsCommandHandler = (request, response) => {

    console.log('server log: nodeJsCommandHandler: ' + request.path);


    if (request.path === '/nodejs/api/data') {
        respondWithCollectedDataHandler(request, response);
        return;
    }

    if (request.path === '/nodejs/api/history') {
        respondWithHistoryHandler(request, response);
        return;
    }

    try {
        parseAndSendCommandToArduino(request.path);
    } catch (e) {
        response.status(500).send('{\"error\":\"Error: ' + e + ' : You requested ' + request.path + '\"}');
        error = 'Error: ' + e + ' requesting ' + request.path;
    }
}
app.get('/nodejs/api/*', nodeJsCommandHandler);




//////////////////////////////////////////////////////////////////////
// remote USB gamepad related stuff
//////////////////////////////////////////////////////////////////////

/*
const processAxesValues = (data) => {
    const X = data.X;
    const Y = data.Y;

    //console.log(X,' ',Y);
  
    let command = 'gamepad/axes/';
    if (Math.abs(Y) > Math.abs(X)) {
        if (Y < 0) {
            //command = 'forwardresp/' + (-Y) + '/' + (-Y);
            command += 'forward/' + (-Y) + '/' + (-Y);
        } else if (Y > 0) {
            //command = 'backwardresp/' + Y + '/' + Y;
            command += 'backward/' + Y + '/' + Y;
        }
    } else if (Math.abs(Y) < Math.abs(X)) {
        if (X > 0) {
            //command = 'rightresp/' + X + '/' + X;
            command += 'right/' + X + '/' + X;
        } else if (X < 0) {
            //command = 'leftresp/' + (-X) + '/' + (-X);
            command += 'left/' + (-X) + '/' + (-X);
        }
    }


    let path = command;
    try {
        parseAndSendCommandToArduino(path);
    } catch (e) {
        console.log(e);
        error = e;
    }
}


//gamepad joystick axes handler
const joystickAxesHandler = (request, response) => {

    let now = new Date().getTime();

    if (now - millisSinceLastResponseFromArduino > 200) {
       response.status(500).send('{\"error\":\"ARDUINO is NOT RESPONDING\"}');
       return;
    }

    console.log('server log: ' + request.path);
    if (request.body !== undefined) {
        //console.log(request.body);
        processAxesValues(request.body);
    } else console.log('no request body');
    response.send(request.path);
}
app.post('/gamepad/axes/', joystickAxesHandler);
*/

app.listen(8084, () => {
    console.log('HTTP Raspberry Pi Server is Up at 8084');
});


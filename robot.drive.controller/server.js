'use strict';

const serial = require('serialport');
const readline = require('@serialport/parser-readline');

//const raspberry2arduinoBaud = 9600;
//const raspberry2arduinoBaud = 19200;
//const raspberry2arduinoBaud = 57600;
//const raspberry2arduinoBaud = 74880;
//const raspberry2arduinoBaud = 115200;
//const raspberry2arduinoBaud = 230400;
//const raspberry2arduinoBaud = 250000;
//const raspberry2arduinoBaud = 500000;
//const raspberry2arduinoBaud = 1000000;
const raspberry2arduinoBaud = 2000000;

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
let arduinoIsExpectedToRespond = false;

const clearAllStatusVariables = () => {
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
    arduinoIsExpectedToRespond = false;
}

arduinoParser.on('data', data => {

    clearAllStatusVariables();

    //console.log(data);
    try {
        const result = JSON.parse(data);
        //console.log(result);
        //
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
            console.log(data);
        error = e;
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



///////handler to respond with any collected data///////////////////////////////////
const respondWithCollectedDataHandler = (request, response) => {
    response.send({
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
app.get('/arduino/data', respondWithCollectedDataHandler);


///////arduino command handler command code with gamepad/joystick handler//////////
const parseAndSendCommandToArduino = (path) => {


    commandWasSentToArduino = false;
    arduinoIsExpectedToRespond = false;

    const tokens = path.split('/',10);
    console.log(tokens);
    let cmd = '';
    let gotCmd = false;
    let gotParm1 = false;
    let parm1 =  '';
    let gotParm2 = false;
    let parm2 =  '';
    let gotParm3 = false;
    let parm3 =  '';
    for (let i=0;i<tokens.length;i++) {
        if (!gotCmd && tokens[i] != '' && tokens[i] != 'arduino' && tokens[i] != 'api') {
            cmd = tokens[i]; gotCmd = true; continue;
        }
        if (!gotParm1 && tokens[i] != '' && tokens[i] != 'arduino' && tokens[i] != 'api') {
            parm1 = tokens[i]; gotParm1 = true; continue;
       }
        if (!gotParm2 && tokens[i] != '' && tokens[i] != 'arduino' && tokens[i] != 'api') {
            parm2 = tokens[i]; gotParm2 = true; continue;
        }
        if (!gotParm3 && tokens[i] != '' && tokens[i] != 'arduino' && tokens[i] != 'api') {
            parm3 = tokens[i]; gotParm3 = true; continue;
        }
    }


    console.log('cmd:',cmd,' p1:',parm1,' p2:',parm2,' p3:',parm3);
    let command = '';
    let myRandom = Math.floor(Math.random()*100);
    console.log('p1[', parm1, '] p2[', parm2, ']');
    let isFloatParm1  = (parm1 !== undefined ? parm1.includes('.') : false);
    let isFloatParm2  = (parm2 !== undefined ? parm2.includes('.') : false);
    let parm1ForSum = isFloatParm1 ? Math.floor(parseFloat(parm1)*1000) : parm1;
    let parm2ForSum = isFloatParm2 ? Math.floor(parseFloat(parm2)*1000) : parm2;
    console.log('p1f[',parm1ForSum, '] p2f[',parm2ForSum,']');


    const now = new Date().getTime();

    switch (cmd) {
        case 'help':
                cmdNum = 0;
                command = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'ack.cmds':
                cmdNum = 1;
                command = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'status.stop':
                cmdNum = 2;
                command = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'status.start':
                cmdNum = 3;
                command = '5 ' + cmdNum + ' ' + myRandom + ' ' + ( parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1ForSum) + 5) + ' ' + parm1;
                break;
        case 'move.timeout':
                cmdNum = 6;
                command = '5 ' + cmdNum + ' ' + myRandom + ' ' + ( parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1ForSum) + 5) + ' ' + parm1;
                break;
        case 'clr.usb.err':
                cmdNum = 4;
                command = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'clr.num.usb.cmds':
                cmdNum = 5;
                command = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'version':
                cmdNum = 20;
                command = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'status':
                cmdNum = 24;
                command = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'stop':
                cmdNum = 28;
                command = '4 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + 4);
                break;
        case 'forward':
                if (thereIsError) { return; }
                cmdNum = 29;
                command = '5 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1ForSum) + 5) + ' ' + parm1;
                spdcmd = parm1;
                break;
        case 'backward':
                if (thereIsError) { return; }
                cmdNum = 32;
                command = '5 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1ForSum) + 5) + ' ' + parm1;
                spdcmd = parm1;
                break;
        case 'left':
                if (thereIsError) { return; }
                cmdNum = 33;
                command = '5 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1ForSum) + 5) + ' ' + parm1;
                spdcmd = parm1;
                break;
        case 'right':
                if (thereIsError) { return; }
                cmdNum = 34;
                command = '5 ' + cmdNum + ' ' + myRandom + ' ' + (parseInt(cmdNum) + parseInt(myRandom) + parseInt(parm1ForSum) + 5) + ' ' + parm1;
                spdcmd = parm1;
                break;

        default:
                throw 'Unknown command :' + cmd;
                break;
    }


    console.log(command);
    //return;
    commandWasSentToArduino = true;
    arduinoPort.write(command + '\n', e => {
        if (e) {
            error = 'Error sending data to arduino: ', e.message;
            console.log('Error sending data to arduino: ', e.message);
        } else {
            console.log(cmd + ': command \'',command,'\' sent to arduino');
        }
    });
}



///////arduino command handler/////////////////////////////////////////////////////
const commandHandler = (request, response) => {

    console.log('server log: ' + request.path);

    try {
        parseAndSendCommandToArduino(request.path);
        if (commandWasSentToArduino) {
            response.status(200).send('Cmd Sent To Arduino. You requested ' + request.path);
        } else {
            response.status(500).send('CMD NOT SENT TO ARDUINO: You requested ' + request.path);
        }
    } catch (e) {
        response.status(500).send('Error: ' + e + '\n\nYou requested ' + request.path);
        error = 'Error: ' + e + ' requesting ' + request.path;
    }
}
app.get('/arduino/api/*', commandHandler);





//////////////////////////////////////////////////////////////////////
// remote USB gamepad related stuff
//////////////////////////////////////////////////////////////////////

const processAxesValues = (data) => {
    const X = data.X;
    const Y = data.Y;

    //console.log(X,' ',Y);
  
    let command = 'arduino/api/';
    if (Math.abs(Y) > Math.abs(X)) {
        if (Y < 0) {
            //command = 'forwardresp/' + (-Y) + '/' + (-Y);
            command = 'forward/' + (-Y) + '/' + (-Y);
        } else if (Y > 0) {
            //command = 'backwardresp/' + Y + '/' + Y;
            command = 'backward/' + Y + '/' + Y;
        }
    } else if (Math.abs(Y) < Math.abs(X)) {
        if (X > 0) {
            //command = 'rightresp/' + X + '/' + X;
            command = 'right/' + X + '/' + X;
        } else if (X < 0) {
            //command = 'leftresp/' + (-X) + '/' + (-X);
            command = 'left/' + (-X) + '/' + (-X);
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
    console.log('server log: ' + request.path);
    if (request.body !== undefined) {
        //console.log(request.body);
        processAxesValues(request.body);
    } else console.log('no request body');
    response.send(request.path);
}
app.post('/gamepad/axes/', joystickAxesHandler);


app.listen(8084, () => {
    console.log('HTTP Raspberry Pi Server is Up at 8084');
});


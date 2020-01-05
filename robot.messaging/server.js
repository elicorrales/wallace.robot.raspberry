'use strict';

const argv = require('yargs').argv;

const express = require('express');
const app = express();
app.use(express.json());
app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


const thisServerPort = 8085;

const clearAllStatusVariables = () => {
}



//default handler
const rootHandler = (request, response) => {
    response.send('Requested /');
}
app.get('/', rootHandler);



///////handler to respond with any arduino status data///////////////////////////////////
const respondWithCollectedDataHandler = (request, response) => {
    let dataToSend = {
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
    };
    if (isConnectedToArduino) { 
        console.log('client requrested data: ', JSON.stringify(dataToSend));
    }
    response.send(dataToSend);
}
app.get('/nodejs/data', respondWithCollectedDataHandler);




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
    let ackWaitTime = now - millisSinceLastCommandSentToArduino;

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
                commandStringToSend = processDriveCommand(ackWaitTime,29, cmd, myRandom, parm1, parm2);
                if (commandStringToSend === '') { return; }
                break;
        case 'arduino.api.backward':
                commandStringToSend = processDriveCommand(ackWaitTime,32, cmd, myRandom, parm1, parm2);
                if (commandStringToSend === '') { return; }
                break;
        case 'arduino.api.left':
                commandStringToSend = processDriveCommand(ackWaitTime,33, cmd, myRandom, parm1, parm2);
                if (commandStringToSend === '') { return; }
                break;
        case 'arduino.api.right':
                commandStringToSend = processDriveCommand(ackWaitTime,34, cmd, myRandom, parm1, parm2);
                if (commandStringToSend === '') { return; }
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
const arduinoApiCommandHandler = (request, response) => {

    console.log('client request: commandHandler : ' + request.path);

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
app.get('/arduino/api/*', arduinoApiCommandHandler);


///////arduino api NO command handler/////////////////////////////////////////////////////
const arduinoApiNoCommandHandler = (request, response) => {
    console.log('client request: commandHandler : ' + request.path);
    response.status(404).send('{\"error\":\"You requested ' + request.path + '. You need something after that.\"}');
}
app.get('/arduino/api', arduinoApiNoCommandHandler);


///////arduino NO command handler/////////////////////////////////////////////////////
const arduinoNoCommandHandler = (request, response) => {
    console.log('client request: commandHandler : ' + request.path);
    response.status(404).send('{\"error\":\"You requested ' + request.path + '. You need /api/blah.blah after that.\"}');
}
app.get('/arduino', arduinoNoCommandHandler);

///////node.js server command handler/////////////////////////////////////////////////////
const nodeJsCommandHandler = (request, response) => {

    console.log('client request: nodeJsCommandHandler: ' + request.path);


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


///////node.js api NO command handler/////////////////////////////////////////////////////
const nodeJsApiNoCommandHandler = (request, response) => {
    console.log('client request: commandHandler : ' + request.path);
    response.status(404).send('{\"error\":\"You requested ' + request.path + '. You need something after that.\"}');
}
app.get('/nodejs/api', nodeJsApiNoCommandHandler);

///////node.js NO command handler/////////////////////////////////////////////////////
const nodeJsNoCommandHandler = (request, response) => {

    console.log('client request: nodeJsCommandHandler : ' + request.path);

    response.status(404).send('{\"error\":\"You requested ' + request.path + '. You need /api/blah.blah after that.\"}');
}
app.get('/nodejs', nodeJsNoCommandHandler);


///////node.js bad/////////////////////////////////////////////////////
const nodeJsBad = (request, response) => {

    console.log('client request: nodeJsCommandHandler : ' + request.path);

    response.status(404).send('{\"error\":\"You requested ' + request.path + '. Did you mean /nodejs?\"}');
}
app.get('/node.js', nodeJsBad);





app.listen(thiServerPort, () => {
    console.log('HTTP Raspberry Pi Server is Up at ', thisServerPort);
});


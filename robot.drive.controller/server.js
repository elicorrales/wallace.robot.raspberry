'use strict';

//////////////////////////////////////////////////////////////////////
// arduino backside serial port related stuff
//////////////////////////////////////////////////////////////////////
const serial = require('serialport');
const readline = require('@serialport/parser-readline');
const port = new serial('/dev/ttyACM0', { baudRate: 115200, autoOpen: false });
const parser = port.pipe(new readline({ delimiter: '\n'}));

port.on('open', () => {
        console.log('serial port open');
});

port.on('close', () => {
        console.log('serial port closed');
        reconnectToArduino();
});

port.on('error', () => {
        console.log('serial port error');
        reconnectToArduino();
});

const connectToArduino = () => {

    port.open();

}

const reconnectToArduino = () => {
    console.log('ATTEMPT RE-CONNECT TO ARDUINO');
    setTimeout(() => {
        connectToArduino();
    }, 2000);
}

connectToArduino();

let volts = '';
let amps1 = '';
let amps2 = '';
let temp = '';
let speed1 = '';
let speed2 = '';
let cmds = '';
let last = '';
let msg = '';
let error = '';

parser.on('data', data => {
    //console.log(data);
    try {
        const result = JSON.parse(data);
        console.log(result);
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
        if (result.cmds !== undefined) {
            cmds = result.cmds;
        }
        if (result.last !== undefined) {
            last = result.last;
        }
        if (result.msg !== undefined) {
            msg = result.msg;
        }
        if (result.error !== undefined) {
            error = result.error;
        }
    } catch (error) {
            console.log(data);
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
        last,
        error
    });
}
app.get('/arduino/data', respondWithCollectedDataHandler);


///////arduino command handler command code with gamepad/joystick handler//////////
const parseAndSendCommandToArduino = (path) => {

    const tokens = path.split('/',10);
    //console.log(tokens);
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


    //console.log(cmd,' ',parm1,' ',parm2,' ',parm3);
    let command = '';
    const now = new Date().getTime();

    switch (cmd) {
        case 'help':
                command = '0'
                break;
/*
        case 'numcmds':
                command = '1';
                break;
*/
        case 'status':
                switch (parm1) {
                    case '':
                        command = '24';
                        break;
                    case 'stop':
                        command = '2';
                        break;
                    case 'start':
                        command = '3' + ' ' + parm2;
                        break;
                }
                break;
        case 'version':
                command = '20';
                break;
/*
        case 'amps':
                command = '22';
                break;
        case 'temp':
                command = '23';
                break;
        case 'speeds':
                command = '25';
                break;
            */
        case 'stop':
                command = '28';
                break;
        case 'forward':
                command = '29' + ' ' + parm1 + ' ' + parm2;
                break;
        case 'backward':
                command = '32' + ' ' + parm1 + ' ' + parm2;
                break;
        case 'left':
                command = '33' + ' ' + parm1 + ' ' + parm2;
                break;
        case 'right':
                command = '34' + ' ' + parm1 + ' ' + parm2;
                break;

        default:
                command = '28';
                break;
    }


    console.log(command);
    //return;
    port.write(command + '\n', error => {
        if (error) {
            console.log('Error sending data to arduino: ', error.message);
        } else {
            console.log('command \'',command,'\' sent to arduino');
        }
    });
}
///////arduino command handler/////////////////////////////////////////////////////
const commandHandler = (request, response) => {

    //console.log('server log: ' + request.path);

    parseAndSendCommandToArduino(request.path);

    response.status(200).send('You requested ' + request.path);
}
app.get('/arduino/api/*', commandHandler);




///////arduino command HELP handler///////////////////////////////////////////////////
const commandHelpHandler = (request, response) => {
    //console.log('server log: ' + request.path);
    response.send(request.path);

    port.write('0\n', error => {
        if (error) {
            console.log('Error sending data to arduino: ', error.message);
        } else {
            console.log('command sent to arduino');
        }
    });

}
app.get('/arduino/api', commandHelpHandler);




///////arduino serial connection test handler///////////////////////////////////////////////////
const commandTestSerialHandler = (request, response) => {
    console.log('server log: ' + request.path);
    response.send(request.path);

    port.write('\n', error => {
        if (error) {
            console.log('Error sending data to arduino: ', error.message);
        } else {
            console.log('test \\n sent to arduino');
        }
    });

}
app.get('/arduino', commandTestSerialHandler);


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
            command = 'forward/' + (-Y) + '/' + (-Y);
        } else if (Y > 0) {
            command = 'backward/' + Y + '/' + Y;
        }
    } else if (Math.abs(Y) < Math.abs(X)) {
        if (X > 0) {
            command = 'right/' + X + '/' + X;
        } else if (X < 0) {
            command = 'left/' + (-X) + '/' + (-X);
        }
    }


    let path = command;
    parseAndSendCommandToArduino(path);
}


//gamepad joystick axes handler
const joystickAxesHandler = (request, response) => {
    //console.log('server log: ' + request.path);
    if (request.body !== undefined) {
        //console.log(request.body);
        processAxesValues(request.body);
    } else console.log('no request body');
    response.send(request.path);
}
app.post('/gamepad/axes/', joystickAxesHandler);


app.listen(8080, () => {
    console.log('HTTP Raspberry Pi Server is Up at 8080');
});


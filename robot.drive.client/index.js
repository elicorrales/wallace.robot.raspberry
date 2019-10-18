'use strict';

let ipAddress='10.0.0.58';
//let ipAddress='192.168.43.64';

let sentStartingMotorSpeedToAmpsRatio = false;

let autoStatus = false;
let previousx = 0;
let previousy = 0;
let maxspeed = document.getElementById('maxspeed').value;
let maxrotspeed = document.getElementById('maxrotspeed').value;
let startBeeping = false;
let beeping = false;

// stuff related to making an error sound
let audioContext = undefined;

const  beep = (vol, freq, duration) => {
    let oscillator=audioContext.createOscillator();
    let gain=audioContext.createGain();
    oscillator.connect(gain);
    oscillator.frequency.value=freq;
    oscillator.type="square";
    gain.connect(audioContext.destination);
    gain.gain.value=vol*0.01;
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime+duration*0.001);
}

const doArduinoCommand = (command, status) => {

    if (audioContext === undefined) {
        audioContext = new AudioContext(); // browsers limit the number of concurrent audio contexts, so you better re-use'em
    }

    if (status === 'status') {
        autoStatus = true;
    } else if (status === 'nostatus') {
        autoStatus = false;
    }

    fetch('http://'+ipAddress+':8084/arduino/api/' + command, { method: 'GET' })
    .then(result => {
        //console.log(result);
    })
    .catch(error => {
        console.log(error);
    });
}

const doArduinoSetMaxSpeed = (slider) => {
    maxspeed = slider.value;
    console.log(maxspeed);
}
const doArduinoSetMaxRotationSpeed = (slider) => {
    maxrotspeed = slider.value;
    console.log(maxrotspeed);
}




// this fires as long as slider is moving
// (speed changing)
let mouseSliderPressed = false
const doArduinoStartMovement = (slider, event) => {
    if (!mouseSliderPressed) {
        mouseSliderPressed = true;
        const command = slider.id;
        const speed = slider.value;
        //console.log(command,' ',speed,' ',event);
        sendArduinoMovementCommand(command);
    }
}

// this fires when slider button goes up 
// we need to keep sending movement even if slider does not move,
// as long as it's held down - (same speed)
const doArduinoEndMovement = (slider, event) => {
    mouseSliderPressed = false;
    slider.value = 0;
}

const sendArduinoMovementCommand = (command) => {

    if (!mouseSliderPressed) return;

    setTimeout(() => {
        const speed = document.getElementById(command).value;
        fetch('http://'+ipAddress+':8084/arduino/api/' + command + '/' + speed, { method: 'GET' })
        .then(result => {
            //console.log(result);
        })
        .catch(error => {
            console.log(error);
            mouseSliderPressed = false;
        });
        sendArduinoMovementCommand(command);
    }, 10);
}

const sendGamepadAxesToServer = (X, Y) => {
    //console.log(X,' ',Y);
    fetch('http://'+ipAddress+':8084/gamepad/axes/', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
            },
            body: JSON.stringify({X,Y})
        }
    )
    .then(result => {
        //console.log(result);
    })
    .catch(error => {
        console.log(error);
    });

}

const gamePadHandler = () => {
    setInterval(()=> {
        const gamePad = navigator.getGamepads()[0];
        const axes = gamePad.axes;
        //console.log(axes);
        const X = axes[0];
        const Y = axes[1];
        const absX = Math.abs(X);
        const absY = Math.abs(Y);
        const now = new Date().getTime();

        // since joystick not guaranteed to be centered..
        if (absX < 0.18 && absY < 0.18) { return; }

        // make sure the joystick movement is clearly vertical, or clearly horizontal
        if ((absX + 0.05 > absY) || (absY + 0.05 > absX)) {

            let x = X>=0 ? map(X,0.2,1,0,maxrotspeed,true) : map(X,-0.2,-1,0,-maxrotspeed,true);

            let y = Y>=0 ? map(Y,0.2,1,0,maxspeed,true) : map(Y,-0.2,-1,0,-maxspeed,true);

            let intx = Math.floor(x);
            let inty = Math.floor(y);

            //console.log(intx,'  ',inty);
            sendGamepadAxesToServer(intx,inty);
        }
    }, 30);
}


const doBeep = () => {

    if (startBeeping && !beeping) {
        setTimeout(()=>{
            console.log('going to beeeepppppp....');
            beeping = true;
            beep(999,120,50);
            beeping = false;
            console.log('done beeping....');
        },1);
    }

}


//occurs once at start
const onGamePadConnected = (gamePadEvent) => {
    //console.log(gamePadEvent);

    gamePadHandler();
}




window.addEventListener('gamepadconnected', onGamePadConnected);

//p5.js functions - i believe required to be able to use the
//map() function - not sure - haven't double-checked in some time.
function setup() {}
//function draw() {}





setInterval(() => {


    
        fetch('http://'+ipAddress+':8084/arduino/data', { method: 'GET' })
        .then(response => {
            if (response.status !== 200) {
                console.log('Bad data retrieval response from server:',response.status);
                return;
            }
            response.json().then(data => {
                arduinodata.innerHTML = ''
                        + 'Volts:' + data.volts + '<br/>'
                        + 'Amps1:' + data.amps1 + '<br/>'
                        + 'Amps2:' + data.amps2  + '<br/>'
                        + 'M1 Spd:' + data.speed1 + '<br/>'
                        + 'M2 Spd:' + data.speed2 + '<br/>'
                        + 'Temp: ' + data.temp + '<br/>'
                        + 'Cmds: ' + data.cmds + '&nbsp;&nbsp;'
                        + 'Dropped: ' + data.dropped + '&nbsp;&nbsp;'
                        + '% Err: ' + ((data.dropped / data.cmds) * 100).toFixed(1) + '&nbsp;&nbsp;'
                        + 'Last: ' + data.last + '&nbsp;&nbsp;'
                        + 'Msg:  ' + data.msg + '<br/>'
                        + 'Error:' + data.error + '<br/>'
                        + 'HiAmpCnt:' + data.hiAmpsCnt + '<br/>'
                        + 'LoSpdCnt:' + data.loSpdCnt + '<br/>';


                            //<button onclick="beep(100,720,50)">beep</button>
                            //<button onclick="beep(100,520,50)">beep</button>
                            //<button onclick="beep(999,220,50)">boop</button>
               if (data.error !== '') {
                   startBeeping = true;
                   doBeep();
               } else {
                   startBeeping = false;
                   if (!sentStartingMotorSpeedToAmpsRatio) {
                        sentStartingMotorSpeedToAmpsRatio = true;
                        doArduinoCommand('minspd2amps/2/600');
                   }
               }

            });
        })
        .catch(error => {
            console.log(error);
        });
}, 100);

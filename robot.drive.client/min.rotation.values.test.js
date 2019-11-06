'use strict';

const startingSpeedCommandValue = 0.2;

let doRotationTest = false;
let currentRotateDirection = 'left';
let currentlyRotating = false;
let haveCompletedCurrentLeftAndRightRotationCycle = false;

let currentLeftSpeedCommandValue = startingSpeedCommandValue;
let currentRightSpeedCommandValue = startingSpeedCommandValue;
let currentMillisRotating = 0;
let maxAttainedLeftM1Speed = 0;
let maxAttainedLeftM2Speed = 0;
let maxAttainedRightM1Speed = 0;
let maxAttainedRightM2Speed = 0;


const doSwitchToFollowRedShirtDrive = () => {
    location.href = "followredshirt.html";
    clearTouchEvents();
}

const doSwitchToTouchDrive = () => {
    location.href = "touchdrive.html";
}



const doStartRotationTest = () => {
    doRotationTest = true;
}

const doStopRotationTest = () => {
    doRotationTest = false
}


const rotate = (x,directionString) => {
    warnings.innerHTML = 'Rotating ' + directionString + ' ....';
    let now = new Date().getTime();
    if (now - currentMillisRotating > 1000) {
        warnings.innerHTML = 'Done Rotating ' + directionString;

        switch (directionString) {
            case 'Left':
                if (maxAttainedLeftM1Speed < dataReceivedFromNodeJsServer.speed1) {
                    maxAttainedLeftM1Speed = dataReceivedFromNodeJsServer.speed1;
                }

                if (maxAttainedLeftM2Speed < dataReceivedFromNodeJsServer.speed2) {
                    maxAttainedLeftM2Speed = dataReceivedFromNodeJsServer.speed2;
                }
                break;
            case 'Right':
                if (maxAttainedRightM1Speed < dataReceivedFromNodeJsServer.speed1) {
                    maxAttainedRightM1Speed = dataReceivedFromNodeJsServer.speed1;
                }

                if (maxAttainedRightM2Speed < dataReceivedFromNodeJsServer.speed2) {
                    maxAttainedRightM2Speed = dataReceivedFromNodeJsServer.speed2;
                }
                break;
        }

        currentlyRotating = false;
        if (directionString === 'Right') {
            haveCompletedCurrentLeftAndRightRotationCycle = true;
        }
        return;
    }
    setTimeout(() => {
        if (!doRotationTest) { return; }
        console.log(dataReceivedFromNodeJsServer);
        processXandY(x,0,0); 
        rotate(x,directionString);
    },50);
}



const rotateLeft = (x) => {
    rotate(-x,'Left');
}

const rotateRight = (x) => {
    rotate(x,'Right');
}




const rotationTest = () => {

    setInterval(()=> {

        if (doRotationTest && !currentlyRotating && !haveCompletedCurrentLeftAndRightRotationCycle) {

            currentlyRotating = true;

            switch (currentRotateDirection) {
                case 'left':
                    currentRotateDirection = 'right';
                    currentMillisRotating = new Date().getTime();
                    rotateLeft(currentLeftSpeedCommandValue);
                    break;
                case 'right':
                    currentRotateDirection = 'left';
                    currentMillisRotating = new Date().getTime();
                    rotateRight(currentRightSpeedCommandValue);
                    break;
            }

        }

        messages.innerHTML = '';
            + 'M1 Left: ' + maxAttainedLeftM1Speed + ', M2 Left: ' + maxAttainedLeftM2Speed + ' Left Spd Cmd: ' + currentLeftSpeedCommandValue + '<br/>'
            + 'M1 Right: ' + maxAttainedRightM1Speed + ', M2 Right: ' + maxAttainedRightM2Speed + ' Right Spd Cmd: ' + currentRightSpeedCommandValue;

        if (haveCompletedCurrentLeftAndRightRotationCycle && !currentlyRotating && (maxAttainedLeftM1Speed < 2 || maxAttainedLeftM2Speed < 2)) {
            currentLeftSpeedCommandValue += 0.1;
            haveCompletedCurrentLeftAndRightRotationCycle = false;
        }

        if (haveCompletedCurrentLeftAndRightRotationCycle && !currentlyRotating && (maxAttainedRightM1Speed < 2 || maxAttainedRightM2Speed < 2)) {
            currentRightSpeedCommandValue += 0.1;
            haveCompletedCurrentLeftAndRightRotationCycle = false;
        }


        rotationTest();

    },3000);
}

const initializeMinRotationValuesTest = () => {
    if (p5jsSetupHasRun) {
        rotationTest();
        return;
    }
    setTimeout(()=>{
        initializeMinRotationValuesTest(); 
    },50);
}


initializeMinRotationValuesTest();

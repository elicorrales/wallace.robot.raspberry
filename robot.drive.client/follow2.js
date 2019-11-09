'use strict';

const url0="http://10.0.0.34:8081/?action=stream";
let cameraWorks = false;
camera0.crossOrigin = "Anonymous";


let chosenColor = 'red';
let colorDiff = parseInt(document.getElementById('colorDiffElem').value);
let minChosenColorCount = parseInt(document.getElementById('minChosenColorCountElem').value);
let processingImage = false;

let isLLL = false;
let isLL  = false;
let isL   = false;
let isR   = false;
let isRR  = false;
let isRRR = false;

/*
const minRequiredActualMotorSpeed = 20;
const maxDiffActualSpeedM1vsM2 = 20;
const startingSpeedCommandValue = 0.2;
let doRotationTest = false;
let currentRotateDirection = 'left';
let currentlyRotating = false;
let didNewRotationCycle = false;
let haveCompletedCurrentLeftAndRightRotationCycle = false;
*/

const maxNumRotationCommandsToSendInOneStream = 80; // aprox 2secs worth of drive commands
let currentNumRotationCommandsSentInStream = 0;

/*
let delayStarted = false;
*/

let delayMillis = 0;

/*
let currentLeftSpeedCommandValue = startingSpeedCommandValue;
let currentRightSpeedCommandValue = startingSpeedCommandValue;
let currentMillisRotating = 0;
let maxAttainedLeftM1Speed = 0;
let maxAttainedLeftM2Speed = 0;
let maxAttainedRightM1Speed = 0;
let maxAttainedRightM2Speed = 0;
let numTimesToggleBetweenLeftVsRight = 0;
let LeftSpeedsWereFasterThanRightSpeeds = false;
let LeftSpeedsAreFasterThanRightSpeeds = false;
*/



const doSwitchToGamepadDrive = () => {
    location.href = "gamepaddrive.html";
    clearTouchEvents();
}

const doSwitchToTouchDrive = () => {
    location.href = "touchdrive.html";
}


















const tryCamera = (url) => {
    setTimeout(() => {
        fetch(url)
        .then(result => {
            if (!cameraWorks) {
                camera0.src = url;
                messages.innerHTML = 'Checked Camera Feed Ok';
            }
            if (errors.innerHTML === 'No Camera Feed') {
                errors.innerHTML = '';
            }
            cameraWorks = true;
        })
        .catch(error => {
            errors.innerHTML = 'No Camera Feed';
            if (messages.innerHTML === 'Checked Camera Feed Ok') {
                messages.innerHTML = '';
            }
            cameraWorks = false;
            tryCamera(url);
        });
    },1000);
}


const doChooseColor = (color) => {
    chosenColor = color;
}

const doSetColorDiff = (slider) => {
    colorDiff = parseInt(slider.value);
}

const doSetMinChosenColorCount = (slider) => {
    minChosenColorCount = parseInt(slider.value);
}


const rotate = (x,directionString) => {

    console.log('Rotating.....' + directionString + ' --------------');

    warnings.innerHTML = 'Rotating ' + directionString + ' ....';

    if (dataReceivedFromNodeJsServer.speed1 < 1 && dataReceivedFromNodeJsServer.speed2 < 1) {
        processXandY(x,0,0); 
    }
}



const rotateLeft = (x) => {
    rotate(-x,'Left');
}

const rotateRight = (x) => {
    rotate(x,'Right');
}


const rotateTowardWhichAreasMatch = () => {

    //printWhichAreasMatch();

    //extreme left side, spans 1 area, almost out of view, time to rotate very fast
    if (isLLL && !isLL && !isL && !isR && !isRR && !isRRR) {
        rotateLeft(0.5);
    }

    //very left side, spans 2 areas, rotate fast
    if (isLLL && isLL && !isL && !isR && !isRR && !isRRR) {
        rotateLeft(0.5);
    }

    //left side, spans 1 area, rotate medium
    if (!isLLL && isLL && !isL && !isR && !isRR && !isRRR) {
        rotateLeft(0.5);
    }

    //left center, spans 2 area, rotate slower
    if (!isLLL && isLL && isL && !isR && !isRR && !isRRR) {
        rotateLeft(0.45);
    }

    //left center, spans 1 area, rotate slow
    if (!isLLL && !isLL && isL && !isR && !isRR && !isRRR) {
        rotateLeft(0.4);
    }



    //right center, spans 1 area, rotate slow
    if (!isLLL && !isLL && !isL && isR && !isRR && !isRRR) {
        rotateRight(0.4);
    }

    //right center, spans 2 area, rotate slower
    if (!isLLL && !isLL && !isL && isR && isRR && !isRRR) {
        rotateRight(0.45);
    }

    //right side, spans 1 area, rotate medium
    if (!isLLL && !isLL && !isL && !isR && isRR && !isRRR) {
        rotateRight(0.5);
    }

    //very right side, spans 2 areas, rotate fast
    if (!isLLL && !isLL && !isL && !isR && isRR && isRRR) {
        rotateRight(0.5);
    }

    //extreme right side, spans 1 area, almost out of view, time to rotate very fast
    if (!isLLL && !isLL && !isL && !isR && !isRR && isRRR) {
        rotateRight(0.5);
    }

}


const printWhichAreasMatch = () => {
    console.log(isLLL, isLL, isL, isR, isRR, isRRR);
}

const clearWhichAreasMatch = () => {
    isLLL = false;
    isLL  = false;
    isL   = false;
    isR   = false;
    isRR  = false;
    isRRR = false;
}


const setWhichAreasMatch = (area) => {
    switch (area) {
        case 'LLL': isLLL = true; break;
        case 'LL' : isLL  = true; break;
        case 'L'  : isL   = true; break;
        case 'R'  : isR   = true; break;
        case 'RR' : isRR  = true; break;
        case 'RRR': isRRR = true; break;
    }
}

const processImageColorOnOffScreenCanvas = (whichArea,canv,x,y) => {
    let chosenColorCount = 0;
    let offScrnCtx = canv.offscreenCanvas.getContext('2d');
    offScrnCtx.drawImage(camera0,x,y,160,240,0,0,80,120);

    let imgData = offScrnCtx.getImageData(0,0,80,120);
    let data = imgData.data;
    for (let i=0; i<data.length; i+=4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        switch (chosenColor) {
            case 'red':
                if (r>g+colorDiff && r>b+colorDiff) {
                    data[i]   = 255;
                    data[i+1] = 0;
                    data[i+2] = 0;
                    chosenColorCount++;
                }
                break;
            case 'green':
                if (g>r+colorDiff && g>b+colorDiff) {
                    data[i]   = 0;
                    data[i+1] = 255;
                    data[i+2] = 0;
                    chosenColorCount++;
                }
                break;
            case 'blue':
                if (b>r+colorDiff && b>g+colorDiff) {
                    data[i]   = 0;
                    data[i+1] = 0;
                    data[i+2] = 255;
                    chosenColorCount++;
                }
                break;
        }
    }

    if (chosenColorCount>minChosenColorCount) {
        switch (chosenColor) {
            case 'red':
                offScrnCtx.rect(0,0,80,120);
                offScrnCtx.fillStyle = 'red';
                offScrnCtx.fill();
                setWhichAreasMatch(whichArea);
                break;
            case 'green':
                offScrnCtx.rect(0,0,80,120);
                offScrnCtx.fillStyle = 'green';
                offScrnCtx.fill();
                setWhichAreasMatch(whichArea);
                break;
            case 'blue':
                offScrnCtx.rect(0,0,80,120);
                offScrnCtx.fillStyle = 'blue';
                offScrnCtx.fill();
                setWhichAreasMatch(whichArea);
                break;
        }
    } else {
        offScrnCtx.putImageData(imgData,0,0);
    }
 
}

const processPartOfImage = (whichArea, canv,x,y) => {
    processImageColorOnOffScreenCanvas(whichArea, canv,x,y);
    canv.getContext('2d').drawImage(canv.offscreenCanvas,0,0);
}


const mainLoop = () => {
    setInterval(() => {
        if (!processingImage) {

            processingImage = true;

            processPartOfImage('LLL',canvTLLL,0,0);
            processPartOfImage('LL', canvTLL,160,0);
            processPartOfImage('L',  canvTL,2*160,0);
            processPartOfImage('R',  canvTR,3*160,0);
            processPartOfImage('RR', canvTRR,4*160,0);
            processPartOfImage('RRR',canvTRRR,5*160,0);

            processPartOfImage('LLL',canvLLL,0,240);
            processPartOfImage('LL', canvLL,160,240);
            processPartOfImage('L',  canvL,2*160,240);
            processPartOfImage('R',  canvR,3*160,240);
            processPartOfImage('RR', canvRR,4*160,240);
            processPartOfImage('RRR',canvRRR,5*160,240);

            processPartOfImage('LLL',canvBLLL,0,2*240);
            processPartOfImage('LL', canvBLL,160,2*240);
            processPartOfImage('L',  canvBL,2*160,2*240);
            processPartOfImage('R',  canvBR,3*160,2*240);
            processPartOfImage('RR', canvBRR,4*160,2*240);
            processPartOfImage('RRR',canvBRRR,5*160,2*240);

            rotateTowardWhichAreasMatch();

            clearWhichAreasMatch();

            processingImage = false;
        }
    },20);
}


const createOffScreenCanvas = (mainCanvas) => {
        mainCanvas.offscreenCanvas = document.createElement('canvas');
        mainCanvas.offscreenCanvas.width = 80;
        mainCanvas.offscreenCanvas.height = 120;
}

const startMainLoop = () => {

    if (cameraWorks) {
        console.log('starting main loop');

        createOffScreenCanvas(canvTLLL); 
        createOffScreenCanvas(canvTLL); 
        createOffScreenCanvas(canvTL); 
        createOffScreenCanvas(canvTR); 
        createOffScreenCanvas(canvTRR); 
        createOffScreenCanvas(canvTRRR); 
        createOffScreenCanvas(canvLLL); 
        createOffScreenCanvas(canvLL); 
        createOffScreenCanvas(canvL); 
        createOffScreenCanvas(canvR); 
        createOffScreenCanvas(canvRR); 
        createOffScreenCanvas(canvRRR); 
        createOffScreenCanvas(canvBLLL); 
        createOffScreenCanvas(canvBLL); 
        createOffScreenCanvas(canvBL); 
        createOffScreenCanvas(canvBR); 
        createOffScreenCanvas(canvBRR); 
        createOffScreenCanvas(canvBRRR); 
        mainLoop();
        return;
    }

    setTimeout(() => {
        console.log('waiting to start main loop');
        startMainLoop();
    },50);

}

tryCamera(url0);
startMainLoop();

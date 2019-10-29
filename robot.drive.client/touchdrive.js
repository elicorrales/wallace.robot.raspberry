'use strict';


let accumulatedTouchMessages = '';

let inTouchDriveMode = false;
let intervalTouchTracker;

let touchHasStarted = false;
let touchStartX = 0;
let touchStartY = 0;
let currTouchX = 0;
let currTouchY = 0;

const maxTouchRangeX = 100;
const maxTouchRangeY = 200;

const trackTouch = () => {
 
    if (touchHasStarted) {
        let x = currTouchX - touchStartX;
        let y = currTouchY - touchStartY;
        let X = map(x,-maxTouchRangeX,maxTouchRangeX,-1,1,true);
        let Y = map(y,-maxTouchRangeY,maxTouchRangeY,-1,1,true);
        //accumulatedTouchMessages = ', ' + (currTouchX - touchStartX) + ':' + (currTouchY - touchStartY);
        accumulatedTouchMessages = x + '('+X.toFixed(2)+'):' + y + '('+Y.toFixed(2)+')';
        displayTouchMessages();
        processXandY(X.toFixed(2),Y.toFixed(2));
    }
 
}

const initTouchEvents = () => {
    doClearTouchMessages();
    accumulatedTouchMessages += ' Init Touch Events; ';
    displayTouchMessages();
    toucharea.addEventListener('touchstart',doTouchStart);
    toucharea.addEventListener('touchmove',doTouchMove);
    toucharea.addEventListener('touchend',doTouchEnd);
    intervalTouchTracker = setInterval(trackTouch,5);
}

const clearTouchEvents = () => {
    clearInterval(intervalTouchTracker);
    accumulatedTouchMessages += ' Clear Touch Events; ';
    displayTouchMessages();
    toucharea.removeEventListener('touchstart', doTouchStart);
    toucharea.removeEventListener('touchmove', doTouchMove);
    toucharea.removeEventListener('touchend', doTouchEnd);
}

const doSwitchToMainPage = () => {
    mainappcontainer.style.display = 'block';
    //messagescontainer.style.display = 'block';
    touchdrivecontainer.style.display = 'none';
    inTouchDriveMode = false;
    clearTouchEvents();
}

const doSwitchToTouchDrive = () => {
    accumulatedTouchMessages += ' Switch To Touch ; ';
    displayTouchMessages();
    mainappcontainer.style.display = 'none';
    //messagescontainer.style.display = 'none';
    touchdrivecontainer.style.display = 'block';
    inTouchDriveMode = true;
    initTouchEvents();
}

const displayTouchMessages = () => {
    touchmessages.innerHTML = '<font size="+4">'+accumulatedTouchMessages+'</font>';
}



const doClearTouchMessages = () => {
    accumulatedTouchMessages = '';
    displayTouchMessages();
}


const doMouseDown = (event) => {
    touchHasStarted = true;
    touchStartX = event.clientX;
    touchStartY = event.clientY;
    currTouchX = touchStartX;
    currTouchY = touchStartY;
    event.preventDefault();
}

const doMouseUp = (event) => {
    touchHasStarted = false;
    currTouchX = 0;
    touchStartX = 0;
    currTouchY = 0;
    touchStartY = 0;
    event.preventDefault();
}

const doMouseMove = (event) => {
    currTouchX = event.clientX;
    currTouchY = event.clientY;
    event.preventDefault();
}

const doTouchStart = (event) => {
    touchHasStarted = true;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    currTouchX = touchStartX;
    currTouchY = touchStartY;
    event.preventDefault();
}

const doTouchMove = (event) => {
    currTouchX = event.touches[0].clientX;
    currTouchY = event.touches[0].clientY;
    event.preventDefault();
}

const doTouchEnd = (event) => {
    touchHasStarted = false;
    currTouchX = 0;
    touchStartX = 0;
    currTouchY = 0;
    touchStartY = 0;
    event.preventDefault();
}



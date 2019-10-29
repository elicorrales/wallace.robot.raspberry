'use strict';

let elements = '';
let allevents = '';
let inTouchDriveMode = false;

const doSwitchToMainPage = () => {
    mainappcontainer.style.display = 'block';
    messagescontainer.style.display = 'block';
    touchdrivecontainer.style.display = 'none';
    inTouchDriveMode = false;
}

const doSwitchToTouchDrive = () => {
    mainappcontainer.style.display = 'none';
    messagescontainer.style.display = 'none';
    touchdrivecontainer.style.display = 'block';
    inTouchDriveMode = true;
}

const setTouchMessages = (msgs) => {
    touchmessages.innerHTML = '<h1>'+msgs+'</h1>';
}
const setTouchElements = (msgs) => {
    touchelements.innerHTML = '<h1>'+msgs+'</h1>';
}
const setTouchEvents = (msgs) => {
    touchevents.innerHTML = '<h1>'+msgs+'</h1>';
}



const doClearTouchMessages = () => {
    allevents = '';
    setTouchMessages(allevents);
    elements = '';
    setTouchElements(elements);
    setTouchMessages('');
}


const doMouseDown = (event) => {
    setTouchEvents('ox:'+event.offsetX +',oy:'+event.offsetY);
}

const doMouseUp = (event) => {
    setTouchEvents('ox:'+event.offsetX +',oy:'+event.offsetY);
}

const doMouseMove = (event) => {
    setTouchEvents('ox:'+event.offsetX +',oy:'+event.offsetY);
}

const doTouchStart = (element,event) => {
}

const doTouchMove = (element,event) => {
    //allevents += 'Do Touch-Move ';
    //setTouchMessages(events);
}
const doTouchEnd = (element,event) => {
    //allevents += ' Do Touch-End ';
    //setTouchMessages(events);
}




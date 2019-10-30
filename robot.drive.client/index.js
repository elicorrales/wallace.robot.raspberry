'use strict';

/////////////////////////////////////////////////////////////////////////////////////////////////
// related to establishing initial conncection between browser client and node.js server.
/////////////////////////////////////////////////////////////////////////////////////////////////
let ipAddress='10.0.0.58';
let ipAddress2='192.168.1.3';
let currIpAddress = ipAddress;
let haveReachedRaspberryNodeJsServerAtLeastOneTime = false;
let haveTriedToReachRaspberryNodeJsServerAtLeastThisManyTimes = 0;
let haveInformedUserThatRaspberryNodeJsServerIsAvailable = false;
let maxTriesToReachRaspberryNodeJsServerBeforeSwitchingIpAddresses = 5;
let lastTimeResponseFromRaspberryPiServer = new Date().getTime();

const doUseThisIp = (ipAddr) => {
    currIpAddress = ipAddr;
}


const doSwitchToGamepadDrive = () => {
    location.href = "gamepaddrive.html";
}

const doSwitchToTouchDrive = () => {
    location.href = "touchdrive.html";
}



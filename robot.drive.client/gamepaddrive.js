'use strict';





const doSwitchToTouchDrive = () => {
    location.href = "touchdrive.html";
}



const gamePadHandler = () => {
    setInterval(()=> {
        const gamePad = navigator.getGamepads()[0];
        const axes = gamePad.axes;
        //console.log(axes);
        const X = axes[0];
        const Y = axes[1];
        processXandY(X,Y);
    }, 10);
}





//occurs once at start
const onGamePadConnected = (gamePadEvent) => {

    console.log(gamePadEvent);

    gamePadHandler();
}
window.addEventListener('gamepadconnected', onGamePadConnected);




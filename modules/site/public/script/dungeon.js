let app = null;

window.addEventListener('DOMContentLoaded', function(){
    initCanvas();
});

function initCanvas(){
    var canvas = document.querySelector('#canvas');

    app = new PIXI.Application({ 
        width: canvas.clientWidth, 
        height: canvas.clientHeight, 
        backgroundColor: 0x050505
    }); 

    canvas.appendChild(app.view);
}
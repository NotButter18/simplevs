const fiContainer = document.getElementById('input-container');
const flText = document.getElementById('label-text');
const ca = document.getElementById('clear-btn');
const canvas = document.getElementById('vs');
const ctx = canvas.getContext('2d');

let audio;
let audioContext;
let analyser;
let source;

function createInput() {
    fiContainer.innerHTML = '<input type="file" id="input" accept="audio/*">';
    const el = document.getElementById('input');
    el.onchange = selectAudio;
    return el;
}

let fi = createInput();

function selectAudio() {
    if (!this.files[0]) return;
    
    flText.innerText = this.files[0].name;

    if (audio) {
        audio.pause();
        audio = null;
    }

    audio = new Audio();
    audio.src = URL.createObjectURL(this.files[0]);
    audio.oncanplaythrough = () => {
        audio.play();
        Visualizer(audio);
    };
}

ca.onclick = function() {
    if (audio) {
        audio.pause();
        audio.src = "";
        audio = null;
    }
    
    flText.innerText = "SELECT AUDIO";
    fi = createInput();
    
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
};

function Visualizer(audio) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (source) {
        source.disconnect();
    }

    source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = window.innerWidth < 800 ? 128 : 256; 
    const bufferL = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferL);

    draw(data, bufferL);
}

function draw(dataArray, bufferLength) {
    requestAnimationFrame(() => draw(dataArray, bufferLength));
    analyser.getByteFrequencyData(dataArray);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startOffset = 4; 
    const endOffset = Math.floor(bufferLength * 0.71); 
    const effectiveLength = endOffset - startOffset;

    const isSmall = window.innerWidth < 800;
    const barWidth = isSmall ? 4 : 8;
    const spacing = isSmall ? 4 : 8;
    
    const centerY = canvas.height / 2;
    const totalWidth = effectiveLength * (barWidth + spacing);
    let x = (canvas.width - totalWidth) / 2;

    for (let i = startOffset; i < endOffset; i++) {
        let relIndex = (i - startOffset) / effectiveLength;
        let boost = 1 + relIndex; 
        
        let intensity = (dataArray[i] / 255) * boost;
        let barHeight = intensity * (canvas.height * 0.8);

        if (barHeight < 10) barHeight = 10;
        if (barHeight > canvas.height * 0.9) barHeight = canvas.height * 0.9;

        const y = centerY - (barHeight / 2);

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 20);
        ctx.fill();

        x += barWidth + spacing;
    }
}
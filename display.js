const displayRegistrarNow = document.getElementById('displayRegistrarNow');
const displayGuidanceNow = document.getElementById('displayGuidanceNow');
const displayRegistrarQueue = document.getElementById('displayRegistrarQueue');
const displayGuidanceQueue = document.getElementById('displayGuidanceQueue');
const videoClock = document.getElementById('videoClock');

let lastRegistrarId = null;
let lastGuidanceId = null;
const ding = new Audio('dingding.mp3');

const scriptURL = "https://script.google.com/macros/s/AKfycby2YOPPvGGDxR63dnq7sWefE84wG3d6_Bh4rFqQm8d0PLmFv6goAwfCFyq8JlB_VaJvIw/exec";

async function fetchLiveQueues() {
    try {
        const resRegistrar = await fetch(`${scriptURL}?mode=read&service=Registrar`);
        const resGuidance = await fetch(`${scriptURL}?mode=read&service=Guidance`);

        const dataRegistrar = await resRegistrar.json();
        const dataGuidance = await resGuidance.json();

        localStorage.setItem('registrarQueue', JSON.stringify(dataRegistrar.queue || []));
        localStorage.setItem('currentRegistrar', JSON.stringify(dataRegistrar.current || null));

        localStorage.setItem('guidanceQueue', JSON.stringify(dataGuidance.queue || []));
        localStorage.setItem('currentGuidance', JSON.stringify(dataGuidance.current || null));

        renderDisplay();
    } catch (err) {
        console.warn("Could not fetch Sheets data, using localStorage", err);
        renderDisplay();
    }
}

function renderDisplay() {
    const registrarQueue = JSON.parse(localStorage.getItem('registrarQueue')) || [];
    const guidanceQueue = JSON.parse(localStorage.getItem('guidanceQueue')) || [];
    const currentRegistrar = JSON.parse(localStorage.getItem('currentRegistrar')) || null;
    const currentGuidance = JSON.parse(localStorage.getItem('currentGuidance')) || null;

    displayRegistrarNow.textContent = currentRegistrar ? currentRegistrar.id : '---';
    displayGuidanceNow.textContent = currentGuidance ? currentGuidance.id : '---';

    displayRegistrarQueue.innerHTML = '';
    registrarQueue.slice(0, 6).forEach(s => {
        const li = document.createElement('li');
        li.textContent = s.id;
        displayRegistrarQueue.appendChild(li);
    });

    displayGuidanceQueue.innerHTML = '';
    guidanceQueue.slice(0, 6).forEach(s => {
        const li = document.createElement('li');
        li.textContent = s.id;
        displayGuidanceQueue.appendChild(li);
    });

    if (currentRegistrar && currentRegistrar.id !== lastRegistrarId) {
        announceStudent(`Student ID ${pronounceID(currentRegistrar.id)}, please proceed to the Registrar`);
        lastRegistrarId = currentRegistrar.id;
    }
    if (currentGuidance && currentGuidance.id !== lastGuidanceId) {
        announceStudent(`Student ID ${pronounceID(currentGuidance.id)}, please proceed to the Guidance`);
        lastGuidanceId = currentGuidance.id;
    }
}

function announceStudent(text) {
    ding.currentTime = 0;
    ding.play().catch(e => console.log('Ding error:', e));

    const delayBeforeVoice = 1000; 

    if ('speechSynthesis' in window) {
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                const msg = new SpeechSynthesisUtterance(text);
                msg.lang = 'en-US';
                msg.rate = 1;
                msg.pitch = 1;
                window.speechSynthesis.speak(msg);
            }, delayBeforeVoice + i * 1500); 
        }
    }
}


function pronounceID(id) {
    const cleanId = id.replace(/-/g, ''); 
    const firstPart = cleanId.slice(0, cleanId.length - 4);
    const yearPart = cleanId.slice(-4);
    const firstPronounce = firstPart.split('').map(d => digitToWord(d)).join(' ');

    let yearPronounce = '';
    for (let i = 0; i < yearPart.length; i += 2) {
        yearPronounce += `${yearPart.substring(i, i + 2)} `;
    }

    return `${firstPronounce} ${yearPronounce.trim()}`;
}

function digitToWord(digit) {
    const words = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    return words[parseInt(digit)] || digit;
}

function updateClock() {
    const now = new Date();
    videoClock.textContent = now.toLocaleTimeString();
}

// 🔄 Auto-refresh
fetchLiveQueues();
setInterval(fetchLiveQueues, 3000);
setInterval(updateClock, 1000);
updateClock();
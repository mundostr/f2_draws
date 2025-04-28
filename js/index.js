const INSTALLABLE = false;
const classTitle = document.getElementById('classTitle');
const subtitle = document.getElementById('subtitle');
const roundInfo = document.getElementById('roundInfo');
const classSelector = document.getElementById('classSelector');
const classSelect = document.getElementById('classSelect');
const slotMachine = document.getElementById('slotMachine');
const spinButton = document.getElementById('spinButton');
const nextRoundButton = document.getElementById('nextRoundButton');
const selectedContestantsDisplay = document.getElementById('selectedContestants');
const loadingMessage = document.getElementById('loadingMessage');
const installButton = document.getElementById('install-button');
const printButton = document.getElementById('printButton');
const drawModeSelect = document.getElementById('drawModeSelect');

let classes = [];
let currentClass = null;
let currentRound = 1;
let contestants = [];
let originalContestants = [];
let selectedContestants = [];
let hitsCounter = 0;
let isSpinning = false;
let isFullDrawMode = true;
let previousRoundOrder = [];

const createSlots = () => {
    slotMachine.innerHTML = '';
    loadingMessage.style.display = 'none';

    contestants.forEach((contestant) => {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.textContent = contestant.alias
        slot.dataset.number = contestant.number;
        slot.addEventListener('click', handleSlotClick);
        slotMachine.appendChild(slot);
    });

    spinButton.disabled = false;
};

const handleSlotClick = (e) => {
    if (isSpinning || contestants.length === 0  || isFullDrawMode) return;

    const slot = e.target;
    const number = parseInt(slot.dataset.number, 10);
    const selectedContestant = contestants.find((c) => c.number === number);

    if (!selectedContestant) return;

    hitsCounter++;
    selectedContestants.push({
        round: currentRound,
        position: hitsCounter,
        name: selectedContestant.name,
    });

    contestants = contestants.filter((c) => c.number !== number);

    slot.remove();
    updateSelectedContestantsDisplay();

    if (contestants.length === 0) {
        spinButton.disabled = true;
        spinButton.textContent = 'Sorteo finalizado';

        if (currentRound < currentClass.rounds) {
            nextRoundButton.disabled = false;
        } else {
            printButton.disabled = false;
        }
    }
};

const shuffleArray = (array) => {
    return array.slice().sort(() => Math.random() - 0.5);
};

const singleDraw = () => {
    isSpinning = true;
    hitsCounter++;

    const slots = document.querySelectorAll('.slot');
    const shuffled = shuffleArray(contestants);
    let iterations = 0;
    const intervalDuration = 75;
    const totalIterations = 30;

    spinButton.disabled = true;
    spinButton.textContent = 'Girando...';

    const interval = setInterval(() => {
        slots.forEach((slot, index) => {
            slot.textContent = shuffled[(index + iterations) % shuffled.length].number;
        });

        iterations++;

        if (iterations >= totalIterations) {
            clearInterval(interval);
            isSpinning = false;

            const selectedNumber = parseInt(slots[0].textContent, 10);
            const selectedContestant = shuffled.find((c) => c.number === selectedNumber);
            selectedContestants.push({
                round: currentRound,
                position: hitsCounter,
                name: selectedContestant.name,
            });
            contestants.splice(contestants.indexOf(selectedContestant), 1);
            slots[0].remove();

            updateSelectedContestantsDisplay();

            if (contestants.length > 0) {
                spinButton.disabled = false;
            } else {
                spinButton.disabled = true;

                if (currentRound < currentClass.rounds) {
                    nextRoundButton.disabled = false;
                }
            }
        }
    }, intervalDuration);
};

const fullDraw = () => {
    if (isSpinning) return;
    
    isSpinning = true;
    spinButton.disabled = true;
    spinButton.textContent = 'Sorteando...';
    
    const shuffledContestants = shuffleArray(contestants);
    const slots = document.querySelectorAll('.slot');
    const animationDuration = 3000;
    const contestantDrawDuration = 250;
    const spinInterval = 50;
    let startTime = Date.now();
    
    let spinIntervalId = setInterval(() => {
        slots.forEach(slot => {
            const randomIndex = Math.floor(Math.random() * contestants.length);
            slot.textContent = contestants[randomIndex]?.number || '';
        });
        
        if (Date.now() - startTime >= animationDuration) {
            spinButton.textContent = "Finalizado";
            clearInterval(spinIntervalId);
            drawContestantsOneByOne();
            if (currentRound == currentClass.rounds) printButton.disabled = false;
        }
    }, spinInterval);
    
    const drawContestantsOneByOne = () => {
        let currentIndex = 0;
        
        const drawInterval = setInterval(() => {
            if (currentIndex >= shuffledContestants.length) {
                clearInterval(drawInterval);
                isSpinning = false;
                
                contestants = [];
                slotMachine.innerHTML = '';
                
                if (currentRound < currentClass.rounds) nextRoundButton.disabled = false;
                
                return;
            }
            
            const contestant = shuffledContestants[currentIndex];
            slots[0].textContent = contestant.number;
            
            hitsCounter++;
            selectedContestants.push({
                round: currentRound,
                position: hitsCounter,
                name: contestant.name,
            });
            
            currentIndex++;
            
            setTimeout(() => {
                slots[0].remove();
                updateSelectedContestantsDisplay();
            }, contestantDrawDuration);
            
        }, contestantDrawDuration + 200);
    };
};

const spinSlots = () => {
    if (contestants.length === 0 || isSpinning) return;
    isFullDrawMode ? fullDraw() : singleDraw();
};

const updateSelectedContestantsDisplay = () => {
    selectedContestantsDisplay.innerHTML = '';

    const rounds = {};
    selectedContestants.forEach((item) => {
        if (!rounds[item.round]) {
            rounds[item.round] = [];
        }
        rounds[item.round].push(item);
    });

    for (const [round, items] of Object.entries(rounds)) {
        const roundHeader = document.createElement('h4');
        roundHeader.classList.add('mt-3', 'mb-2');
        roundHeader.textContent = currentClass.rounds === 1 ? `Rondas` : `Ronda ${round}`;
        selectedContestantsDisplay.appendChild(roundHeader);

        items
            .sort((a, b) => a.position - b.position)
            .forEach((item) => {
                const contestantItem = document.createElement('div');
                contestantItem.classList.add('contestant-item');
                contestantItem.innerHTML = `<strong>${item.position}.</strong> ${item.name}`;
                selectedContestantsDisplay.appendChild(contestantItem);
            });
    }

    selectedContestantsDisplay.scrollIntoView({ behavior: 'smooth', block: 'end' });
};

const startNewRound = () => {
    currentRound++;
    hitsCounter = 0;
    contestants = [...originalContestants];
    
    let newOrder = contestants.map(c => c.number);
    while (JSON.stringify(newOrder) === JSON.stringify(previousRoundOrder) && contestants.length > 1) {
        contestants = shuffleArray(contestants);
        newOrder = contestants.map(c => c.number);
    }
    
    previousRoundOrder = [...newOrder];
    selectedContestantsDisplay.innerHTML = '';

    roundInfo.textContent = `Ronda ${currentRound} de ${currentClass.rounds}`;
    spinButton.disabled = false;
    spinButton.textContent = 'Girar bolillero';
    nextRoundButton.disabled = true;

    createSlots();
};

const loadClassData = (selectedClass) => {
    currentClass = selectedClass;
    currentRound = 1;
    hitsCounter = 0;
    originalContestants = [...selectedClass.contestants];
    contestants = [...originalContestants];
    selectedContestants = [];
    isSpinning = false;
    previousRoundOrder = [];

    classTitle.textContent = selectedClass.class;
    roundInfo.textContent = `Ronda ${currentRound} de ${selectedClass.rounds}`;
    selectedContestantsDisplay.innerHTML = '';
    spinButton.textContent = 'Girar bolillero';
    nextRoundButton.disabled = true;

    createSlots();
};

async function loadClasses() {
    try {
        loadingMessage.innerHTML = '<span class="loading-spinner"></span> Cargando categorías...';

        const response = await fetch('contest_data.json');
        if (!response.ok) {
            throw new Error('Error de red');
        }
        classes = await response.json();

        classSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccione';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        classSelect.appendChild(defaultOption);

        classes.forEach((cls) => {
            const option = document.createElement('option');
            option.value = cls.class;
            option.textContent = `${cls.class} (${cls.contestants.length} participantes, ${cls.rounds} rondas)`;
            classSelect.appendChild(option);
        });

        loadingMessage.textContent = '';
    } catch (error) {
        console.error('Error loading classes:', error);
        loadingMessage.textContent = '';
        classSelect.innerHTML = '';
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Error cargando categorías';
        errorOption.disabled = true;
        errorOption.selected = true;
        classSelect.appendChild(errorOption);
    }
}

const checkIfInstalled = () => {
    const isIOSInstalled = window.navigator.standalone; // iOS
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches; // android, desktop

    if (isIOSInstalled || isStandalone) {
        if (installButton) installButton.style.display = 'none';
    } else {
        if (installButton) installButton.style.display = 'block';
    }
};

const printResults = () => {
    const printSection = document.createElement('div');
    printSection.id = 'printSection';
    printSection.style.margin = '1em';
    
    /* const printTitle = document.createElement('h2');
    printTitle.textContent = currentClass.class;
    printTitle.style.textAlign = 'left';
    printSection.appendChild(printTitle); */

    const rounds = {};
    selectedContestants.forEach((item) => {
        if (!rounds[item.round]) rounds[item.round] = [];
        rounds[item.round].push(item);
    });

    Object.entries(rounds).forEach(([round, items]) => {
        const roundSection = document.createElement('div');
        if (currentClass.rounds > 1) roundSection.classList.add('print-round');
        
        const roundHeader = document.createElement('h3');
        roundHeader.innerHTML = `<b>${currentClass.class}</b> - `;
        roundHeader.innerHTML += currentClass.rounds > 1 ? `Orden de vuelo ronda ${round}` : 'Orden de vuelo rondas';
        roundHeader.style.textAlign = 'left';
        roundHeader.style.marginBottom = '1em';
        roundSection.appendChild(roundHeader);

        items.sort((a, b) => a.position - b.position)
            .forEach((item) => {
                const contestantItem = document.createElement('div');
                contestantItem.style.marginBottom = '10px';
                contestantItem.style.fontSize = '18px';
                contestantItem.innerHTML = `<strong>${item.position}.</strong> ${item.name}`;
                roundSection.appendChild(contestantItem);
            });

        printSection.appendChild(roundSection);
    });

    document.body.appendChild(printSection);
    window.print();
    document.body.removeChild(printSection);
};


// MAIN
classSelect.addEventListener('change', (e) => {
    const selectedClassName = e.target.value;
    if (!selectedClassName) return;

    const selectedClass = classes.find((c) => c.class === selectedClassName);
    if (selectedClass) {
        loadClassData(selectedClass);
        subtitle.style.display = 'none';
        printButton.disabled = true;
    }
});

drawModeSelect.addEventListener('change', (e) => {
    isFullDrawMode = e.target.value === 'full';
});

spinButton.addEventListener('click', spinSlots);
nextRoundButton.addEventListener('click', startNewRound);
printButton.addEventListener('click', printResults);

if ('serviceWorker' in navigator && INSTALLABLE) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
            console.log('Service Worker registered with scope:', registration.scope);
        }, function(err) {
            console.log('Service Worker registration failed:', err);
        });

        checkIfInstalled();
    });

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
    
        checkIfInstalled();
    
        if (installButton) {
            installButton.style.display = 'block';
    
            installButton.addEventListener('click', () => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choice) => {
                    if (choice.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    deferredPrompt = null;
                    installButton.style.display = 'none';
                });
            });
        }
    });
}

loadClasses();

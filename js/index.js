const INSTALLABLE = true;
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

let classes = [];
let currentClass = null;
let currentRound = 1;
let contestants = [];
let originalContestants = [];
let selectedContestants = [];
let hitsCounter = 0;
let isSpinning = false;

const createSlots = () => {
    slotMachine.innerHTML = '';
    loadingMessage.style.display = 'none';

    contestants.forEach((contestant) => {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.textContent = contestant.number;
        slot.dataset.number = contestant.number;
        slot.addEventListener('click', handleSlotClick);
        slotMachine.appendChild(slot);
    });

    spinButton.disabled = false;
};

const handleSlotClick = (e) => {
    if (isSpinning || contestants.length === 0) return;

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

    // Remove from available contestants
    contestants = contestants.filter((c) => c.number !== number);

    slot.remove();
    updateSelectedContestantsDisplay();

    // Check if round is complete
    if (contestants.length === 0) {
        spinButton.disabled = true;
        spinButton.textContent = 'Sorteo finalizado';

        // Enable next round button if there are more rounds
        if (currentRound < currentClass.rounds) {
            nextRoundButton.disabled = false;
        }
    }
};

const shuffleArray = (array) => {
    return array.slice().sort(() => Math.random() - 0.5);
};

const spinSlots = () => {
    if (contestants.length === 0 || isSpinning) return;

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
                spinButton.textContent = 'Girar bolillero';
            } else {
                spinButton.disabled = true;
                spinButton.textContent = 'Sorteo finalizado';

                if (currentRound < currentClass.rounds) {
                    nextRoundButton.disabled = false;
                }
            }
        }
    }, intervalDuration);
};

const updateSelectedContestantsDisplay = () => {
    selectedContestantsDisplay.innerHTML = '';

    // Group by round
    const rounds = {};
    selectedContestants.forEach((item) => {
        if (!rounds[item.round]) {
            rounds[item.round] = [];
        }
        rounds[item.round].push(item);
    });

    // Display each round's results
    for (const [round, items] of Object.entries(rounds)) {
        const roundHeader = document.createElement('h4');
        roundHeader.classList.add('mt-3', 'mb-2');
        roundHeader.textContent = `Ronda ${round}:`;
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

    // Scroll to bottom
    selectedContestantsDisplay.scrollIntoView({ behavior: 'smooth', block: 'end' });
};

const startNewRound = () => {
    currentRound++;
    hitsCounter = 0;
    contestants = [...originalContestants];
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
        defaultOption.textContent = 'Seleccione una categoría';
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


// MAIN
classSelect.addEventListener('change', (e) => {
    const selectedClassName = e.target.value;
    if (!selectedClassName) return;

    const selectedClass = classes.find((c) => c.class === selectedClassName);
    if (selectedClass) {
        loadClassData(selectedClass);
        subtitle.style.display = 'none';
    }
});

spinButton.addEventListener('click', spinSlots);
nextRoundButton.addEventListener('click', startNewRound);

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
                    installButton.style.display = 'none'; // Hide after installation
                });
            });
        }
    });
}

loadClasses();

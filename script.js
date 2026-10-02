'use strict';

const frogButton = document.querySelector('.frog-button');
const frogSpeech = document.querySelector('.ribbit');
const boostButtons = [
  document.querySelector('.boost-btn'),
  document.querySelector('#boost-more'),
];
const pepQuote = document.querySelector('#pep-quote');
const pepNote = document.querySelector('#pep-note');
const moodResponse = document.querySelector('#mood-response');
const moodButtons = [...document.querySelectorAll('[data-mood]')];
const breathingDialog = document.querySelector('#breathing-dialog');
const breathOrb = document.querySelector('#breath-orb');
const breathingPrompt = document.querySelector('#breathing-prompt');
const breathingCycle = document.querySelector('#breathing-cycle');
const breathAgainButton = document.querySelector('#breath-again');
const joyDialog = document.querySelector('#joy-dialog');
const joySuggestion = document.querySelector('#joy-suggestion');
const noteDialog = document.querySelector('#note-dialog');
const soundToggle = document.querySelector('#sound-toggle');
const ambientAudio = new Audio('./meditate.mp3');
ambientAudio.loop = true;
ambientAudio.preload = 'auto';
ambientAudio.volume = 0.25;
ambientAudio.load();
const pingAudio = new Audio('./ping.mp3');
pingAudio.preload = 'auto';
pingAudio.volume = 0.3;
pingAudio.load();

const pepTalks = [
  ['You can take this one small step at a time.', 'There is no prize for doing it all at once.'],
  ['You have made it through hard days before.', 'You do not have to solve everything today.'],
  ['Rest is part of making progress.', 'Pausing is a perfectly good next step.'],
  ['Being here is already enough.', 'You are worthy of care exactly as you are.'],
  ['You do not need to feel ready to begin.', 'A tiny, wobbly hop still counts.'],
  ['There is room for you, just as you are.', 'You belong here on every kind of day.'],
];

const moodMessages = {
  low: 'It is okay to feel low. You do not have to fix that feeling right now.',
  okay: 'Doing okay is enough for today. Take things at your own pace.',
  good: 'Let yourself enjoy this moment, just as it is.',
};

const joyIdeas = [
  'Step outside for one slow breath of fresh air, and notice how the light feels.',
  'Put on a favorite song and dance for the length of its chorus.',
  'Find three colors around you that you like.',
  'Make yourself a warm drink and enjoy the first sip without rushing.',
  'Send a kind message to someone you are glad to know.',
  'Stretch your arms overhead, then let your shoulders soften.',
];

const frogMessages = [
  'you’ve got this!',
  'one small hop is enough.',
  'you deserve a gentle day.',
  'it’s okay to take your time.',
  'you’re doing better than you think.',
  'rest counts, too.',
  'you can begin again whenever you need.',
  'you are welcome here, exactly as you are.',
];

let pepTalkIndex = -1;
let joyIdeaIndex = -1;
let frogMessageIndex = -1;
let breathInterval = null;
let breathCycleNumber = 1;
let breathingActive = false;
let breathingSoundWasOn = false;
let breathingSoundChangedByUser = false;
let breathingSoundManaged = false;
let frogHopTimer = null;
let frogSpeechTimer = null;

function makeFrogHop(showSpeech = false) {
  playPing();
  frogButton.classList.remove('is-hopping');
  void frogButton.offsetWidth;
  frogButton.classList.add('is-hopping');
  clearTimeout(frogHopTimer);
  frogHopTimer = setTimeout(() => {
    frogButton.classList.remove('is-hopping');
  }, 700);

  if (showSpeech) {
    frogMessageIndex = (frogMessageIndex + 1) % frogMessages.length;
    frogSpeech.textContent = frogMessages[frogMessageIndex];
    frogSpeech.hidden = false;
    clearTimeout(frogSpeechTimer);
    frogSpeechTimer = setTimeout(() => {
      frogSpeech.hidden = true;
    }, 2200);
  }
}

function playPing() {
  if (soundToggle.getAttribute('aria-pressed') !== 'true') {
    return;
  }

  pingAudio.pause();
  pingAudio.currentTime = 0;
  pingAudio.play().catch(() => {});
}

function showNextPepTalk() {
  pepTalkIndex = (pepTalkIndex + 1) % pepTalks.length;
  pepQuote.textContent = `“${pepTalks[pepTalkIndex][0]}”`;
  pepNote.textContent = pepTalks[pepTalkIndex][1];
  makeFrogHop();
}

frogButton.addEventListener('click', () => makeFrogHop(true));
boostButtons.forEach((button) => button.addEventListener('click', showNextPepTalk));

moodButtons.forEach((button) => {
  button.addEventListener('click', () => {
    playPing();
    moodButtons.forEach((choice) => {
      choice.setAttribute('aria-pressed', String(choice === button));
    });
    moodResponse.textContent = moodMessages[button.dataset.mood];
    moodResponse.hidden = false;
  });
});

function openDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
  }
}

document.querySelectorAll('[data-dialog-close]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
  }
});

document.querySelector('#open-note').addEventListener('click', () => {
  playPing();
  openDialog(noteDialog);
});

document.querySelector('.breathe-card .text-button').addEventListener('click', () => {
  playPing();
  openDialog(breathingDialog);
  startBreathing();
});

function startBreathing() {
  breathingSoundWasOn = soundToggle.getAttribute('aria-pressed') === 'true';
  breathingSoundChangedByUser = false;
  breathingSoundManaged = !breathingSoundWasOn;
  breathingActive = true;
  if (breathingSoundManaged) {
    setAmbientSound(true);
  }

  clearTimeout(breathInterval);
  breathCycleNumber = 1;
  breathAgainButton.hidden = true;
  breathOrb.classList.remove('is-inhaling', 'is-exhaling');
  runBreathPhase('in');
}

function runBreathPhase(phase) {
  breathOrb.classList.remove('is-inhaling', 'is-exhaling');
  void breathOrb.offsetWidth;
  breathOrb.classList.add(phase === 'in' ? 'is-inhaling' : 'is-exhaling');
  breathingCycle.textContent = `Cycle ${breathCycleNumber} of 4`;

  breathingPrompt.textContent = phase === 'in'
    ? 'Breathe in for four seconds.'
    : 'Breathe out for four seconds.';
  clearTimeout(breathInterval);
  breathInterval = setTimeout(() => {
    if (phase === 'in') {
      runBreathPhase('out');
    } else if (breathCycleNumber < 4) {
      breathCycleNumber += 1;
      runBreathPhase('in');
    } else {
      finishBreathing();
    }
  }, 4000);
}

function finishBreathing() {
  breathingActive = false;
  breathOrb.classList.remove('is-inhaling', 'is-exhaling');
  breathingPrompt.textContent = 'You completed four gentle breaths. Take that softness with you.';
  breathingCycle.textContent = '32 seconds, one breath at a time.';
  breathAgainButton.hidden = false;
  restoreAmbientAfterBreathing();
}

function restoreAmbientAfterBreathing() {
  if (breathingSoundManaged && !breathingSoundChangedByUser) {
    setAmbientSound(false);
  }
  breathingSoundWasOn = false;
  breathingSoundManaged = false;
}

breathAgainButton.addEventListener('click', () => {
  playPing();
  startBreathing();
});
breathingDialog.addEventListener('close', () => {
  breathingActive = false;
  clearTimeout(breathInterval);
  breathOrb.classList.remove('is-inhaling', 'is-exhaling');
  restoreAmbientAfterBreathing();
});

function showNextJoyIdea() {
  joyIdeaIndex = (joyIdeaIndex + 1) % joyIdeas.length;
  joySuggestion.textContent = joyIdeas[joyIdeaIndex];
}

document.querySelector('.pocket-card .text-button').addEventListener('click', () => {
  playPing();
  showNextJoyIdea();
  openDialog(joyDialog);
});
document.querySelector('#another-joy').addEventListener('click', () => {
  playPing();
  showNextJoyIdea();
});

async function setAmbientSound(enabled) {
  if (!enabled) {
    ambientAudio.pause();
    soundToggle.textContent = 'Sound off';
    soundToggle.setAttribute('aria-pressed', 'false');
    return;
  }

  try {
    await ambientAudio.play();
    soundToggle.textContent = 'Sound on';
    soundToggle.setAttribute('aria-pressed', 'true');
  } catch {
    soundToggle.textContent = 'Sound unavailable';
    soundToggle.setAttribute('aria-pressed', 'false');
  }
}

soundToggle.addEventListener('click', () => {
  const shouldEnable = soundToggle.getAttribute('aria-pressed') !== 'true';
  if (breathingActive) {
    breathingSoundChangedByUser = true;
  }
  setAmbientSound(shouldEnable);
});

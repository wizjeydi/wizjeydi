const musicToggle = document.getElementById('musicToggle') as HTMLButtonElement | null;
const nightModeToggle = document.getElementById('nightModeToggle') as HTMLButtonElement | null;
const openHeart = document.getElementById('openHeart') as HTMLButtonElement | null;
const typingText = document.getElementById('typingText') as HTMLParagraphElement | null;
const noteText = document.getElementById('noteText') as HTMLParagraphElement | null;
const loveLetterModal = document.getElementById('loveLetterModal') as HTMLDivElement | null;
const closeModal = document.getElementById('closeModal') as HTMLButtonElement | null;
const closeNote = document.getElementById('closeNote') as HTMLButtonElement | null;
const timeSince = document.getElementById('timeSince') as HTMLDivElement | null;
const petalField = document.getElementById('petalField') as HTMLDivElement | null;
const flowerCards = Array.from(document.querySelectorAll<HTMLElement>('.flower-card'));
const body = document.body;

const sectionIds = ['hero', 'message', 'bouquet', 'memories', 'final'] as const;
const sectionEls = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
let currentStep = 0;

const setSection = (index: number) => {
  currentStep = Math.max(0, Math.min(index, sectionEls.length - 1));
  sectionEls.forEach((section, idx) => {
    if (idx === currentStep) {
      section.classList.remove('hidden', 'opacity-0', 'translate-y-12');
      section.classList.add('opacity-100');
      section.style.zIndex = String(50 - idx);
    } else {
      section.classList.add('hidden', 'opacity-0', 'translate-y-12');
      section.classList.remove('opacity-100');
      section.style.zIndex = '0';
    }
  });
};

const loveMessage = `Every moment with you feels like spring. Like flowers blooming after the rain, you brought color into my life.`;
let typingIndex = 0;

interface AudioState {
  enabled: boolean;
  context: AudioContext | null;
  master: GainNode | null;
  timerId: number | null;
}

const audioState: AudioState = {
  enabled: false,
  context: null,
  master: null,
  timerId: null
};

const createAudioContext = (): AudioState => {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const playAmbient = () => {
    const createTone = (freq: number, duration: number, delay = 0) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(context.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.12, context.currentTime + delay + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + duration);
      oscillator.stop(context.currentTime + delay + duration + 0.1);
    };

    createTone(220, 5);
    createTone(280, 4.4, 1.5);
    createTone(340, 4.6, 3.2);
    createTone(420, 5.2, 5.1);
  };

  const intervalId = window.setInterval(playAmbient, 12000);
  playAmbient();

  return { enabled: true, context, master, timerId: intervalId };
};

const setAudioEnabled = (enabled: boolean) => {
  if (!audioState.context) {
    const state = createAudioContext();
    audioState.context = state.context;
    audioState.master = state.master;
    audioState.timerId = state.timerId;
  }

  audioState.enabled = enabled;

  if (audioState.master && audioState.context) {
    const now = audioState.context.currentTime;
    audioState.master.gain.cancelScheduledValues(now);
    audioState.master.gain.setTargetAtTime(enabled ? 0.14 : 0, now, 0.03);
  }

  if (enabled && audioState.timerId === null && audioState.context) {
    audioState.timerId = window.setInterval(() => {
      if (audioState.enabled) {
        playTypingTone();
      }
    }, 12000);
  }

  if (!enabled && audioState.timerId !== null) {
    window.clearInterval(audioState.timerId);
    audioState.timerId = null;
  }

  if (musicToggle) {
    musicToggle.textContent = enabled ? 'Pause Music' : 'Play Music';
  }
};

const playTypingTone = () => {
  if (!audioState.enabled || !audioState.context || !audioState.master) {
    return;
  }

  const oscillator = audioState.context.createOscillator();
  const gain = audioState.context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 520;
  gain.gain.value = 0;
  oscillator.connect(gain);
  gain.connect(audioState.master);

  const now = audioState.context.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  oscillator.start(now);
  oscillator.stop(now + 0.2);
};

musicToggle?.addEventListener('click', () => {
  const isEnabled = !audioState.enabled;
  setAudioEnabled(isEnabled);
});

nightModeToggle?.addEventListener('click', () => {
  body.classList.toggle('dark');
  if (body.classList.contains('dark')) {
    body.classList.add('bg-[#0e081e]', 'text-[#f8f1ff]');
    body.classList.remove('bg-gradient-to-b');
    nightModeToggle.textContent = 'Bright Garden';
  } else {
    body.classList.remove('bg-[#0e081e]', 'text-[#f8f1ff]');
    body.classList.add('bg-gradient-to-b');
    nightModeToggle.textContent = 'Moonlight';
  }
});

openHeart?.addEventListener('click', () => {
  setSection(1);
  // ensure audio permission is available when entering message
  if (!audioState.enabled && audioState.context === null) {
    // will enable audio only when user interacts (handled elsewhere)
  }
});

flowerCards.forEach((card) => {
  const note = card.dataset.note ?? '';

  card.addEventListener('mouseenter', () => {
    card.classList.add('scale-[1.03]');
    if (noteText) {
      noteText.textContent = note;
    }
  });

  card.addEventListener('mouseleave', () => {
    card.classList.remove('scale-[1.03]');
    if (noteText) {
      noteText.textContent = 'Hover or click a flower to see your message.';
    }
  });

  card.addEventListener('click', () => {
    if (!audioState.enabled) {
      setAudioEnabled(true);
    }
    playTypingTone();
    if (noteText) {
      noteText.textContent = note;
    }
    // Open the notebook-style modal showing the flower's note and a short confession
    if (loveLetterModal) {
      const titleEl = loveLetterModal.querySelector('.modal-title') as HTMLElement | null;
      const bodyEl = document.getElementById('modalBody') as HTMLElement | null;
      if (titleEl) titleEl.textContent = 'A Little Letter';
      if (bodyEl) {
        bodyEl.innerHTML = `<p class="mb-4">${escapeHtml(note)}</p><p>I have something honest to tell you: every time I see you, my heart blooms. You make ordinary days feel like spring, and I wanted to tell you how deeply I feel for you.</p>`;
      }
      loveLetterModal.classList.add('open');
      loveLetterModal.classList.remove('opacity-0', 'invisible');
    }
  });
});

// Navigation buttons
const seeBouquet = document.getElementById('seeBouquet') as HTMLButtonElement | null;
const toMemories = document.getElementById('toMemories') as HTMLButtonElement | null;
const restartFlowBtn = document.getElementById('restartFlow') as HTMLButtonElement | null;
const openLetter = document.getElementById('openLetter') as HTMLButtonElement | null;

seeBouquet?.addEventListener('click', () => setSection(2));
toMemories?.addEventListener('click', () => setSection(3));
restartFlowBtn?.addEventListener('click', () => setSection(0));

// Confession modal: reuse existing loveLetterModal to show confession when requested
openLetter?.addEventListener('click', () => {
  if (!loveLetterModal) return;
  const titleEl = loveLetterModal.querySelector('.modal-title') as HTMLElement | null;
  const bodyEl = document.getElementById('modalBody') as HTMLElement | null;
  if (titleEl) titleEl.textContent = 'My Confession';
  if (bodyEl) bodyEl.innerHTML = `<p class="mb-4">I have something honest to tell you:</p><p>Every time I see you, my heart blooms. You make ordinary days feel like spring, and I wanted to tell you how deeply I feel for you.</p>`;
  loveLetterModal.classList.add('open');
  loveLetterModal.classList.remove('opacity-0', 'invisible');
});

closeModal?.addEventListener('click', () => {
  loveLetterModal?.classList.remove('open');
  loveLetterModal?.classList.add('opacity-0');
  loveLetterModal?.classList.add('invisible');
});

closeNote?.addEventListener('click', () => {
  loveLetterModal?.classList.remove('open');
  loveLetterModal?.classList.add('opacity-0');
  loveLetterModal?.classList.add('invisible');
});

loveLetterModal?.addEventListener('click', (event) => {
  if (event.target === loveLetterModal) {
    loveLetterModal.classList.remove('open');
    loveLetterModal.classList.add('opacity-0');
    loveLetterModal.classList.add('invisible');
  }
});

// helper for escaping
function escapeHtml(unsafe: string) {
  return unsafe.replace(/[&<"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#96;',
      '=': '&#61;'
    } as Record<string, string>)[s];
  });
}

const typeMessage = () => {
  if (!typingText) {
    return;
  }

  if (typingIndex <= loveMessage.length) {
    typingText.textContent = loveMessage.slice(0, typingIndex);
    if (typingIndex > 0) {
      playTypingTone();
    }
    typingIndex += 1;
    window.setTimeout(typeMessage, 70 + Math.random() * 40);
  }
};

typeMessage();

const startDate = new Date('2022-08-14T00:00:00');
const updateTimer = () => {
  if (!timeSince) {
    return;
  }

  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  timeSince.textContent = `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

updateTimer();
window.setInterval(updateTimer, 1000);

const createPetals = () => {
  if (!petalField) {
    return;
  }

  for (let i = 0; i < 40; i += 1) {
    const petal = document.createElement('div');
    petal.className = 'absolute h-[18px] w-[12px] rounded-full bg-gradient-to-br from-[#ffe9f5] via-[#ffc9dd] to-[#ffa6c8] opacity-90';
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.top = `${-20 - Math.random() * 20}vh`;
    petal.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.85 + Math.random() * 0.4})`;
    petal.style.animation = `fall ${10 + Math.random() * 14}s ${Math.random() * -8}s linear infinite`;
    petalField.appendChild(petal);
  }
};

createPetals();

// Preserve reveal animation for visible sections
const sectionReveal = document.querySelectorAll('.section');
sectionReveal.forEach((section) => {
  section.classList.add('opacity-0', 'translate-y-12');
  section.addEventListener('animationend', () => {
    section.classList.remove('opacity-0', 'translate-y-12');
  });
});

window.addEventListener('load', () => {
  sectionReveal.forEach((section, index) => {
    window.setTimeout(() => {
      section.classList.remove('opacity-0', 'translate-y-12');
      section.classList.add('opacity-100');
    }, 150 * index);
  });
});

const cursorTrail = document.createElement('div');
cursorTrail.className = 'fixed pointer-events-none h-6 w-6 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(255,207,223,0.3),transparent)] blur-xl';
document.body.appendChild(cursorTrail);

document.addEventListener('mousemove', (event) => {
  cursorTrail.style.left = `${event.clientX}px`;
  cursorTrail.style.top = `${event.clientY}px`;
});

document.addEventListener('pointerdown', () => {
  if (!audioState.context) {
    setAudioEnabled(true);
    setTimeout(() => setAudioEnabled(false), 400);
  }
});

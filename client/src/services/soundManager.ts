// Sistema de Sons de Reação com Web Audio API
// Cria sons sintetizados para reações e eventos

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted = false;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || this.isMuted) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playSequence(frequencies: number[], duration: number, delay: number = 100) {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, duration, 'sine', 0.2);
      }, index * delay);
    });
  }

  // Som de celebração (vitória)
  playCelebration() {
    if (this.isMuted) return;
    // Sequência ascendente: Do, Mi, Sol, Do (oitava acima)
    this.playSequence([262, 330, 392, 523], 0.3, 150);
  }

  // Som de gol
  playGoal() {
    if (this.isMuted) return;
    // Som épico de gol
    this.playTone(523, 0.1, 'square', 0.4); // Do agudo
    setTimeout(() => this.playTone(659, 0.15, 'square', 0.4), 100); // Mi
    setTimeout(() => this.playTone(784, 0.2, 'square', 0.4), 250); // Sol
  }

  // Som de frustração
  playFrustration() {
    if (this.isMuted) return;
    // Sequência descendente
    this.playSequence([392, 330, 262, 196], 0.2, 100);
  }

  // Som de raiva
  playRage() {
    if (this.isMuted) return;
    // Som grave e agressivo
    this.playTone(110, 0.3, 'square', 0.5);
    setTimeout(() => this.playTone(165, 0.2, 'square', 0.5), 150);
  }

  // Som de surpresa
  playSurprise() {
    if (this.isMuted) return;
    // Som agudo e rápido
    this.playTone(880, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(1046, 0.15, 'sine', 0.3), 80);
  }

  // Som de acerto
  playSuccess() {
    if (this.isMuted) return;
    // Dois tons ascendentes
    this.playTone(523, 0.15, 'sine', 0.3);
    setTimeout(() => this.playTone(659, 0.2, 'sine', 0.3), 150);
  }

  // Som de erro
  playError() {
    if (this.isMuted) return;
    // Dois tons descendentes
    this.playTone(392, 0.15, 'sine', 0.3);
    setTimeout(() => this.playTone(262, 0.2, 'sine', 0.3), 150);
  }

  // Som de notificação
  playNotification() {
    if (this.isMuted) return;
    this.playTone(440, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(554, 0.15, 'sine', 0.2), 100);
  }

  // Som de combo
  playCombo(comboCount: number) {
    if (this.isMuted) return;
    const frequencies = [523, 659, 784, 1047]; // Do, Mi, Sol, Do (oitava)
    const freq = frequencies[Math.min(comboCount - 1, frequencies.length - 1)];
    this.playTone(freq, 0.2, 'sine', 0.3);
  }

  // Som de derrota
  playDefeat() {
    if (this.isMuted) return;
    // Sequência triste descendente
    this.playSequence([392, 349, 330, 294], 0.3, 200);
  }

  // Som de vitória épica
  playEpicVictory() {
    if (this.isMuted) return;
    // Fanfarra épica
    const frequencies = [262, 262, 262, 330, 392, 523, 659];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.3);
      }, index * 150);
    });
  }

  // Som de record quebrado
  playNewRecord() {
    if (this.isMuted) return;
    // Som especial para novo recorde
    this.playSequence([523, 659, 784, 1047], 0.25, 100);
    setTimeout(() => {
      this.playSequence([1047, 784, 659, 523], 0.25, 100);
    }, 600);
  }

  // Alternar mudo
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Definir volume (nota: volume é controlado por gain nodes individuais)
  setVolume(volume: number) {
    // Volume é controlado por gain nodes em cada som
    // Este método pode ser expandido para controlar volume global
    console.log(`Volume definido para: ${Math.max(0, Math.min(volume, 1))}`);
  }

  // Obter estado de mudo
  getMuted() {
    return this.isMuted;
  }
}

// Instância singleton
let soundManagerInstance: SoundManager | null = null;

export function initSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

// A little bubble "bloop" made with the Web Audio API, so there's no sound file to load.

let audio: AudioContext | undefined;

/** How loud the pop is, from 0 (silent) to 1 (very loud). */
const VOLUME = 0.4;

export function playPop() {
	try {
		// Browsers only allow sound after the person interacts with the page,
		// so the audio engine is started on the first click.
		audio ??= new AudioContext();
		if (audio.state === 'suspended') void audio.resume();

		const now = audio.currentTime;
		// Nudge the pitch a little each time so repeated clicks don't sound robotic.
		const pitch = 0.9 + Math.random() * 0.2;

		// A bubble pop is a quick upward "bloop": the tone slides up fast...
		const tone = audio.createOscillator();
		tone.type = 'sine';
		tone.frequency.setValueAtTime(300 * pitch, now);
		tone.frequency.exponentialRampToValueAtTime(1000 * pitch, now + 0.05);

		// ...and fades out almost immediately.
		const volume = audio.createGain();
		volume.gain.setValueAtTime(0.0001, now);
		volume.gain.exponentialRampToValueAtTime(VOLUME, now + 0.005);
		volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

		tone.connect(volume).connect(audio.destination);
		tone.start(now);
		tone.stop(now + 0.11);
	} catch {
		// This browser can't play generated sound: clicks just stay silent.
	}
}

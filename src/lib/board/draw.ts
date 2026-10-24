import { OLED, hexToPixels } from './oled.ts';

/** Colours that match the real yellow/blue OLED. */
export const OLED_COLORS = { off: '#0b0b0b', grid: '#1e1e1e', yellow: '#ffd23f', blue: '#4aa8ff' };

/** Draws a whole screen of pixels (hex or raw) onto a canvas, `scale` canvas pixels per screen pixel. */
export function drawOled(canvas: HTMLCanvasElement, pixels: string | Uint8Array, scale = 2) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;
	const data = typeof pixels === 'string' ? hexToPixels(pixels) : pixels;
	ctx.fillStyle = OLED_COLORS.off;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	for (let y = 0; y < OLED.height; y++) {
		ctx.fillStyle = y < OLED.yellowRows ? OLED_COLORS.yellow : OLED_COLORS.blue;
		for (let x = 0; x < OLED.width; x++) {
			if (data[y * OLED.width + x]) ctx.fillRect(x * scale, y * scale, scale, scale);
		}
	}
}

/** The 0.96" SSD1306 OLED on the hairclip, and how it's wired. */
export const OLED = {
	width: 128,
	height: 64,
	/** The top rows glow yellow; the rest glow blue. */
	yellowRows: 16,
	/** GPIO pins the screen is wired to. */
	sda: 4,
	scl: 5
} as const;

/** The lines every program needs to talk to the screen. */
export const oledSetup = `from machine import I2C, Pin
import ssd1306

# Your screen is wired to SDA = GPIO ${OLED.sda} and SCL = GPIO ${OLED.scl}
i2c = I2C(0, scl=Pin(${OLED.scl}), sda=Pin(${OLED.sda}))
oled = ssd1306.SSD1306_I2C(${OLED.width}, ${OLED.height}, i2c)`;

/**
 * Packs pixels (1 = on, row by row) into hex in MicroPython's MONO_HLSB format:
 * each byte is 8 pixels side by side, leftmost pixel in the highest bit.
 */
export function pixelsToHex(pixels: Uint8Array): string {
	let hex = '';
	for (let y = 0; y < OLED.height; y++) {
		for (let x = 0; x < OLED.width; x += 8) {
			let byte = 0;
			for (let bit = 0; bit < 8; bit++) {
				if (pixels[y * OLED.width + x + bit]) byte |= 0x80 >> bit;
			}
			hex += byte.toString(16).padStart(2, '0');
		}
	}
	return hex;
}

export function hexToPixels(hex: string): Uint8Array {
	const pixels = new Uint8Array(OLED.width * OLED.height);
	for (let i = 0; i < pixels.length / 8; i++) {
		const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0;
		for (let bit = 0; bit < 8; bit++) pixels[i * 8 + bit] = byte & (0x80 >> bit) ? 1 : 0;
	}
	return pixels;
}

/** A complete MicroPython program that shows a doodle on the screen. */
export function doodleProgram(pixels: Uint8Array): string {
	const hex = pixelsToHex(pixels);
	// 64 hex characters per line = two rows of pixels, so the code stays readable.
	const lines: string[] = [];
	for (let i = 0; i < hex.length; i += 64) lines.push(`    '${hex.slice(i, i + 64)}'`);
	return `${oledSetup}
import framebuf
from binascii import unhexlify

# Your doodle: each hex digit is 4 pixels, ${OLED.width / 4} digits per row of the screen.
DOODLE = (
${lines.join('\n')}
)

image = framebuf.FrameBuffer(bytearray(unhexlify(DOODLE)), ${OLED.width}, ${OLED.height}, framebuf.MONO_HLSB)
oled.fill(0)
oled.blit(image, 0, 0)
oled.show()
`;
}

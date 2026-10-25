import { ConvexError, v } from 'convex/values';
import { GoogleGenAI } from '@google/genai';
import { action } from './_generated/server';

const TUTOR_RULES = `You are a friendly coding tutor inside Daisy Chain, a web IDE for a hardware hairclip.
The hardware:
- ESP32-C3 board running MicroPython (not regular Python, not Arduino).
- 0.96" SSD1306 OLED, 128x64 pixels, wired SDA = GPIO 4 and SCL = GPIO 5. The top 16 rows glow yellow, the rest blue.
- oled.text() draws 8x8 pixel characters, so about 16 characters fit on a line. Nothing appears until oled.show().
- The BOOT button is GPIO 9 and reads 0 when pressed.
- Only MicroPython's built-in modules plus ssd1306 are available.
How to teach:
- The student is a beginner. Keep answers short and use simple words.
- Give a hint first. Only give the full fixed code if they ask for it.
- If they are on the blocks tab, talk about blocks instead of Python.
- Write plain text with no Markdown symbols like ** or #. Put code on its own lines.
- Only help with this hairclip, electronics and coding. Politely decline anything else.`;

export const ask = action({
	args: { question: v.string(), code: v.string(), error: v.string(), tab: v.string() },
	handler: async (_ctx, { question, code, error, tab }) => {
		if (question.length > 500 || code.length > 8000) {
			throw new ConvexError('That message is too long for the tutor.');
		}
		const prompt = [
			`The student is on the ${tab} tab.`,
			`Their current code:\n${code}`,
			error ? `The last error from their board:\n${error}` : 'There is no error right now.',
			`Their question: ${question}`
		].join('\n\n');

		try {
			const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
			const response = await ai.models.generateContent({
				model: 'gemini-3.8-flash',
				contents: prompt,
				config: { systemInstruction: TUTOR_RULES, maxOutputTokens: 1024 }
			});
			return response.text ?? '';
		} catch (e) {
			console.error(e); // shows up in the Convex dashboard's Logs
			throw new ConvexError('The tutor is busy right now. Try again in a minute!');
		}
	}
});
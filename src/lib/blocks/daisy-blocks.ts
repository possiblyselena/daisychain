/**
 * Daisy Chain's block-coding setup for Blockly: the blocks, how each turns into MicroPython,
 * the colours from the Figma "code blocks" design, and the toolbox.
 *
 * Load this only in the browser (the IDE page does it when the blocks tab opens).
 */
import * as Blockly from 'blockly/core';
import 'blockly/blocks'; // built-in logic, maths, text and variable blocks
import * as En from 'blockly/msg/en';
import { pythonGenerator, Order } from 'blockly/python';
import { OLED, oledSetup } from '#lib/board/oled.ts';

Blockly.setLocale(En as unknown as Parameters<typeof Blockly.setLocale>[0]);

// ---------------------------------------------------------------- look (from the Figma design)

const COLORS = {
	events: '#F8BD90', // orange: "on start"
	loops: '#FFB3EC', // pink: "forever", "for"
	screen: '#96B6F5', // blue: "clear screen", "write", "draw"
	slot: '#D9D9D9', // grey value slots
	// Not in the design yet; picked to sit alongside the colours above.
	button: '#7DCFC4',
	logic: '#C3A6F2',
	math: '#8FD3A8',
	text: '#F2A7A7',
	variables: '#F2C46D'
};

/** A slightly darker shade of a colour, for block outlines. */
const darken = (hex: string, amount = 0.18) =>
	'#' +
	[1, 3, 5]
		.map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount)))
		.map((v) => v.toString(16).padStart(2, '0'))
		.join('');

const style = (colour: string) => ({
	colourPrimary: colour,
	colourSecondary: colour,
	colourTertiary: darken(colour)
});

export const daisyTheme = Blockly.Theme.defineTheme('daisychain', {
	name: 'daisychain',
	base: Blockly.Themes.Classic,
	blockStyles: {
		event_blocks: style(COLORS.events),
		loop_blocks: style(COLORS.loops),
		screen_blocks: style(COLORS.screen),
		button_blocks: style(COLORS.button),
		logic_blocks: style(COLORS.logic),
		// Number and text blocks sitting in a slot (shadows) use the grey slot colour.
		math_blocks: { ...style(COLORS.math), colourSecondary: COLORS.slot },
		text_blocks: { ...style(COLORS.text), colourSecondary: COLORS.slot },
		variable_blocks: style(COLORS.variables),
		slot_blocks: style(COLORS.slot)
	},
	categoryStyles: {
		event_category: { colour: COLORS.events },
		loop_category: { colour: COLORS.loops },
		screen_category: { colour: COLORS.screen },
		button_category: { colour: COLORS.button },
		logic_category: { colour: COLORS.logic },
		math_category: { colour: COLORS.math },
		text_category: { colour: COLORS.text },
		variable_category: { colour: COLORS.variables }
	},
	componentStyles: {
		workspaceBackgroundColour: '#d9d9d9',
		toolboxBackgroundColour: '#ffed76',
		toolboxForegroundColour: '#000000',
		flyoutBackgroundColour: '#efefef',
		flyoutOpacity: 1,
		scrollbarColour: '#9a9a9a',
		scrollbarOpacity: 0.5,
		insertionMarkerColour: '#000000',
		insertionMarkerOpacity: 0.25
	},
	fontStyle: { family: 'Karma, Georgia, serif', weight: 'bold', size: 15 }
});

/** Zelos (Scratch-style) blocks with rounder corners and hexagon-shaped value slots, like the design. */
class DaisyConstants extends Blockly.zelos.ConstantProvider {
	constructor() {
		super();
		this.CORNER_RADIUS = 10;
	}

	override shapeFor(connection: Blockly.RenderedConnection) {
		const type = connection.type;
		if (
			type === Blockly.ConnectionType.INPUT_VALUE ||
			type === Blockly.ConnectionType.OUTPUT_VALUE
		) {
			return this.HEXAGONAL!;
		}
		return super.shapeFor(connection);
	}
}

class DaisyRenderer extends Blockly.zelos.Renderer {
	protected override makeConstants_() {
		return new DaisyConstants();
	}
}

// Only register once (the module can be loaded again during development).
if (!Blockly.registry.hasItem(Blockly.registry.Type.RENDERER, 'daisychain')) {
	Blockly.blockRendering.register('daisychain', DaisyRenderer);
}

// ---------------------------------------------------------------- our blocks

/** Lines of text on the screen: line 1 sits in the yellow strip, the rest in the blue area. */
const LINE_Y = [4, 18, 28, 38, 48, 56];
const lineOptions: [string, string][] = LINE_Y.map((_, i) => [
	i === 0 ? '1 (yellow)' : String(i + 1),
	String(i)
]);

Blockly.common.defineBlocksWithJsonArray([
	{
		type: 'daisy_on_start',
		message0: 'on start',
		nextStatement: null,
		style: 'event_blocks',
		tooltip: 'Everything under this runs when your hairclip starts.'
	},
	{
		type: 'daisy_forever',
		message0: 'forever %1',
		args0: [{ type: 'input_statement', name: 'DO' }],
		previousStatement: null,
		style: 'loop_blocks',
		tooltip: 'Runs the blocks inside over and over, forever.'
	},
	{
		type: 'daisy_repeat',
		message0: 'for %1 times',
		args0: [{ type: 'input_value', name: 'TIMES', check: 'Number' }],
		message1: '%1',
		args1: [{ type: 'input_statement', name: 'DO' }],
		previousStatement: null,
		nextStatement: null,
		style: 'loop_blocks',
		tooltip: 'Runs the blocks inside this many times.'
	},
	{
		type: 'daisy_wait',
		message0: 'wait %1 seconds',
		args0: [{ type: 'input_value', name: 'SECONDS', check: 'Number' }],
		previousStatement: null,
		nextStatement: null,
		style: 'loop_blocks',
		tooltip: 'Shows what you drew so far, then pauses.'
	},
	{
		type: 'daisy_clear_screen',
		message0: 'clear screen',
		previousStatement: null,
		nextStatement: null,
		style: 'screen_blocks',
		tooltip: 'Turns every pixel off.'
	},
	{
		type: 'daisy_write',
		message0: 'write %1 on line %2',
		args0: [
			{ type: 'input_value', name: 'TEXT' },
			{ type: 'field_dropdown', name: 'LINE', options: lineOptions }
		],
		inputsInline: true,
		previousStatement: null,
		nextStatement: null,
		style: 'screen_blocks',
		tooltip: 'Writes text on the screen. Line 1 glows yellow, the rest blue.'
	},
	{
		type: 'daisy_draw_doodle',
		message0: 'draw my doodle',
		previousStatement: null,
		nextStatement: null,
		style: 'screen_blocks',
		tooltip: 'Draws the picture from your doodle tab.'
	},
	{
		type: 'daisy_button_pressed',
		message0: 'BOOT button pressed?',
		output: 'Boolean',
		style: 'button_blocks',
		tooltip: 'True while the BOOT button on your board is held down.'
	},
	{
		type: 'daisy_print',
		message0: 'print %1',
		args0: [{ type: 'input_value', name: 'TEXT' }],
		previousStatement: null,
		nextStatement: null,
		style: 'text_blocks',
		tooltip: 'Shows a message in the console under the editor.'
	}
]);

// ---------------------------------------------------------------- how blocks become MicroPython

const py = pythonGenerator;
py.INDENT = '    ';
py.addReservedWords('oled,i2c,button,write,time,framebuf,ssd1306,machine,I2C,Pin,LINE_Y,DOODLE');

/** Programs only show what was drawn when they wait, at the end of each loop, and at the very end. */
const SHOW = 'oled.show()\n';

py.forBlock['daisy_on_start'] = () => '';

// Blockly's own "change by" block uses Python's `numbers` module, which MicroPython doesn't have.
py.forBlock['math_change'] = (block, gen) => {
	const name = gen.getVariableName(block.getFieldValue('VAR'));
	const delta = gen.valueToCode(block, 'DELTA', Order.ADDITIVE) || '0';
	return `${name} = (${name} or 0) + ${delta}\n`;
};
py.forBlock['daisy_forever'] = (block, gen) => {
	const body = gen.statementToCode(block, 'DO');
	return `while True:\n${body}${gen.INDENT}${SHOW}${gen.INDENT}time.sleep(0.02)\n`;
};
py.forBlock['daisy_repeat'] = (block, gen) => {
	const times = gen.valueToCode(block, 'TIMES', Order.NONE) || '0';
	const body = gen.statementToCode(block, 'DO');
	return `for _ in range(int(${times})):\n${body}${gen.INDENT}${SHOW}`;
};
py.forBlock['daisy_wait'] = (block, gen) => {
	const seconds = gen.valueToCode(block, 'SECONDS', Order.NONE) || '0';
	return `${SHOW}time.sleep(${seconds})\n`;
};
py.forBlock['daisy_clear_screen'] = () => 'oled.fill(0)\n';
py.forBlock['daisy_write'] = (block, gen) => {
	const text = gen.valueToCode(block, 'TEXT', Order.NONE) || "''";
	return `write(${text}, ${block.getFieldValue('LINE')})\n`;
};
py.forBlock['daisy_draw_doodle'] = () => 'oled.blit(DOODLE, 0, 0)\n';
py.forBlock['daisy_button_pressed'] = () => ['button.value() == 0', Order.RELATIONAL];
py.forBlock['daisy_print'] = (block, gen) => {
	const text = gen.valueToCode(block, 'TEXT', Order.NONE) || "''";
	return `print(${text})\n`;
};

const PRELUDE = `${oledSetup}
import time

# The BOOT button on your board (pressed = 0)
button = Pin(9, Pin.IN, Pin.PULL_UP)

# Where each line of text goes: line 1 is the yellow strip
LINE_Y = (${LINE_Y.join(', ')})

def write(text, line):
    oled.fill_rect(0, LINE_Y[line], ${OLED.width}, 8, 0)
    oled.text(str(text), 0, LINE_Y[line])
`;

/** Turns the blocks under every "on start" into one MicroPython program. */
export function workspaceToPython(workspace: Blockly.Workspace, doodleHex: string | null): string {
	py.init(workspace);
	const starts = workspace.getTopBlocks(true).filter((b) => b.type === 'daisy_on_start');
	const body = starts.map((b) => py.blockToCode(b) as string).join('');
	const program = py.finish(body).trim();

	let doodle = '';
	if (workspace.getBlocksByType('daisy_draw_doodle', false).length) {
		const hex = doodleHex ?? '0'.repeat((OLED.width * OLED.height) / 4); // blank if no doodle yet
		doodle = `
# Your doodle from the doodle tab
import framebuf
from binascii import unhexlify
DOODLE = framebuf.FrameBuffer(bytearray(unhexlify('${hex}')), ${OLED.width}, ${OLED.height}, framebuf.MONO_HLSB)
`;
	}

	if (!starts.length) {
		return `${PRELUDE}${doodle}\n# Drag an "on start" block in to begin!\n`;
	}
	return `${PRELUDE}${doodle}\n# ---- your blocks ----\n${program}\n${SHOW}`;
}

// ---------------------------------------------------------------- toolbox and starter program

const shadow = (type: string, fields: Record<string, unknown>) => ({ shadow: { type, fields } });

export const toolbox = {
	kind: 'categoryToolbox',
	contents: [
		{
			kind: 'category',
			name: 'Events',
			categorystyle: 'event_category',
			contents: [{ kind: 'block', type: 'daisy_on_start' }]
		},
		{
			kind: 'category',
			name: 'Loops',
			categorystyle: 'loop_category',
			contents: [
				{ kind: 'block', type: 'daisy_forever' },
				{
					kind: 'block',
					type: 'daisy_repeat',
					inputs: { TIMES: shadow('math_number', { NUM: 3 }) }
				},
				{
					kind: 'block',
					type: 'daisy_wait',
					inputs: { SECONDS: shadow('math_number', { NUM: 1 }) }
				}
			]
		},
		{
			kind: 'category',
			name: 'Screen',
			categorystyle: 'screen_category',
			contents: [
				{ kind: 'block', type: 'daisy_clear_screen' },
				{
					kind: 'block',
					type: 'daisy_write',
					inputs: { TEXT: shadow('text', { TEXT: 'hello :]' }) }
				},
				{ kind: 'block', type: 'daisy_draw_doodle' }
			]
		},
		{
			kind: 'category',
			name: 'Button',
			categorystyle: 'button_category',
			contents: [{ kind: 'block', type: 'daisy_button_pressed' }]
		},
		{
			kind: 'category',
			name: 'Logic',
			categorystyle: 'logic_category',
			contents: [
				{ kind: 'block', type: 'controls_if' },
				{ kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
				{ kind: 'block', type: 'logic_compare' },
				{ kind: 'block', type: 'logic_operation' },
				{ kind: 'block', type: 'logic_negate' },
				{ kind: 'block', type: 'logic_boolean' }
			]
		},
		{
			kind: 'category',
			name: 'Math',
			categorystyle: 'math_category',
			contents: [
				{ kind: 'block', type: 'math_number', fields: { NUM: 0 } },
				{
					kind: 'block',
					type: 'math_arithmetic',
					inputs: { A: shadow('math_number', { NUM: 1 }), B: shadow('math_number', { NUM: 1 }) }
				},
				{
					kind: 'block',
					type: 'math_random_int',
					inputs: { FROM: shadow('math_number', { NUM: 1 }), TO: shadow('math_number', { NUM: 6 }) }
				}
			]
		},
		{
			kind: 'category',
			name: 'Text',
			categorystyle: 'text_category',
			contents: [
				{ kind: 'block', type: 'text' },
				{ kind: 'block', type: 'text_join' },
				{ kind: 'block', type: 'daisy_print', inputs: { TEXT: shadow('text', { TEXT: 'hi!' }) } }
			]
		},
		{ kind: 'category', name: 'Variables', categorystyle: 'variable_category', custom: 'VARIABLE' }
	]
};

/** What a brand-new blocks tab shows: writes two lines, like the python starter code. */
export const starterWorkspace = {
	blocks: {
		languageVersion: 0,
		blocks: [
			{
				type: 'daisy_on_start',
				x: 30,
				y: 30,
				next: {
					block: {
						type: 'daisy_clear_screen',
						next: {
							block: {
								type: 'daisy_write',
								fields: { LINE: '0' },
								inputs: { TEXT: shadow('text', { TEXT: 'Daisy Chain!' }) },
								next: {
									block: {
										type: 'daisy_write',
										fields: { LINE: '1' },
										inputs: { TEXT: shadow('text', { TEXT: 'hello :]' }) }
									}
								}
							}
						}
					}
				}
			}
		]
	}
};

export { Blockly };

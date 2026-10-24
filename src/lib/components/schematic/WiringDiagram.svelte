<script lang="ts">
	import { OLED } from '#lib/board/oled.ts';

	// One wire per OLED pin, listed in the order the pins appear on the screen module.
	const wires = [
		{
			id: 'gnd',
			oledPin: 'GND',
			boardPin: 'GND',
			color: '#111111',
			colorName: 'black',
			job: 'Ground. Every circuit needs a shared “0 volts” so signals have something to compare against.'
		},
		{
			id: 'vcc',
			oledPin: 'VCC',
			boardPin: '3.3V',
			color: '#e11d48',
			colorName: 'red',
			job: 'Power for the screen. Use 3.3V, the same voltage the ESP32-C3 runs on.'
		},
		{
			id: 'scl',
			oledPin: 'SCL',
			boardPin: `GPIO ${OLED.scl}`,
			color: '#f59e0b',
			colorName: 'orange',
			job: 'The clock line. The board ticks it so both sides know when each bit is sent.'
		},
		{
			id: 'sda',
			oledPin: 'SDA',
			boardPin: `GPIO ${OLED.sda}`,
			color: '#2563eb',
			colorName: 'blue',
			job: 'The data line. The pixels you draw travel to the screen along this wire, one bit per tick.'
		}
	] as const;

	type WireId = (typeof wires)[number]['id'];
	let active = $state<WireId | null>(null);
	const activeWire = $derived(wires.find((w) => w.id === active));

	// Layout (SVG units): board on the left, screen on the right, pins lined up so wires run straight.
	const pinY = (i: number) => 140 + i * 62;
	const BOARD_RIGHT = 380;
	const OLED_LEFT = 640;

	function toggle(id: WireId) {
		active = active === id ? null : id;
	}
</script>

<div class="font-inter">
	<svg
		viewBox="0 0 1000 440"
		class="w-full rounded-lg border-2 border-black bg-white"
		role="group"
		aria-label="Wiring diagram: ESP32-C3 dev board connected to the OLED screen with four wires"
	>
		<!-- ESP32-C3 dev board -->
		<g aria-hidden="true">
			<rect x="60" y="70" width={BOARD_RIGHT - 60} height="300" rx="14" fill="#1b1b1f" />
			<!-- USB-C ports -->
			<rect x="46" y="120" width="34" height="46" rx="8" fill="#b9bcc2" />
			<rect x="46" y="270" width="34" height="46" rx="8" fill="#b9bcc2" />
			<!-- ESP32-C3-MINI-1 module -->
			<rect x="130" y="150" width="130" height="150" rx="6" fill="#c9ccd1" />
			<text x="195" y="220" text-anchor="middle" font-size="18" font-weight="700" fill="#333"
				>ESP32-C3</text
			>
			<text x="195" y="244" text-anchor="middle" font-size="14" fill="#555">MINI-1</text>
			<text x="220" y="105" text-anchor="middle" font-size="22" font-weight="700" fill="#fff">
				your devboard
			</text>
		</g>

		<!-- OLED screen module -->
		<g aria-hidden="true">
			<rect x={OLED_LEFT} y="70" width="300" height="300" rx="14" fill="#1d4f9e" />
			<rect x="712" y="120" width="210" height="200" rx="4" fill="#050505" />
			<!-- yellow strip on top, blue below, like the real screen -->
			<rect x="712" y="120" width="210" height="50" fill="#ffd23f" opacity="0.18" />
			<text x="728" y="152" font-size="18" fill="#ffd23f" font-family="ui-monospace, monospace">
				Daisy Chain!
			</text>
			<text x="728" y="210" font-size="18" fill="#4aa8ff" font-family="ui-monospace, monospace">
				hello :]
			</text>
			<text x="817" y="352" text-anchor="middle" font-size="22" font-weight="700" fill="#fff">
				your display
			</text>
		</g>

		<!-- Wires -->
		{#each wires as wire, i (wire.id)}
			{@const y = pinY(i)}
			{@const dim = active !== null && active !== wire.id}
			<g
				role="button"
				tabindex="0"
				aria-pressed={active === wire.id}
				aria-label="{wire.colorName} wire: screen {wire.oledPin} to board {wire.boardPin}"
				class="cursor-pointer transition-opacity outline-none focus-visible:[&>.focus-ring]:opacity-100"
				opacity={dim ? 0.2 : 1}
				onmouseenter={() => (active = wire.id)}
				onmouseleave={() => (active = null)}
				onfocus={() => (active = wire.id)}
				onblur={() => (active = null)}
				onclick={() => toggle(wire.id)}
				onkeydown={(e) =>
					(e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(wire.id))}
			>
				<!-- wide invisible hit area so the wire is easy to hover or tap -->
				<line
					x1={BOARD_RIGHT}
					y1={y}
					x2={OLED_LEFT}
					y2={y}
					stroke="transparent"
					stroke-width="40"
				/>
				<line
					class="focus-ring opacity-0"
					x1={BOARD_RIGHT}
					y1={y}
					x2={OLED_LEFT}
					y2={y}
					stroke="#ffed76"
					stroke-width="22"
					stroke-linecap="round"
				/>
				<line
					x1={BOARD_RIGHT}
					y1={y}
					x2={OLED_LEFT}
					y2={y}
					stroke={wire.color}
					stroke-width={active === wire.id ? 12 : 8}
					stroke-linecap="round"
				/>
				<!-- pins -->
				<circle cx={BOARD_RIGHT} cy={y} r="11" fill="#d4a017" stroke="#7a5c00" stroke-width="3" />
				<circle cx={OLED_LEFT} cy={y} r="11" fill="#d4a017" stroke="#7a5c00" stroke-width="3" />
				<!-- pin labels, printed on each board like the real silkscreen -->
				<text
					x={BOARD_RIGHT - 22}
					y={y + 7}
					text-anchor="end"
					font-size="20"
					font-weight="700"
					fill="#fff"
				>
					{wire.boardPin}
				</text>
				<text x={OLED_LEFT + 22} y={y + 7} font-size="20" font-weight="700" fill="#fff">
					{wire.oledPin}
				</text>
			</g>
		{/each}

		<text x="510" y="420" text-anchor="middle" font-size="16" fill="#555" aria-hidden="true">
			Hover or tap a wire to see what it does
		</text>
	</svg>

	<!-- What the highlighted wire does -->
	<p
		class="mt-4 min-h-[56px] rounded-md bg-daisy/40 px-4 py-3 text-[17px] md:text-[19px]"
		aria-live="polite"
	>
		{#if activeWire}
			<strong>{activeWire.oledPin} → {activeWire.boardPin}</strong> ({activeWire.colorName} wire):
			{activeWire.job}
		{:else}
			Four wires connect your screen to your devboard. Point at one to learn what it does!
		{/if}
	</p>

	<ul class="mt-6 flex list-disc flex-col gap-1 pl-6 text-[16px] md:text-[18px]">
		<li><strong>Unplug the USB cable</strong> before moving any wires.</li>
		<li>
			Find each pin by the <strong>label printed next to it</strong> on your board. The pins in this diagram
			are lined up to keep the wires straight; on your board they’ll be in different spots.
		</li>
		<li>
			Wire colours don’t matter to the electronics. Using these colours just makes mistakes easier
			to spot.
		</li>
		<li>
			Double-check <strong>VCC and GND</strong> aren’t swapped. That’s the one mistake that can damage
			the screen.
		</li>
	</ul>
</div>

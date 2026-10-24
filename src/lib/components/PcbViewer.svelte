<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		/** URL of the .glb model. */
		src: string;
		/** Image shown until the model has loaded, and if WebGL isn't available. */
		poster: string;
		/**
		 * The part of the poster image (in its own pixels) that holds the board plus a little
		 * breathing room. The poster is cropped to this so it lines up with the 3D model.
		 * Give the wrapper the same aspect ratio as this crop.
		 */
		posterCrop?: { x: number; y: number; width: number; height: number };
		/** The poster image's full size in pixels (needed for posterCrop). */
		posterSize?: { width: number; height: number };
		/** Space around the board, as a multiple of its size (1.15 = 7.5% on each side). */
		margin?: number;
		alt: string;
		/** Extra classes for the wrapper (size it here). */
		class?: string;
	};

	let {
		src,
		poster,
		posterCrop,
		posterSize,
		margin = 1.15,
		alt,
		class: className = ''
	}: Props = $props();

	// Scale and shift the poster so only the crop area fills the wrapper.
	const posterStyle = $derived(
		posterCrop && posterSize
			? `left: ${(-posterCrop.x / posterCrop.width) * 100}%; top: ${(-posterCrop.y / posterCrop.height) * 100}%; width: ${(posterSize.width / posterCrop.width) * 100}%; height: ${(posterSize.height / posterCrop.height) * 100}%;`
			: ''
	);

	let container: HTMLDivElement;
	let loaded = $state(false);

	onMount(() => {
		let disposed = false;
		let cleanup = () => {};

		// Load three.js only in the browser, and only when this component is on the page.
		(async () => {
			const THREE = await import('three');
			const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
			const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');
			const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
			if (disposed) return;

			let renderer: InstanceType<typeof THREE.WebGLRenderer>;
			try {
				renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
			} catch {
				return; // No WebGL: keep showing the poster image.
			}
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.toneMapping = THREE.NeutralToneMapping;
			renderer.domElement.className = 'absolute inset-0 size-full';
			renderer.domElement.setAttribute('aria-hidden', 'true');
			container.appendChild(renderer.domElement);

			const scene = new THREE.Scene();
			const pmrem = new THREE.PMREMGenerator(renderer);
			const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
			scene.environment = envTexture;
			scene.environmentIntensity = 0.7;
			scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
			const sun = new THREE.DirectionalLight(0xffffff, 1.5);
			sun.position.set(1, 2, 3);
			scene.add(sun);

			// A narrow field of view keeps perspective subtle, so the board looks like the flat render.
			const camera = new THREE.PerspectiveCamera(20, 1, 0.01, 100);

			// The model spins inside this pivot so it always turns around its own centre.
			const pivot = new THREE.Group();
			scene.add(pivot);

			const loader = new GLTFLoader();
			loader.setMeshoptDecoder(MeshoptDecoder);
			const gltf = await loader.loadAsync(src);
			if (disposed) {
				renderer.dispose();
				return;
			}

			const model = gltf.scene;
			// KiCad exports the board lying flat; stand it up so its top faces the camera.
			model.rotation.x = Math.PI / 2;
			model.updateMatrixWorld(true);
			const box = new THREE.Box3().setFromObject(model);
			const size = box.getSize(new THREE.Vector3());
			model.position.sub(box.getCenter(new THREE.Vector3()));
			pivot.add(model);

			// Frame the board so it fills the width (or height) of the canvas.
			const fit = () => {
				const { clientWidth: w, clientHeight: h } = container;
				if (!w || !h) return;
				renderer.setSize(w, h, false);
				camera.aspect = w / h;
				const vFov = THREE.MathUtils.degToRad(camera.fov);
				const fitHeight = (size.y * margin) / 2 / Math.tan(vFov / 2);
				const fitWidth = (size.x * margin) / 2 / Math.tan(vFov / 2) / camera.aspect;
				camera.position.set(0, 0, Math.max(fitHeight, fitWidth));
				camera.lookAt(0, 0, 0);
				camera.updateProjectionMatrix();
			};
			fit();
			const resizeObserver = new ResizeObserver(fit);
			resizeObserver.observe(container);

			// Tilt toward the mouse; gently sway on its own otherwise.
			const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			const target = { x: 0, y: 0 };
			const onPointerMove = (e: PointerEvent) => {
				if (e.pointerType !== 'mouse') return;
				const r = container.getBoundingClientRect();
				target.y = ((e.clientX - r.left) / r.width - 0.5) * 0.9;
				target.x = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
			};
			const onPointerLeave = () => {
				target.x = 0;
				target.y = 0;
			};
			container.addEventListener('pointermove', onPointerMove);
			container.addEventListener('pointerleave', onPointerLeave);

			// Only animate while the hero is on screen.
			let visible = true;
			const intersectionObserver = new IntersectionObserver(([entry]) => {
				visible = entry.isIntersecting;
			});
			intersectionObserver.observe(container);

			renderer.setAnimationLoop((time) => {
				if (!visible) return;
				const t = time / 1000;
				const sway = reduceMotion ? 0 : Math.sin(t * 0.6) * 0.25;
				pivot.rotation.y += (target.y + sway - pivot.rotation.y) * 0.06;
				pivot.rotation.x += (target.x - pivot.rotation.x) * 0.06;
				renderer.render(scene, camera);
			});

			loaded = true;

			cleanup = () => {
				renderer.setAnimationLoop(null);
				resizeObserver.disconnect();
				intersectionObserver.disconnect();
				container.removeEventListener('pointermove', onPointerMove);
				container.removeEventListener('pointerleave', onPointerLeave);
				model.traverse((obj) => {
					if (obj instanceof THREE.Mesh) {
						obj.geometry.dispose();
						const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
						materials.forEach((m) => m.dispose());
					}
				});
				envTexture.dispose();
				pmrem.dispose();
				renderer.dispose();
				renderer.domElement.remove();
			};
		})().catch((err) => {
			// If anything fails, the poster image simply stays up.
			console.error('PcbViewer: could not load model', err);
		});

		return () => {
			disposed = true;
			cleanup();
		};
	});
</script>

<div bind:this={container} class="relative {className}" role="img" aria-label={alt}>
	<img
		src={poster}
		alt=""
		style={posterStyle}
		class="absolute max-w-none transition-opacity duration-500 {posterStyle
			? ''
			: 'inset-0 size-full object-contain'} {loaded ? 'opacity-0' : 'opacity-100'}"
	/>
</div>

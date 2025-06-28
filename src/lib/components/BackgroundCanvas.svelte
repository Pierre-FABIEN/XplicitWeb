<script lang="ts">
	import { BackgroundColorStore } from '$lib/store/BackgroundColorStore';
	import { LightColorStore } from '$lib/store/BackgroundColorStore';

	let canvas: HTMLCanvasElement;

	// Couleurs
	let backgroundColor = $state('#000000');
	let lightColor = $state('#ffffff');

	// Coordonnées et paramètres
	let x = 0;
	let y = 0;
	let radius = $state(500);
	let colorShift = 0;

	let lastTimestamp = 0;
	let animationSpeed = 0.5;

	// Adapter la taille du canvas à l'écran pour un rendu haute qualité
	function resizeCanvas() {
		const dpr = window.devicePixelRatio || 1;
		canvas.width = canvas.clientWidth * dpr;
		canvas.height = canvas.clientHeight * dpr;

		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.scale(dpr, dpr);
		}
	}

	// Synchronisation des couleurs depuis les stores
	$effect(() => {
		const unsubscribeBackground = BackgroundColorStore.subscribe((color) => {
			console.log('🎨 [BackgroundCanvas] Nouvelle couleur background:', color);
			backgroundColor = color || '#000000';
		});

		const unsubscribeLight = LightColorStore.subscribe((color) => {
			console.log('🎨 [BackgroundCanvas] Nouvelle couleur light:', color);
			lightColor = color || '#ffffff';
		});

		console.log('🎨 [BackgroundCanvas] Couleurs actuelles:', {
			backgroundColor,
			lightColor,
			pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
		});

		return () => {
			unsubscribeBackground();
			unsubscribeLight();
		};
	});

	// Dessiner le gradient
	function drawGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
		const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

		gradient.addColorStop(0, lightColor); // Couleur centrale
		gradient.addColorStop(1, backgroundColor); // Couleur extérieure

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
	}

	// Animation
	let animationFrameId: number;
	function animate(timestamp: number) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const deltaTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
		const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

		radius = Math.max(300, 350 + Math.sin(colorShift / 500) * 50);

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		drawGradient(ctx, canvasWidth, canvasHeight);

		colorShift += deltaTime * animationSpeed;

		animationFrameId = requestAnimationFrame(animate);
	}

	// Initialisation
	$effect(() => {
		resizeCanvas(); // Ajuste la taille du canvas au démarrage
		window.addEventListener('resize', resizeCanvas);

		animate(0); // Démarre l'animation

		return () => {
			cancelAnimationFrame(animationFrameId);
			window.removeEventListener('resize', resizeCanvas);
		};
	});
</script>

<canvas bind:this={canvas} class="w-screen h-screen absolute"></canvas>

<style>
	canvas {
		position: absolute;
		display: block;
		width: 100%;
		height: 100vh;
		z-index: -1;
	}
</style>

<script lang="ts">
	import { BackgroundColorStore } from '$lib/store/BackgroundColorStore';

	// Référence au canvas
	let canvas: HTMLCanvasElement;

	// Couleur de base réactive
	let backgroundColor = $state('#ff0000');

	// Variables pour animer le gradient
	let x = 0; // Position X du centre
	let y = 0; // Position Y du centre
	let radius = 1; // Rayon du gradient
	let colorShift = 0; // Décalage de couleur
	let gradient;
	let lightColor;

	// Variables pour gérer le temps
	let lastTimestamp = 0;
	let animationSpeed = 3; // Contrôle de la vitesse d'animation (plus petit = plus lent)

	// Utilitaire pour rendre une couleur plus claire
	function lightenColor(color: string, percent: number): string {
		let rgb: number[] = [];
		if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
			rgb = color.match(/\w\w/g)?.map((hex) => parseInt(hex, 16)) ?? [0, 0, 0];
		} else if (/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.test(color)) {
			const matches = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
			if (matches) {
				rgb = matches.slice(1, 4).map(Number);
			}
		} else {
			console.warn(`Invalid color: ${color}. Using default #ff0000.`);
			rgb = [255, 0, 0];
		}

		const lighterRgb = rgb.map((channel) =>
			Math.min(255, Math.floor(channel + (255 - channel) * percent))
		);

		return `rgb(${lighterRgb.join(',')})`;
	}

	$effect(() => {
		const unsubscribe = BackgroundColorStore.subscribe((color) => {
			if (!color || (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) && !/^rgba?\(/i.test(color))) {
				console.warn(`Invalid backgroundColor from store: ${color}`);
				backgroundColor = '#ff0000';
			} else {
				backgroundColor = color;
			}
		});
		return () => unsubscribe();
	});

	function drawGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
		if (!backgroundColor) {
			console.warn('backgroundColor is undefined. Using default #ff0000.');
			backgroundColor = '#ff0000';
		}

		lightColor = lightenColor(backgroundColor, 0.5);

		gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
		try {
			//gradient.addColorStop(0, lightColor);
			gradient.addColorStop(1, backgroundColor);
		} catch (e) {
			console.error(
				`Failed to addColorStop with lightColor: ${lightColor}, backgroundColor: ${backgroundColor}`,
				e
			);
		}

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
	}

	let animationFrameId: number;

	function animate(timestamp: number) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const deltaTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		const canvasWidth = canvas.width;
		const canvasHeight = canvas.height;

		x = canvasWidth / 2 + Math.sin(colorShift / 50) * (canvasWidth / 2);
		y = canvasHeight / 2 + Math.cos(colorShift / 50) * (canvasHeight / 2);

		radius = Math.max(300, 380 + Math.sin(colorShift / 50) * 100);

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		drawGradient(ctx, canvasWidth, canvasHeight);

		colorShift += deltaTime * animationSpeed; // Utiliser animationSpeed pour ajuster la vitesse

		animationFrameId = requestAnimationFrame(animate);
	}

	$effect(() => {
		animate(0);
		return () => {
			cancelAnimationFrame(animationFrameId);
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
	}
</style>

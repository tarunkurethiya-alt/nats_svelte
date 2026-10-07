<script lang="ts">
	import { onMount } from 'svelte';
	import type { WhiteboardService } from '$lib/application/whiteboard-service';
	import type { OpenWhiteboardSession } from '$lib/application/whiteboard-session';
	import { createBrush, MAX_BRUSH_WIDTH, MIN_BRUSH_WIDTH } from '$lib/domain/brush';
	import { CanvasBoardRenderer } from '../rendering/canvas-board-renderer';

	let { openSession }: { openSession: OpenWhiteboardSession } = $props();

	let canvas: HTMLCanvasElement;
	let renderer: CanvasBoardRenderer;
	let whiteboard = $state<WhiteboardService | null>(null);

	let color = $state('#2563eb');
	let brushSize = $state(4);

	const connected = $derived(whiteboard !== null);
	const brush = $derived(createBrush(color, brushSize));

	function startDrawing(e: PointerEvent) {
		if (!whiteboard) return;

		canvas.setPointerCapture(e.pointerId);
		whiteboard.beginStroke(renderer.toBoardPoint(e.clientX, e.clientY), brush);
	}

	function moveDrawing(e: PointerEvent) {
		whiteboard?.continueStroke(renderer.toBoardPoint(e.clientX, e.clientY), brush);
	}

	function stopDrawing() {
		whiteboard?.endStroke();
	}

	function clearBoard() {
		whiteboard?.clearBoard();
	}

	onMount(() => {
		renderer = new CanvasBoardRenderer(canvas);

		let active = true;
		let close: (() => Promise<void>) | undefined;

		async function start() {
			try {
				const session = await openSession(renderer);

				if (!active) {
					await session.close();
					return;
				}

				close = session.close;
				session.whiteboard.listen();
				whiteboard = session.whiteboard;

				await session.closed;
				if (active) whiteboard = null;
			} catch (err) {
				if (active) {
					whiteboard = null;
					console.error('Whiteboard connection failed:', err);
				}
			}
		}

		start();

		return () => {
			active = false;
			close?.();
		};
	});
</script>

<main>
	<header>
		<div>
			<h1>Collaborative Whiteboard</h1>
			<p>Draw together in real time using NATS.</p>
		</div>

		<span class:online={connected} class="status">
			{connected ? 'Connected' : 'Disconnected'}
		</span>
	</header>

	<div class="toolbar">
		<label>
			Pen color
			<input type="color" bind:value={color} />
		</label>

		<label>
			Brush size
			<input type="range" min={MIN_BRUSH_WIDTH} max={MAX_BRUSH_WIDTH} bind:value={brushSize} />
			{brushSize}px
		</label>

		<button onclick={clearBoard} disabled={!connected}> Clear board </button>
	</div>

	<canvas
		bind:this={canvas}
		width="1200"
		height="700"
		onpointerdown={startDrawing}
		onpointermove={moveDrawing}
		onpointerup={stopDrawing}
		onpointercancel={stopDrawing}
	></canvas>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f1f5f9;
		font-family: system-ui, sans-serif;
	}

	main {
		max-width: 1200px;
		margin: 30px auto;
		padding: 0 20px;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
	}

	h1 {
		margin-bottom: 5px;
	}

	p {
		color: #64748b;
	}

	.status {
		background: #fee2e2;
		color: #991b1b;
		padding: 8px 14px;
		border-radius: 20px;
	}

	.status.online {
		background: #dcfce7;
		color: #166534;
	}

	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 25px;
		background: white;
		padding: 16px;
		margin: 20px 0;
		border-radius: 12px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	button {
		padding: 10px 18px;
		border: 0;
		border-radius: 8px;
		background: #2563eb;
		color: white;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
	}

	canvas {
		display: block;
		width: 100%;
		height: auto;
		background: white;
		border: 1px solid #cbd5e1;
		border-radius: 12px;
		cursor: crosshair;
		touch-action: none;
	}
</style>

<script lang="ts">
	import { toast } from 'svelte-sonner';

	// Props: `text` to customize the text to copy
	export let text: string;

	// Reference to the pre element
	let preElement: HTMLPreElement | null = null;

	// Function to copy the text to clipboard
	function copyToClipboard() {
		if (preElement) {
			const range = document.createRange();
			range.selectNodeContents(preElement);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);

			try {
				document.execCommand('copy');
				toast('Text copied to clipboard!');
			} catch (err) {
				console.error('Failed to copy text:', err);
			}

			selection?.removeAllRanges();
		}
	}
</script>

<div class="flex justify-left items-center mt-5">
	<pre bind:this={preElement} class="preStyle">
        <span>{text}</span>
        <button
			class="copyButton"
			type="button"
			on:click={copyToClipboard}
			aria-label="Copy to clipboard">
            <svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-book-copy svgStyle">
                <path d="M2 16V4a2 2 0 0 1 2-2h11" />
                <path
					d="M22 18H11a2 2 0 1 0 0 4h10.5a.5.5 0 0 0 .5-.5v-15a.5.5 0 0 0-.5-.5H11a2 2 0 0 0-2 2v12"
				/>
                <path d="M5 14H4a2 2 0 1 0 0 4h1" />
            </svg>
        </button>
    </pre>
</div>

<style lang="scss">
	.preStyle {
		box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.2),
			rgba(255, 255, 255, 0.1) 30%,
			rgba(240, 240, 240, 0.05) 70%,
			rgba(220, 220, 220, 0.02)
		);
		backdrop-filter: blur(15px) saturate(150%);
		-webkit-backdrop-filter: blur(15px) saturate(150%);
		border-radius: 16px;

		padding: 10px;
		border-radius: 5px;
		font-family: monospace;
		position: relative;
		justify-content: space-between;
		justify-items: center;
		display: flex;
		align-items: center;
		max-width: 100%;
		min-width: 200px;
		word-wrap: break-word;
	}

	.copyButton {
		background: none;
		border: none;
		cursor: pointer;
		padding: 5px;
		border-radius: 5px;
		display: flex;
		transition: background-color 0.2s ease;
	}

	.copyButton:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.svgStyle {
		width: 16px;
		height: 16px;
	}
</style>

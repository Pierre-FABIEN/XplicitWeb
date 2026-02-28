<script lang="ts">
	import { browser } from '$app/environment';
	import SmoothScrollBarStore from '$lib/store/SmoothScrollBarStore';
	import Scrollbar from 'smooth-scrollbar';

	let { children } = $props();

	let scrollX = $state(0);
	let scrollY = $state(0);
	let smoothScoller = $state.raw<HTMLElement | null>(null);
	let smoothScroll: Scrollbar | null = null;

	$effect(() => {
		if (!browser || !smoothScoller) return;

		async function init() {
			const [gsapModule, scrollTriggerModule] = await Promise.all([
				import('gsap'),
				import('gsap/dist/ScrollTrigger')
			]);
			const gsap = gsapModule.default;
			const ScrollTrigger = scrollTriggerModule.default;
			gsap.registerPlugin(ScrollTrigger);

			smoothScroll = Scrollbar.init(smoothScoller!, {
				damping: 0.1,
				delegateTo: document,
				alwaysShowTracks: true
			});

			SmoothScrollBarStore.update((state) => ({
				...state,
				smoothScroll
			}));

			const updateScroll = (status: any) => {
				scrollX = status.offset.x;
				scrollY = status.offset.y;
				SmoothScrollBarStore.update((state) => ({
					...state,
					scrollX,
					scrollY
				}));
			};

			smoothScroll.addListener(updateScroll);

			ScrollTrigger.scrollerProxy(smoothScoller, {
				scrollTop(value) {
					if (arguments.length && smoothScroll) {
						smoothScroll.scrollTop = value ?? 0;
					}
					return smoothScroll ? smoothScroll.scrollTop : 0;
				}
			});

			smoothScroll.addListener(ScrollTrigger.update);

			ScrollTrigger.defaults({
				scroller: smoothScoller,
				pinType: 'transform'
			});

			return () => {
				if (smoothScroll) {
					smoothScroll.removeListener(ScrollTrigger.update);
					smoothScroll.removeListener(updateScroll);
					smoothScroll.destroy();
				}
			};
		}

		let cleanup: (() => void) | void;
		init().then((cb) => { cleanup = cb; });
		return () => { cleanup?.(); };
	});
</script>

<div bind:this={smoothScoller} class="smoothScoller" id="smoothScoller">
	{@render children()}
</div>

<style>
	.smoothScoller {
		height: 100vh;
		overflow: hidden;
		position: relative;
	}
</style>

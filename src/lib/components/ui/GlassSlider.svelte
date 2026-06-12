<script lang="ts">
	// ============ 玻璃风格 Slider（基于 bits-ui） ============
	// 全局统一的滑块，替换原生 <input type=range>。支持键盘 + 无障碍。
	import { Slider } from 'bits-ui';

	interface Props {
		value: number;
		min?: number;
		max?: number;
		step?: number;
		ariaLabel?: string;
		/** 方向：horizontal | vertical */
		orientation?: 'horizontal' | 'vertical';
		onValueChange?: (value: number) => void;
	}

	let {
		value = $bindable(),
		min = 0,
		max = 1,
		step = 0.01,
		ariaLabel = '滑块',
		orientation = 'horizontal',
		onValueChange
	}: Props = $props();
</script>

<Slider.Root
	type="single"
	bind:value
	{min}
	{max}
	{step}
	{orientation}
	onValueChange={(v) => onValueChange?.(v)}
	class="gsl-root"
	data-orientation={orientation}
>
	{#snippet children()}
		<span class="gsl-track" data-orientation={orientation}>
			<Slider.Range class="gsl-range" />
		</span>
		<Slider.Thumb index={0} class="gsl-thumb" aria-label={ariaLabel} />
	{/snippet}
</Slider.Root>

<style>
	:global(.gsl-root) {
		position: relative;
		display: flex;
		align-items: center;
		user-select: none;
		touch-action: none;
	}
	:global(.gsl-root[data-orientation='horizontal']) {
		width: 100%;
		height: 18px;
	}
	:global(.gsl-root[data-orientation='vertical']) {
		flex-direction: column;
		width: 18px;
		height: 100%;
	}

	:global(.gsl-track) {
		position: relative;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.18);
		overflow: hidden;
	}
	:global(.gsl-track[data-orientation='horizontal']) {
		flex: 1;
		height: 5px;
	}
	:global(.gsl-track[data-orientation='vertical']) {
		flex: 1;
		width: 5px;
	}

	:global(.gsl-range) {
		position: absolute;
		border-radius: 9999px;
		background: linear-gradient(90deg, rgb(var(--accent-glow)), rgb(var(--accent-glow-2)));
	}
	:global(.gsl-range[data-orientation='horizontal']) {
		height: 100%;
	}
	:global(.gsl-range[data-orientation='vertical']) {
		width: 100%;
	}

	:global(.gsl-thumb) {
		display: block;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		cursor: grab;
		outline: none;
		transition:
			transform 0.15s var(--ease-glass),
			box-shadow 0.15s var(--ease-glass);
	}
	:global(.gsl-thumb:hover) {
		transform: scale(1.2);
	}
	:global(.gsl-thumb:focus-visible) {
		box-shadow: 0 0 0 4px rgb(var(--accent-glow) / 0.3);
	}
	:global(.gsl-thumb:active) {
		cursor: grabbing;
	}
</style>

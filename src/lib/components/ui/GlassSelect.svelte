<script lang="ts">
	// ============ 玻璃风格 Select（基于 bits-ui） ============
	// 全局统一的下拉选择，替换原生 <select>。无障碍 + 键盘导航开箱即用。
	import { Select } from 'bits-ui';
	import { Check, ChevronsUpDown } from 'lucide-svelte';

	interface Item {
		value: string;
		label: string;
	}

	interface Props {
		value: string;
		items: Item[];
		placeholder?: string;
		ariaLabel?: string;
		/** 触发器最小宽度 */
		minWidth?: string;
		/** 固定触发器文字：传入则始终显示该文字，不随选中值变化 */
		triggerLabel?: string;
		onValueChange?: (value: string) => void;
	}

	let {
		value = $bindable(),
		items,
		placeholder = '请选择',
		ariaLabel = '选择',
		minWidth = '110px',
		triggerLabel,
		onValueChange
	}: Props = $props();

	const displayLabel = $derived(
		triggerLabel ?? items.find((i) => i.value === value)?.label ?? placeholder
	);
</script>

<Select.Root type="single" bind:value onValueChange={(v) => onValueChange?.(v)}>
	<Select.Trigger class="gs-trigger" style="min-width:{minWidth}" aria-label={ariaLabel}>
		<span class="gs-value">{displayLabel}</span>
		<ChevronsUpDown size={15} class="gs-caret" />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content class="gs-content glass" sideOffset={8}>
			<Select.Viewport>
				{#each items as item (item.value)}
					<Select.Item class="gs-item" value={item.value} label={item.label}>
						{#snippet children({ selected })}
							<span>{item.label}</span>
							{#if selected}
								<Check size={15} />
							{/if}
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>

<style>
	:global(.gs-trigger) {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.4rem 0.7rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.6rem;
		color: var(--text-main);
		font-size: 0.875rem;
		cursor: pointer;
		outline: none;
		transition:
			background 0.3s var(--ease-glass),
			border-color 0.3s var(--ease-glass);
	}
	:global(.gs-trigger:hover) {
		background: rgba(255, 255, 255, 0.14);
		border-color: rgb(var(--accent-glow) / 0.5);
	}
	:global(.gs-trigger:focus-visible) {
		border-color: rgb(var(--accent-glow) / 0.7);
		box-shadow: 0 0 0 3px rgb(var(--accent-glow) / 0.2);
	}
	:global(.gs-caret) {
		opacity: 0.55;
		flex-shrink: 0;
	}

	:global(.gs-content) {
		z-index: 300;
		padding: 0.4rem;
		border-radius: 0.85rem;
		min-width: var(--bits-select-anchor-width);
		max-height: var(--bits-select-content-available-height);
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	:global(.gs-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.5rem 0.7rem;
		font-size: 0.875rem;
		color: var(--text-sub);
		border-radius: 0.55rem;
		cursor: pointer;
		outline: none;
		user-select: none;
		transition:
			background 0.18s,
			color 0.18s;
	}
	:global(.gs-item[data-highlighted]) {
		background: rgba(255, 255, 255, 0.12);
		color: var(--text-main);
	}
	:global(.gs-item[data-selected]) {
		color: var(--text-main);
		font-weight: 600;
	}
</style>

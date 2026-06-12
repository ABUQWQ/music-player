<script lang="ts">
	import { Search } from 'lucide-svelte';
	import type { MusicSource } from '$lib/api/types';
	import GlassSelect from './ui/GlassSelect.svelte';

	interface Props {
		onSearch: (keyword: string, source: MusicSource) => void;
	}

	let { onSearch }: Props = $props();

	let keyword = $state('');
	let source = $state<MusicSource>('netease');

	const sourceItems = [
		{ value: 'netease', label: '网易云' },
		{ value: 'kuwo', label: '酷我' },
		{ value: 'joox', label: 'JOOX' }
	];

	// 换源只更新选中值，不自动重搜，避免误触 API 上限喵
	function handleSourceChange(v: string) {
		source = v as MusicSource;
	}

	// 仅在点击搜索按钮 / 回车提交时发起请求
	function handleSubmit(e: Event) {
		e.preventDefault();
		const kw = keyword.trim();
		if (kw) onSearch(kw, source);
	}
</script>

<form class="search-bar glass glass-interactive" onsubmit={handleSubmit}>
	<Search size={20} style="opacity:0.6; flex-shrink:0;" />
	<input
		type="text"
		bind:value={keyword}
		placeholder="搜索歌曲 / 歌手 / 专辑"
		class="search-input"
	/>
	<GlassSelect
		value={source}
		items={sourceItems}
		ariaLabel="音乐来源"
		minWidth="96px"
		onValueChange={handleSourceChange}
	/>
	<button type="submit" class="search-btn" title="搜索">搜索</button>
</form>

<style>
	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.8rem 1.2rem;
		max-width: 680px;
		margin: 0 auto;
	}
	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 1rem;
		color: var(--text-main);
	}
	.search-input::placeholder {
		color: var(--text-sub);
		opacity: 0.6;
	}
	.search-btn {
		flex-shrink: 0;
		padding: 0.45rem 1rem;
		background: rgb(var(--accent-glow) / 0.25);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 0.6rem;
		color: var(--text-main);
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			background 0.3s var(--ease-glass),
			transform 0.3s var(--ease-glass);
	}
	.search-btn:hover {
		background: rgb(var(--accent-glow) / 0.4);
		transform: translateY(-1px);
	}
	.search-btn:active {
		transform: translateY(0);
	}
</style>

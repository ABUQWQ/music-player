<script lang="ts">
	import { player } from '$lib/stores/player.svelte';
	import { getLyric } from '$lib/api/music';
	import type { MusicSource } from '$lib/api/types';
	import { parseLyric, findActiveLine, type LyricLine } from '$lib/lyric/parser';

	let lines = $state<LyricLine[]>([]);
	let loading = $state(false);
	let error = $state('');
	let containerEl: HTMLDivElement | null = $state(null);

	// 当前歌曲变化 → 重新拉取歌词
	let loadedKey = '';
	$effect(() => {
		const song = player.current;
		if (!song) {
			lines = [];
			return;
		}
		const key = `${song.source}-${song.lyricId}`;
		if (key === loadedKey) return;
		loadedKey = key;
		void fetchLyric(song.lyricId, song.source);
	});

	async function fetchLyric(lyricId: string, source: MusicSource) {
		loading = true;
		error = '';
		lines = [];
		try {
			const res = await getLyric(lyricId, source);
			lines = parseLyric(res.lyric, res.tlyric);
			if (lines.length === 0) error = '暂无歌词';
		} catch {
			error = '歌词加载失败';
		} finally {
			loading = false;
		}
	}

	// 当前高亮行
	const activeIndex = $derived(findActiveLine(lines, player.currentTime));

	// 高亮行变化 → 滚动居中（用 data-idx 定位当前行，避免维护元素数组）
	$effect(() => {
		const i = activeIndex;
		if (i < 0 || !containerEl) return;
		const el = containerEl.querySelector<HTMLElement>(`[data-idx="${i}"]`);
		if (el) {
			const target = el.offsetTop - containerEl.clientHeight / 2 + el.clientHeight / 2;
			containerEl.scrollTo({ top: target, behavior: 'smooth' });
		}
	});
</script>

<div class="lyric-wrap" bind:this={containerEl}>
	{#if loading}
		<p class="lyric-tip">歌词加载中…</p>
	{:else if error}
		<p class="lyric-tip">{error}</p>
	{:else if lines.length === 0}
		<p class="lyric-tip">暂无歌词</p>
	{:else}
		<!-- 顶部留白，使首行可居中 -->
		<div class="lyric-pad"></div>
		{#each lines as line, i (i)}
			<button
				type="button"
				data-idx={i}
				class="lyric-line"
				class:active={i === activeIndex}
				class:passed={i < activeIndex}
				onclick={() => player.seek(line.time)}
			>
				<span class="lyric-main">{line.text}</span>
				{#if line.translation}
					<span class="lyric-trans">{line.translation}</span>
				{/if}
			</button>
		{/each}
		<div class="lyric-pad"></div>
	{/if}
</div>

<style>
	.lyric-wrap {
		height: 100%;
		overflow-y: auto;
		scrollbar-width: none;
		text-align: center;
		padding: 0 1rem;
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 18%,
			black 82%,
			transparent 100%
		);
		mask-image: linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%);
	}
	.lyric-wrap::-webkit-scrollbar {
		display: none;
	}
	.lyric-pad {
		height: 40%;
	}
	.lyric-tip {
		margin-top: 40%;
		color: var(--text-sub);
		font-size: 0.95rem;
	}
	.lyric-line {
		display: block;
		width: 100%;
		border: none;
		background: none;
		font-family: inherit;
		text-align: center;
		margin: 0.95rem 0;
		cursor: pointer;
		color: var(--text-sub);
		opacity: 0.5;
		transition:
			opacity 0.4s var(--ease-glass),
			transform 0.4s var(--ease-glass),
			color 0.4s var(--ease-glass);
		line-height: 1.5;
	}
	.lyric-line:hover {
		opacity: 0.85;
	}
	.lyric-line.passed {
		opacity: 0.35;
	}
	.lyric-line.active {
		opacity: 1;
		color: var(--text-main);
		transform: scale(1.08);
		font-weight: 600;
		text-shadow: 0 0 20px rgb(var(--accent-glow) / 0.4);
	}
	.lyric-main {
		display: block;
		font-size: 1.05rem;
	}
	.lyric-trans {
		display: block;
		font-size: 0.85rem;
		margin-top: 0.2rem;
		opacity: 0.75;
	}
</style>

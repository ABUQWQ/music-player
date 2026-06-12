<script lang="ts">
	import { onMount } from 'svelte';
	import { player } from '$lib/stores/player.svelte';
	import { searchSongs } from '$lib/api/music';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import SongCard from '$lib/components/SongCard.svelte';
	import type { Song, MusicSource } from '$lib/api/types';

	let results = $state<Song[]>([]);
	let loading = $state(false);
	let searched = $state(false);

	onMount(() => {
		player.init();
	});

	async function handleSearch(keyword: string, source: MusicSource) {
		loading = true;
		searched = true;
		try {
			results = await searchSongs(keyword, source, 20);
		} catch {
			results = [];
		} finally {
			loading = false;
		}
	}
</script>

<main class="main-page">
	<div class="search-section">
		<h1 class="title">云听 · 音乐</h1>
		<SearchBar onSearch={handleSearch} />
	</div>

	<div class="results-section scroll-area">
		{#if loading}
			<div class="loading">搜索中…</div>
		{:else if searched && results.length === 0}
			<p class="empty">未找到相关歌曲</p>
		{:else if results.length > 0}
			<div class="results-list">
				{#each results as song (song.id + song.source)}
					<SongCard {song} />
				{/each}
			</div>
		{/if}
	</div>
</main>

<style>
	.main-page {
		height: 100vh;
		padding-bottom: 88px; /* 底部播放栏高度 */
		display: flex;
		flex-direction: column;
	}
	.search-section {
		padding: 3rem 1.5rem 2rem;
	}
	.title {
		text-align: center;
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 2rem;
		background: linear-gradient(135deg, rgb(var(--accent-glow)), rgb(var(--accent-glow-2)));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: 0 1.5rem 2rem;
	}
	.results-list {
		max-width: 1400px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 0.5rem 1rem;
		align-content: start;
	}
	.loading,
	.empty {
		text-align: center;
		color: var(--text-sub);
		padding: 3rem 1rem;
		font-size: 0.95rem;
	}
</style>

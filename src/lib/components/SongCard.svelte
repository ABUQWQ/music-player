<script lang="ts">
	import { Play, Plus, Download } from 'lucide-svelte';
	import { player } from '$lib/stores/player.svelte';
	import { getPicUrl } from '$lib/api/music';
	import { downloadSong } from '$lib/utils/download';
	import type { Song } from '$lib/api/types';
	import { toast } from 'svelte-sonner';

	interface Props {
		song: Song;
	}

	let { song }: Props = $props();

	let cover = $state('');

	// 懒加载封面
	$effect(() => {
		if (song.cover) {
			cover = song.cover;
		} else if (song.picId) {
			void getPicUrl(song.picId, song.source, '300').then((url) => {
				if (url) cover = url;
			});
		}
	});

	async function playSong() {
		try {
			await player.playSong(song);
		} catch {
			toast.error('播放失败');
		}
	}

	function addToQueue() {
		player.addToQueue(song);
		toast.success('已加入队列');
	}

	let downloading = $state(false);
	async function handleDownload() {
		if (downloading) return;
		downloading = true;
		try {
			await downloadSong(song, player.quality);
			toast.success('下载成功');
		} catch {
			toast.error('下载失败');
		} finally {
			downloading = false;
		}
	}

	const isPlaying = $derived(
		player.current?.id === song.id && player.current?.source === song.source && player.playing
	);
</script>

<div class="song-card glass glass-interactive">
	<div class="cover">
		{#if cover}
			<img src={cover} alt={song.name} />
		{:else}
			<div class="cover-placeholder"></div>
		{/if}
		{#if isPlaying}
			<div class="playing-indicator">
				<span class="bar"></span>
				<span class="bar"></span>
				<span class="bar"></span>
			</div>
		{/if}
	</div>
	<div class="info">
		<p class="name line-clamp-1">{song.name}</p>
		<p class="artist text-sub line-clamp-1">{song.artists.join(' / ')}</p>
	</div>
	<div class="actions">
		<button onclick={playSong} class="btn-icon" title="播放">
			<Play size={18} />
		</button>
		<button onclick={addToQueue} class="btn-icon" title="加入队列">
			<Plus size={18} />
		</button>
		<button onclick={handleDownload} class="btn-icon" title="下载" disabled={downloading}>
			<Download size={18} />
		</button>
	</div>
</div>

<style>
	.song-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		margin-bottom: 0.5rem;
	}
	.cover {
		position: relative;
		width: 56px;
		height: 56px;
		border-radius: 0.5rem;
		overflow: hidden;
		flex-shrink: 0;
		background: rgba(255, 255, 255, 0.05);
	}
	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.cover-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
	}
	.playing-indicator {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3px;
		background: rgba(0, 0, 0, 0.4);
	}
	.bar {
		width: 3px;
		height: 12px;
		background: rgb(var(--accent-glow));
		border-radius: 2px;
		animation: wave 0.8s ease-in-out infinite;
	}
	.bar:nth-child(2) {
		animation-delay: 0.2s;
	}
	.bar:nth-child(3) {
		animation-delay: 0.4s;
	}
	@keyframes wave {
		0%,
		100% {
			transform: scaleY(0.5);
		}
		50% {
			transform: scaleY(1);
		}
	}
	.info {
		flex: 1;
		min-width: 0;
	}
	.name {
		margin: 0 0 0.25rem;
		font-size: 0.95rem;
		font-weight: 500;
	}
	.artist {
		margin: 0;
		font-size: 0.85rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
	}
	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s;
		color: var(--text-main);
	}
	.btn-icon:hover {
		background: rgb(var(--accent-glow) / 0.3);
		border-color: rgb(var(--accent-glow) / 0.5);
		transform: scale(1.1);
	}
</style>

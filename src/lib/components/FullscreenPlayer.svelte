<script lang="ts">
	import { X, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Download } from 'lucide-svelte';
	import { player } from '$lib/stores/player.svelte';
	import { downloadSong } from '$lib/utils/download';
	import { toast } from 'svelte-sonner';
	import type { Quality } from '$lib/api/types';
	import LyricView from './LyricView.svelte';
	import GlassSelect from './ui/GlassSelect.svelte';
	import GlassSlider from './ui/GlassSlider.svelte';

	const qualityItems = [
		{ value: '128', label: '标准' },
		{ value: '192', label: '较高' },
		{ value: '320', label: '极高' },
		{ value: '740', label: 'HQ无损' },
		{ value: '999', label: 'Hi-Res' }
	];

	function handleQualityChange(v: string) {
		void player.setQuality(v as Quality);
	}

	function formatTime(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	async function handleDownload() {
		if (!player.current) return;
		try {
			await downloadSong(player.current, player.quality);
			toast.success('下载成功');
		} catch {
			toast.error('下载失败');
		}
	}

	const modeIcon = $derived.by(() => {
		if (player.mode === 'repeat') return Repeat;
		if (player.mode === 'shuffle') return Shuffle;
		return null;
	});
</script>

{#if player.expanded && player.current}
	<div class="fullscreen-player">
		{#if player.current.cover}
			<div class="bg-cover" style:background-image="url({player.current.cover})"></div>
		{/if}

		<div class="player-content glass">
			<button class="btn-close" onclick={() => player.toggleExpand()}>
				<X size={24} />
			</button>

			<div class="layout">
				<!-- 左栏：封面 + 信息 + 控制 -->
				<div class="left-panel">
					<div class="cover-section">
						{#if player.current.cover}
							<img
								src={player.current.cover}
								alt={player.current.name}
								class="cover"
								class:disc-spinning={player.playing}
								class:disc-paused={!player.playing}
							/>
						{:else}
							<div class="cover placeholder"></div>
						{/if}
					</div>

					<div class="song-meta">
						<h2 class="song-name">{player.current.name}</h2>
						<p class="song-artist text-sub">{player.current.artists.join(' / ')}</p>
					</div>

					<div class="progress-section">
						<span class="time-label">{formatTime(player.currentTime)}</span>
						<div class="progress-slider">
							<GlassSlider
								value={player.progress}
								min={0}
								max={1}
								step={0.001}
								ariaLabel="播放进度"
								onValueChange={(v) => player.seekRatio(v)}
							/>
						</div>
						<span class="time-label">{formatTime(player.duration)}</span>
					</div>

					<div class="controls">
						<button class="btn-mode" onclick={() => player.cycleMode()} title="播放模式">
							{#if modeIcon}
								{@const Icon = modeIcon}
								<Icon size={22} />
							{:else}
								<span style="font-size:1.2rem;">▶</span>
							{/if}
						</button>
						<button class="btn-ctrl" onclick={() => player.prev()}>
							<SkipBack size={28} />
						</button>
						<button class="btn-play" onclick={() => player.togglePlay()}>
							{#if player.playing}
								<Pause size={32} />
							{:else}
								<Play size={32} />
							{/if}
						</button>
						<button class="btn-ctrl" onclick={() => player.next()}>
							<SkipForward size={28} />
						</button>
						<div class="quality-group">
							<GlassSelect
								value={player.quality}
								items={qualityItems}
								triggerLabel="音质"
								ariaLabel="音质"
								minWidth="68px"
								onValueChange={handleQualityChange}
							/>
						</div>
					</div>

					<button class="btn-download glass-interactive" onclick={handleDownload}>
						<Download size={18} />
						<span>下载</span>
					</button>
				</div>

				<!-- 右栏：歌词全高 -->
				<div class="right-panel">
					<LyricView />
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.fullscreen-player {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(40px);
		background: rgba(0, 0, 0, 0.6);
	}
	.bg-cover {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		filter: blur(60px);
		opacity: 0.3;
		z-index: -1;
	}
	.player-content {
		position: relative;
		width: min(94vw, 1080px);
		height: min(88vh, 720px);
		padding: 2rem;
		overflow: hidden;
	}
	.btn-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--text-main);
		transition: all 0.3s;
	}
	.btn-close:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: scale(1.1);
	}

	/* ===== 双栏布局 ===== */
	.layout {
		display: flex;
		gap: 2.5rem;
		height: 100%;
	}
	.left-panel {
		flex: 0 0 360px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1.5rem;
		min-width: 0;
	}
	.right-panel {
		flex: 1;
		min-width: 0;
		min-height: 0;
	}

	.cover-section {
		display: flex;
		justify-content: center;
	}
	.cover {
		width: 240px;
		height: 240px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}
	.cover.placeholder {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
	}
	.song-meta {
		text-align: center;
	}
	.song-name {
		margin: 0 0 0.5rem;
		font-size: 1.4rem;
		font-weight: 600;
	}
	.song-artist {
		margin: 0;
		font-size: 1rem;
	}
	.progress-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.time-label {
		font-size: 0.85rem;
		color: var(--text-sub);
		min-width: 42px;
	}
	.progress-slider {
		flex: 1;
	}
	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}
	.btn-ctrl,
	.btn-play,
	.btn-mode {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 50%;
		color: var(--text-main);
		cursor: pointer;
		transition: all 0.3s;
	}
	.btn-mode {
		width: 44px;
		height: 44px;
	}
	.btn-ctrl {
		width: 52px;
		height: 52px;
	}
	.btn-play {
		width: 68px;
		height: 68px;
		background: rgba(255, 255, 255, 0.15);
	}
	.btn-ctrl:hover,
	.btn-play:hover,
	.btn-mode:hover {
		background: rgb(var(--accent-glow) / 0.3);
		transform: scale(1.1);
	}

	/* ===== 音质选择容器 ===== */
	.quality-group {
		position: relative;
	}

	/* ===== 下载按钮 ===== */
	.btn-download {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.75rem;
		color: var(--text-main);
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.3s;
	}
	.btn-download:hover {
		background: rgb(var(--accent-glow) / 0.25);
		transform: translateY(-2px);
	}

	/* ===== 窄屏回退为单栏 ===== */
	@media (max-width: 768px) {
		.player-content {
			width: 94vw;
			height: 90vh;
			padding: 1.25rem;
		}
		.layout {
			flex-direction: column;
			gap: 1rem;
			overflow-y: auto;
		}
		.left-panel {
			flex: none;
			gap: 1rem;
		}
		.cover {
			width: 180px;
			height: 180px;
		}
		.right-panel {
			flex: none;
			height: 40vh;
			min-height: 240px;
		}
	}
</style>

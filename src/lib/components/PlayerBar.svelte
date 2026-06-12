<script lang="ts">
	import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp } from 'lucide-svelte';
	import { player } from '$lib/stores/player.svelte';
	import { applyCoverColor } from '$lib/utils/vibrant';
	import GlassSlider from './ui/GlassSlider.svelte';

	let showVolume = $state(false);
	let lastVolume = 0.8;

	function toggleMute() {
		if (player.volume > 0) {
			lastVolume = player.volume;
			player.setVolume(0);
		} else {
			player.setVolume(lastVolume || 0.8);
		}
	}

	// 当前歌曲切换时提取封面主色
	$effect(() => {
		const cover = player.current?.cover;
		void applyCoverColor(cover);
	});

	function formatTime(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

{#if player.current}
	<div class="player-bar glass">
		<!-- 进度条（顶部） -->
		<div class="progress-wrap">
			<GlassSlider
				value={player.progress}
				min={0}
				max={1}
				step={0.001}
				ariaLabel="播放进度"
				onValueChange={(v) => player.seekRatio(v)}
			/>
		</div>

		<div class="player-content">
			<!-- 左：当前曲信息 -->
			<div class="song-info">
				{#if player.current.cover}
					<img src={player.current.cover} alt={player.current.name} class="mini-cover" />
				{:else}
					<div class="mini-cover placeholder"></div>
				{/if}
				<div class="text">
					<p class="name line-clamp-1">{player.current.name}</p>
					<p class="artist text-sub line-clamp-1">{player.current.artists.join(' / ')}</p>
				</div>
			</div>

			<!-- 中：播放控制 -->
			<div class="controls">
				<button class="btn-ctrl" onclick={() => player.prev()} title="上一首">
					<SkipBack size={20} />
				</button>
				<button class="btn-play" onclick={() => player.togglePlay()} title="播放/暂停">
					{#if player.playing}
						<Pause size={24} />
					{:else}
						<Play size={24} />
					{/if}
				</button>
				<button class="btn-ctrl" onclick={() => player.next()} title="下一首">
					<SkipForward size={20} />
				</button>
			</div>

			<!-- 右：时间 + 音量 + 展开 -->
			<div class="right">
				<span class="time">{formatTime(player.currentTime)} / {formatTime(player.duration)}</span>
				<div
					class="volume-group"
					role="group"
					onmouseenter={() => (showVolume = true)}
					onmouseleave={() => (showVolume = false)}
				>
					<button class="btn-ctrl" title="音量" onclick={toggleMute}>
						{#if player.volume === 0}
							<VolumeX size={18} />
						{:else}
							<Volume2 size={18} />
						{/if}
					</button>
					{#if showVolume}
						<div class="volume-popup glass">
							<span class="volume-pct">{Math.round(player.volume * 100)}</span>
							<div class="volume-slider-wrap">
								<GlassSlider
									value={player.volume}
									min={0}
									max={1}
									step={0.01}
									orientation="vertical"
									ariaLabel="音量"
									onValueChange={(v) => player.setVolume(v)}
								/>
							</div>
						</div>
					{/if}
				</div>
				<button class="btn-ctrl" onclick={() => player.toggleExpand()} title="展开">
					<ChevronUp size={18} />
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.player-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
		border-radius: var(--radius-glass) var(--radius-glass) 0 0;
	}
	.progress-wrap {
		padding: 0 0.5rem;
	}
	.player-content {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.75rem 1.25rem;
	}
	.song-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}
	.mini-cover {
		width: 48px;
		height: 48px;
		border-radius: 0.5rem;
		object-fit: cover;
		flex-shrink: 0;
	}
	.mini-cover.placeholder {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
	}
	.text {
		flex: 1;
		min-width: 0;
	}
	.name {
		margin: 0 0 0.2rem;
		font-size: 0.95rem;
		font-weight: 500;
	}
	.artist {
		margin: 0;
		font-size: 0.85rem;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.btn-ctrl,
	.btn-play {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--text-main);
		cursor: pointer;
		transition: all 0.3s;
		padding: 0.5rem;
		border-radius: 50%;
	}
	.btn-play {
		width: 48px;
		height: 48px;
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}
	.btn-ctrl:hover,
	.btn-play:hover {
		background: rgb(var(--accent-glow) / 0.3);
		transform: scale(1.1);
	}
	.right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.time {
		font-size: 0.85rem;
		color: var(--text-sub);
		white-space: nowrap;
	}
	.volume-group {
		position: relative;
		display: flex;
		align-items: center;
	}
	.volume-popup {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		padding: 0.85rem 0.5rem 0.65rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		border-radius: 0.75rem;
	}
	.volume-slider-wrap {
		height: 96px;
		display: flex;
		justify-content: center;
	}
	.volume-pct {
		font-size: 0.72rem;
		color: var(--text-sub);
		min-width: 1.5em;
		text-align: center;
	}
</style>

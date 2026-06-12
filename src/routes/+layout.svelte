<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';
	import PlayerBar from '$lib/components/PlayerBar.svelte';
	import FullscreenPlayer from '$lib/components/FullscreenPlayer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>云听 · 音乐</title>
	<meta name="description" content="在线听歌、实时歌词、下载 — 基于 GD Studio API" />
</svelte:head>

<ModeWatcher />
<Toaster position="top-center" richColors />

<!-- 动态氛围背景：随当前封面主色变化 -->
<div class="ambient-bg" aria-hidden="true"></div>

{@render children()}

<PlayerBar />
<FullscreenPlayer />

// ============ 全局播放器状态机（Svelte 5 Runes） ============
// 封装原生 HTML5 Audio，管理队列 / 进度 / 音量 / 音质 / 播放模式。
// 切音质 = 重新请求 url 并保持当前进度。localStorage 持久化。

import { browser } from '$app/environment';
import type { Song, Quality, MusicSource } from '$lib/api/types';
import { getSongUrl, getPicUrl } from '$lib/api/music';

export type PlayMode = 'order' | 'repeat' | 'shuffle';

const LS_KEY = 'mp-player-state';

interface PersistState {
	queue: Song[];
	index: number;
	volume: number;
	quality: Quality;
	mode: PlayMode;
}

function loadPersist(): Partial<PersistState> {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(LS_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

class PlayerStore {
	// ---------- 响应式状态 ----------
	queue = $state<Song[]>([]);
	index = $state(-1);
	playing = $state(false);
	/** 当前播放进度（秒） */
	currentTime = $state(0);
	/** 当前曲目总时长（秒） */
	duration = $state(0);
	volume = $state(0.8);
	quality = $state<Quality>('999');
	mode = $state<PlayMode>('order');
	/** 加载中（请求 url / 缓冲） */
	loading = $state(false);
	/** 当前曲目实际音质 */
	currentBr = $state(0);
	/** 全屏播放器是否打开 */
	expanded = $state(false);

	private audio: HTMLAudioElement | null = null;

	// ---------- 派生状态 ----------
	get current(): Song | null {
		return this.index >= 0 && this.index < this.queue.length ? this.queue[this.index] : null;
	}

	get hasNext(): boolean {
		return this.queue.length > 1;
	}

	get progress(): number {
		return this.duration > 0 ? this.currentTime / this.duration : 0;
	}

	// ---------- 初始化（仅浏览器端，在 layout onMount 调用） ----------
	init() {
		if (!browser || this.audio) return;

		const saved = loadPersist();
		if (saved.queue?.length) this.queue = saved.queue;
		if (typeof saved.index === 'number') this.index = saved.index;
		if (typeof saved.volume === 'number') this.volume = saved.volume;
		if (saved.quality) this.quality = saved.quality;
		if (saved.mode) this.mode = saved.mode;

		const a = new Audio();
		a.volume = this.volume;
		a.preload = 'auto';

		a.addEventListener('timeupdate', () => {
			this.currentTime = a.currentTime;
		});
		a.addEventListener('durationchange', () => {
			this.duration = Number.isFinite(a.duration) ? a.duration : 0;
		});
		a.addEventListener('ended', () => this.onEnded());
		a.addEventListener('play', () => (this.playing = true));
		a.addEventListener('pause', () => (this.playing = false));
		a.addEventListener('waiting', () => (this.loading = true));
		a.addEventListener('canplay', () => (this.loading = false));
		a.addEventListener('error', () => {
			this.loading = false;
			this.playing = false;
		});

		this.audio = a;

		// 恢复曲目元信息（不自动播放，等用户交互）
		if (this.current) {
			void this.resolveCover(this.current);
		}
	}

	// ---------- 持久化 ----------
	private persist() {
		if (!browser) return;
		const data: PersistState = {
			queue: this.queue,
			index: this.index,
			volume: this.volume,
			quality: this.quality,
			mode: this.mode
		};
		try {
			localStorage.setItem(LS_KEY, JSON.stringify(data));
		} catch {
			/* 忽略配额错误 */
		}
	}

	// ---------- 封面懒加载 ----------
	private async resolveCover(song: Song) {
		if (song.cover) return;
		try {
			const url = await getPicUrl(song.picId, song.source, '500');
			if (url) {
				song.cover = url;
				// 触发响应式更新
				this.queue = [...this.queue];
			}
		} catch {
			/* 忽略封面失败 */
		}
	}

	// ---------- 加载并播放当前 index 的曲目 ----------
	private async loadCurrent(autoplay = true) {
		const song = this.current;
		if (!song || !this.audio) return;

		this.loading = true;
		void this.resolveCover(song);

		try {
			const { url, br } = await getSongUrl(song.id, song.source, this.quality);
			if (!url) throw new Error('无可用播放地址');
			// 防止竞态：加载期间用户已切歌
			if (this.current?.id !== song.id) return;
			this.currentBr = br;
			this.audio.src = url;
			this.audio.load();
			if (autoplay) {
				await this.audio.play();
			}
		} catch (e) {
			this.loading = false;
			throw e;
		}
	}

	// ============ 对外控制方法 ============

	/** 播放单曲：替换队列并播放（用于点击搜索结果） */
	async playSong(song: Song) {
		this.queue = [song];
		this.index = 0;
		this.persist();
		await this.loadCurrent(true);
	}

	/** 加入队列末尾（不打断当前播放） */
	addToQueue(song: Song) {
		if (this.queue.some((s) => s.id === song.id && s.source === song.source)) return;
		this.queue = [...this.queue, song];
		if (this.index < 0) {
			this.index = 0;
			void this.loadCurrent(false);
		}
		this.persist();
	}

	/** 播放队列中指定下标 */
	async playAt(i: number) {
		if (i < 0 || i >= this.queue.length) return;
		this.index = i;
		this.persist();
		await this.loadCurrent(true);
	}

	/** 用一组歌曲替换队列并从指定位置播放 */
	async playList(songs: Song[], startAt = 0) {
		if (!songs.length) return;
		this.queue = [...songs];
		this.index = startAt;
		this.persist();
		await this.loadCurrent(true);
	}

	togglePlay() {
		if (!this.audio || !this.current) return;
		if (this.playing) {
			this.audio.pause();
		} else {
			void this.audio.play();
		}
	}

	async next(manual = false) {
		if (!this.queue.length) return;
		if (this.mode === 'shuffle') {
			this.index = this.randomIndex();
		} else {
			this.index = (this.index + 1) % this.queue.length;
		}
		this.persist();
		await this.loadCurrent(true);
		void manual;
	}

	async prev() {
		if (!this.queue.length) return;
		if (this.currentTime > 3 && this.audio) {
			// 进度超过 3 秒则重播当前曲
			this.audio.currentTime = 0;
			return;
		}
		if (this.mode === 'shuffle') {
			this.index = this.randomIndex();
		} else {
			this.index = (this.index - 1 + this.queue.length) % this.queue.length;
		}
		this.persist();
		await this.loadCurrent(true);
	}

	private randomIndex(): number {
		if (this.queue.length <= 1) return this.index;
		let i = this.index;
		while (i === this.index) i = Math.floor(Math.random() * this.queue.length);
		return i;
	}

	private onEnded() {
		if (this.mode === 'repeat') {
			if (this.audio) {
				this.audio.currentTime = 0;
				void this.audio.play();
			}
			return;
		}
		void this.next();
	}

	/** 跳转到指定秒 */
	seek(sec: number) {
		if (this.audio && Number.isFinite(sec)) {
			this.audio.currentTime = Math.max(0, Math.min(sec, this.duration));
			this.currentTime = this.audio.currentTime;
		}
	}

	/** 按进度比例跳转（0~1） */
	seekRatio(ratio: number) {
		this.seek(ratio * this.duration);
	}

	setVolume(v: number) {
		this.volume = Math.max(0, Math.min(1, v));
		if (this.audio) this.audio.volume = this.volume;
		this.persist();
	}

	/** 切换音质：重请求 url 并保持当前进度 + 播放状态 */
	async setQuality(q: Quality) {
		if (q === this.quality) return;
		this.quality = q;
		this.persist();
		const song = this.current;
		if (!song || !this.audio) return;

		const resumeAt = this.audio.currentTime;
		const wasPlaying = this.playing;
		this.loading = true;
		try {
			const { url, br } = await getSongUrl(song.id, song.source, q);
			if (!url || this.current?.id !== song.id) return;
			this.currentBr = br;
			this.audio.src = url;
			this.audio.load();
			const restore = () => {
				this.audio!.currentTime = resumeAt;
				if (wasPlaying) void this.audio!.play();
				this.audio!.removeEventListener('canplay', restore);
			};
			this.audio.addEventListener('canplay', restore);
		} catch {
			this.loading = false;
		}
	}

	cycleMode() {
		const order: PlayMode[] = ['order', 'repeat', 'shuffle'];
		this.mode = order[(order.indexOf(this.mode) + 1) % order.length];
		this.persist();
	}

	/** 从队列移除指定下标 */
	removeAt(i: number) {
		if (i < 0 || i >= this.queue.length) return;
		const removingCurrent = i === this.index;
		this.queue = this.queue.filter((_, idx) => idx !== i);

		if (this.queue.length === 0) {
			this.index = -1;
			this.stop();
		} else if (i < this.index) {
			this.index--;
		} else if (removingCurrent) {
			if (this.index >= this.queue.length) this.index = 0;
			void this.loadCurrent(this.playing);
		}
		this.persist();
	}

	/** 队列拖拽重排 */
	reorder(from: number, to: number) {
		if (from === to || from < 0 || to < 0) return;
		const list = [...this.queue];
		const [moved] = list.splice(from, 1);
		list.splice(to, 0, moved);
		// 维护当前播放项的 index
		const currentId = this.current?.id;
		this.queue = list;
		if (currentId) this.index = list.findIndex((s) => s.id === currentId);
		this.persist();
	}

	clearQueue() {
		this.stop();
		this.queue = [];
		this.index = -1;
		this.persist();
	}

	private stop() {
		if (this.audio) {
			this.audio.pause();
			this.audio.removeAttribute('src');
			this.audio.load();
		}
		this.playing = false;
		this.currentTime = 0;
		this.duration = 0;
	}

	toggleExpand() {
		this.expanded = !this.expanded;
	}
}

export const player = new PlayerStore();

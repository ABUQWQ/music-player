// ============ GD Studio Music API 封装层 ============
// 所有页面/组件统一走此层（DRY）。纯浏览器端调用，API 返回 CORS *。
// 限制：5 分钟内不超过 50 次请求 → 内置内存缓存 + 串行节流队列。

import type {
	SearchResult,
	SongUrl,
	LyricResult,
	MusicSource,
	Quality,
	Song
} from './types';

const API_BASE = 'https://music-api.gdstudio.xyz/api.php';

// ---------- 内存缓存（Map，按 URL 维度） ----------
const cache = new Map<string, { data: unknown; expire: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

function getCache<T>(key: string): T | null {
	const hit = cache.get(key);
	if (hit && hit.expire > Date.now()) return hit.data as T;
	if (hit) cache.delete(key);
	return null;
}

function setCache(key: string, data: unknown) {
	cache.set(key, { data, expire: Date.now() + CACHE_TTL });
}

// ---------- 串行节流队列（相邻请求间隔，规避频率限制） ----------
const MIN_INTERVAL = 250; // ms
let lastRequest = 0;
let chain: Promise<unknown> = Promise.resolve();

function throttle<T>(task: () => Promise<T>): Promise<T> {
	const run = chain.then(async () => {
		const wait = MIN_INTERVAL - (Date.now() - lastRequest);
		if (wait > 0) await new Promise((r) => setTimeout(r, wait));
		lastRequest = Date.now();
		return task();
	});
	// 保持链条不因单个错误中断
	chain = run.catch(() => undefined);
	return run;
}

// ---------- 核心请求函数（缓存优先 + 节流 + JSON 解析） ----------
async function request<T>(params: Record<string, string>): Promise<T> {
	const qs = new URLSearchParams(params).toString();
	const url = `${API_BASE}?${qs}`;

	const cached = getCache<T>(url);
	if (cached !== null) return cached;

	const data = await throttle(async () => {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`API 请求失败：${res.status}`);
		return (await res.json()) as T;
	});

	setCache(url, data);
	return data;
}

// ============ 对外 API ============

/** 搜索曲目 */
export async function searchSongs(
	keyword: string,
	source: MusicSource = 'netease',
	count = 20,
	page = 1
): Promise<Song[]> {
	if (!keyword.trim()) return [];
	const results = await request<SearchResult[]>({
		types: 'search',
		source,
		name: keyword,
		count: String(count),
		pages: String(page)
	});
	if (!Array.isArray(results)) return [];
	return results.map(toSong);
}

/** SearchResult → 应用内 Song 模型 */
function toSong(r: SearchResult): Song {
	return {
		id: r.id,
		name: r.name,
		artists: Array.isArray(r.artist) ? r.artist : [r.artist].filter(Boolean),
		album: r.album,
		picId: r.pic_id,
		lyricId: r.lyric_id,
		source: r.source
	};
}

/** 获取播放 URL */
export async function getSongUrl(
	id: string,
	source: MusicSource = 'netease',
	br: Quality = '999'
): Promise<SongUrl> {
	return request<SongUrl>({ types: 'url', source, id, br });
}

/** 获取专辑图 URL（size: 300 小图 / 500 大图） */
export async function getPicUrl(
	picId: string,
	source: MusicSource = 'netease',
	size: '300' | '500' = '500'
): Promise<string> {
	if (!picId) return '';
	const res = await request<{ url: string }>({
		types: 'pic',
		source,
		id: picId,
		size
	});
	return res?.url ?? '';
}

/** 获取歌词（LRC） */
export async function getLyric(
	lyricId: string,
	source: MusicSource = 'netease'
): Promise<LyricResult> {
	return request<LyricResult>({ types: 'lyric', source, id: lyricId });
}

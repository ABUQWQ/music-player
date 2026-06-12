// ============ GD Studio Music API 类型定义 ============

/** 音乐源 */
export type MusicSource =
	| 'netease'
	| 'tencent'
	| 'kuwo'
	| 'tidal'
	| 'qobuz'
	| 'joox'
	| 'bilibili'
	| 'apple'
	| 'ytmusic'
	| 'spotify';

/** 音质（740=16bit无损，999=24bit无损） */
export type Quality = '128' | '192' | '320' | '740' | '999';

/** 搜索接口返回的单条曲目 */
export interface SearchResult {
	id: string;
	name: string;
	artist: string[];
	album: string;
	pic_id: string;
	url_id: string;
	lyric_id: string;
	source: MusicSource;
}

/** 播放 URL 接口返回 */
export interface SongUrl {
	url: string;
	br: number;
	/** 文件大小，单位 KB */
	size: number;
}

/** 专辑图接口返回 */
export interface PicResult {
	url: string;
}

/** 歌词接口返回 */
export interface LyricResult {
	/** LRC 格式原语种歌词 */
	lyric: string;
	/** LRC 格式中文翻译歌词，可能为空 */
	tlyric: string;
}

/** 应用内统一使用的歌曲模型（由 SearchResult 转换而来，附带运行时字段） */
export interface Song {
	id: string;
	name: string;
	artists: string[];
	album: string;
	picId: string;
	lyricId: string;
	source: MusicSource;
	/** 运行时填充：封面图 URL（懒加载后缓存） */
	cover?: string;
}

// ============ LRC 歌词解析 ============
// 解析 GD Studio API 返回的 LRC 文本，支持原文 + 翻译合并。

export interface LyricLine {
	/** 时间戳（秒） */
	time: number;
	/** 原文 */
	text: string;
	/** 翻译（tlyric 对齐后填充，可能为空） */
	translation?: string;
}

// 匹配 [mm:ss.xx] 或 [mm:ss] 时间标签，一行可能有多个
const TIME_TAG = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

/** 解析单条 LRC 文本为 {time, text}[] */
function parseLrc(lrc: string): LyricLine[] {
	if (!lrc) return [];
	const lines: LyricLine[] = [];

	for (const raw of lrc.split(/\r?\n/)) {
		TIME_TAG.lastIndex = 0;
		const tags: number[] = [];
		let match: RegExpExecArray | null;
		// 收集本行所有时间标签
		while ((match = TIME_TAG.exec(raw)) !== null) {
			const min = parseInt(match[1], 10);
			const sec = parseInt(match[2], 10);
			let ms = 0;
			if (match[3]) {
				// 归一化为毫秒（支持两位或三位）
				ms = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
			}
			tags.push(min * 60 + sec + ms / 1000);
		}
		if (tags.length === 0) continue;

		// 去除所有时间标签后的纯文本
		const text = raw.replace(TIME_TAG, '').trim();
		// 跳过纯元信息空行（如只有 [by:xxx] 之类已被上面过滤；这里保留空文本占位以维持滚动节奏可选）
		for (const t of tags) {
			lines.push({ time: t, text });
		}
	}

	return lines.sort((a, b) => a.time - b.time);
}

/**
 * 合并原文与翻译。
 * 以原文时间轴为基准，翻译按时间就近匹配（同一时间戳）。
 */
export function parseLyric(lyric: string, tlyric?: string): LyricLine[] {
	const main = parseLrc(lyric).filter((l) => l.text.length > 0);
	if (!tlyric) return main;

	const trans = parseLrc(tlyric).filter((l) => l.text.length > 0);
	if (trans.length === 0) return main;

	// 建立翻译时间索引（容差 0.3s 内视为同一行）
	for (const line of main) {
		const hit = trans.find((t) => Math.abs(t.time - line.time) < 0.35);
		if (hit) line.translation = hit.text;
	}
	return main;
}

/**
 * 根据当前播放时间，二分查找应高亮的歌词行下标。
 * 返回 -1 表示尚未到第一行。
 */
export function findActiveLine(lines: LyricLine[], time: number): number {
	if (lines.length === 0 || time < lines[0].time) return -1;
	let lo = 0;
	let hi = lines.length - 1;
	let ans = 0;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		if (lines[mid].time <= time) {
			ans = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	return ans;
}

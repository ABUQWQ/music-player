// ============ 歌曲下载工具 ============
// 取播放直链 → fetch 成 blob → createObjectURL → 触发 <a download>。
// 文件名规范为「歌手 - 歌名.ext」，自动清理非法字符。

import { getSongUrl } from '$lib/api/music';
import type { Song, Quality } from '$lib/api/types';

/** 清理文件名中的非法字符（Windows/类Unix 通用） */
function sanitize(name: string): string {
	return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
}

/** 从 URL 推断音频扩展名，默认 mp3 */
function extFromUrl(url: string): string {
	const m = url.split('?')[0].match(/\.(mp3|flac|m4a|wav|ogg|aac)$/i);
	return m ? m[1].toLowerCase() : 'mp3';
}

/**
 * 下载指定歌曲。返回 Promise，调用方负责 toast 反馈。
 * @param song 目标曲目
 * @param quality 音质（默认 999）
 */
export async function downloadSong(song: Song, quality: Quality = '999'): Promise<void> {
	const { url } = await getSongUrl(song.id, song.source, quality);
	if (!url) throw new Error('无可用下载地址');

	const filename = `${sanitize(song.artists.join(','))} - ${sanitize(song.name)}.${extFromUrl(url)}`;

	const res = await fetch(url);
	if (!res.ok) throw new Error(`下载失败：${res.status}`);
	const blob = await res.blob();

	const objectUrl = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = objectUrl;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	// 释放内存
	setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

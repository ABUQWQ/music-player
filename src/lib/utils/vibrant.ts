// ============ 封面主色提取（node-vibrant） ============
// 从当前封面提取主色，注入到 :root CSS 变量，驱动动态氛围背景。
// 1+1>2 的灵魂：背景光晕随当前歌曲封面变化，叠加 Liquid Glass 折射。

import { browser } from '$app/environment';
import { Vibrant } from 'node-vibrant/browser';

// 缓存：同一封面 URL 不重复提取
const colorCache = new Map<string, [string, string]>();

/** 默认中性紫（无封面 / 提取失败时） */
const DEFAULT: [string, string] = ['168 130 220', '120 90 200'];

/**
 * 从封面 URL 提取主色并注入 CSS 变量。
 * @param coverUrl 封面图地址（500px）
 */
export async function applyCoverColor(coverUrl: string | undefined): Promise<void> {
	if (!browser) return;
	if (!coverUrl) {
		injectColors(DEFAULT);
		return;
	}

	const cached = colorCache.get(coverUrl);
	if (cached) {
		injectColors(cached);
		return;
	}

	try {
		const palette = await Vibrant.from(coverUrl).getPalette();
		// 优先 Vibrant，回退到其他可用色板
		const primary =
			palette.Vibrant ?? palette.LightVibrant ?? palette.Muted ?? palette.DarkVibrant;
		const secondary =
			palette.DarkVibrant ?? palette.Muted ?? palette.DarkMuted ?? palette.Vibrant;

		const c1 = primary ? rgbStr(primary.rgb) : DEFAULT[0];
		const c2 = secondary ? rgbStr(secondary.rgb) : DEFAULT[1];
		const pair: [string, string] = [c1, c2];
		colorCache.set(coverUrl, pair);
		injectColors(pair);
	} catch {
		injectColors(DEFAULT);
	}
}

/** [r,g,b] → "r g b" 字符串（供 rgb(var(--x) / alpha) 使用） */
function rgbStr(rgb: [number, number, number]): string {
	return rgb.map((n) => Math.round(n)).join(' ');
}

function injectColors([c1, c2]: [string, string]): void {
	const root = document.documentElement;
	root.style.setProperty('--accent-glow', c1);
	root.style.setProperty('--accent-glow-2', c2);
}

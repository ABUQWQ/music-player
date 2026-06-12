import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// 规范化 base path：开发时为空，构建时取环境变量，确保符合 `"" | `/${string}`` 类型
const rawBase = process.argv.includes('dev') ? '' : process.env.BASE_PATH || '';
const base = (rawBase && !rawBase.startsWith('/') ? `/${rawBase}` : rawBase) as
	| ''
	| `/${string}`;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				fallback: '404.html'
			}),
			paths: {
				base
			}
		})
	]
});

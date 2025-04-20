import path from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import open from 'open'; // 👈 импортируем open

function reloadExtensionsPlugin() {
  return {
    name: 'reload-extensions-plugin',
    async writeBundle() {
      console.log('♻️ Открываем http://reload.extensions для перезагрузки...');
      await open('http://reload.extensions');
    }
  };
}

export default {
  plugins: [svelte(), reloadExtensionsPlugin()], // 👈 подключаем плагин
  build: {
    rollupOptions: {
      input: path.resolve('src/content/content.js'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'content.js'
      },
      external: []
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  }
};

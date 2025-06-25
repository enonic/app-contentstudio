import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  const isProduction = mode === 'production';

  return {
    base: './',
    plugins: [tailwindcss()],
    build: {
      outDir: path.resolve(__dirname, 'build/resources/main/assets'),
      emptyOutDir: false,
      cssMinify: isProduction,
      rollupOptions: {
        input: {
          'styles/tailwind': path.resolve(__dirname, 'src/main/resources/assets/styles/tailwind.css'),
        },
        output: {
          assetFileNames: '[name][extname]',
        },
      },
    },
  };
});

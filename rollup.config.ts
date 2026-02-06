import { defineConfig } from 'rollup';
import ts from '@rollup/plugin-typescript'; // tslib
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig([
  {
    input: './src/index.ts',
    output: [
      { file: pkg.main.replace('.js', '.cjs'), format: 'cjs', sourcemap: true, exports: 'named' },
      { file: pkg.module, format: 'es', sourcemap: true, exports: 'named' }
    ],
    plugins: [
      resolve(),
      commonjs(),
      ts({ 
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ],
    external: [...Object.keys(pkg.dependencies || {}), 'webpack', 'vite']
  },
  {
    input: './src/index.ts',
    output: [{ file: pkg.types, format: 'es' }],
    plugins: [
      dts({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          paths: {
            '@/*': [path.resolve(__dirname, 'src/*')],
            '#/*': [path.resolve(__dirname, 'types/*')]
          }
        }
      })
    ]
  }
]);
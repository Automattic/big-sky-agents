import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import dts from 'rollup-plugin-dts';
import { babel } from '@rollup/plugin-babel';
import sass from 'rollup-plugin-sass';
import json from '@rollup/plugin-json';
import preserveDirectives from 'rollup-preserve-directives';
import packageJson from './package.json' assert { type: 'json' };

export default [
	{
		input: 'src/index.js',
		context: 'this',
		output: [
			{
				file: packageJson.main,
				format: 'cjs',
				sourcemap: true,
			},
			{
				file: packageJson.module,
				format: 'esm',
				sourcemap: true,
			},
		],
		plugins: [
			resolve(),
			json(),
			preserveDirectives(),
			commonjs(),
			babel( {
				babelHelpers: 'bundled',
				extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
			} ),
			sass( {
				output: 'dist/style.css',
			} ),
			copy( {
				targets: [
					{ src: 'src/components/agent-bg.jpg', dest: 'dist/' },
					{ src: 'src/components/bot.svg', dest: 'dist/' },
				],
			} ),
		],
		external: [ 'react', 'react-dom', 'prop-types', 'PropTypes' ],
	},
	{
		input: 'src/index.d.ts',
		output: [ { file: 'dist/index.d.ts', format: 'esm' } ],
		plugins: [ dts() ],
		external: [ /\.(css|less|scss)$/ ],
	},
];

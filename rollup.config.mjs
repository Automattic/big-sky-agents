import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import dts from 'rollup-plugin-dts';
import { babel } from '@rollup/plugin-babel';
import sass from 'rollup-plugin-sass';
import json from '@rollup/plugin-json';
import url from '@rollup/plugin-url';
import eslint from '@rollup/plugin-eslint';
import preserveDirectives from 'rollup-preserve-directives';
import { visualizer } from 'rollup-plugin-visualizer';
import packageJson from './package.json' assert { type: 'json' };

export default [
	{
		input: 'src/index.js',
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
			eslint( {
				throwOnError: true,
				exclude: [
					'node_modules/**',
					'dist/**',
					'src/**/*.scss',
					'src/**/*.json',
					'src/**/*.riv',
				],
			} ),
			resolve(),
			json(),
			preserveDirectives(),
			commonjs( {
				include: /node_modules/,
				requireReturnsDefault: 'auto', // Fix for __extends issue
			} ),
			url( {
				include: [
					'**/*.riv',
					'**/*.svg',
					'**/*.png',
					'**/*.jp(e)?g',
					'**/*.gif',
					'**/*.webp',
				],
			} ),
			babel( {
				babelHelpers: 'bundled',
				extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
				exclude: [ '**/*.riv' ],
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
			visualizer( {
				open: true,
			} ),
		],
		external: ( id ) => /@wordpress\/|^react|^prop-types/.test( id ),
		context: 'window', // Fix for "this" issue
	},
	{
		input: 'src/index.d.ts',
		output: [ { file: 'dist/index.d.ts', format: 'esm' } ],
		plugins: [ dts() ],
		external: [ /\.(css|less|scss)$/ ],
	},
	{
		input: 'src/vendor.js',
		output: [
			{
				file: 'dist/vendor.js',
				format: 'esm',
				sourcemap: true,
			},
		],
		plugins: [
			resolve(),
			json(),
			preserveDirectives(),
			commonjs( {
				include: /node_modules/,
				requireReturnsDefault: 'auto', // Fix for __extends issue
			} ),
			url( {
				include: [
					'**/*.riv',
					'**/*.svg',
					'**/*.png',
					'**/*.jp(e)?g',
					'**/*.gif',
					'**/*.webp',
				],
			} ),
			babel( {
				babelHelpers: 'bundled',
				extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
				exclude: [ '**/*.riv' ],
			} ),
			sass( {
				output: 'dist/vendor.css',
			} ),
		],
		external: [], // Ensure no modules are marked as external
	},
];

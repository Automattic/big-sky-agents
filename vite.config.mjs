import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import hq from 'alias-hq';
import external from '@yelo/rollup-node-external';
import dts from 'vite-plugin-dts';
import postcssPresetEnv from 'postcss-preset-env';

// https://vitejs.dev/config/
export default defineConfig( {
	resolve: {
		alias: hq.get( 'rollup' ),
	},
	assetsInclude: [ '**/*.riv' ],
	optimizeDeps: {
		include: [ '@rive-app/react-canvas', 'preline' ],
	},
	plugins: [
		react(),
		dts( { rollupTypes: true, exclude: [ '**/*.stories.(ts|tsx)' ] } ),
	],
	build: {
		sourcemap: true,
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: external(),
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
				},
			},
		},
	},
	css: {
		modules: {
			localsConvention: 'camelCase',
		},
		postcss: {
			plugins: [ postcssPresetEnv( {} ) ],
		},
	},
} );

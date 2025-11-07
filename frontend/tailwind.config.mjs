import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
const config = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				brand: {
					background: '#0f1729',
					surface: '#15233a',
					accent: '#f5a524',
					secondary: '#1e3a8a',
					text: '#f8fafc',
					subtle: '#a3b3cd'
				},
				border: {
					DEFAULT: 'rgba(148, 163, 184, 0.3)'
				}
			},
			fontFamily: {
				heading: ['"Work Sans"', 'Inter', 'sans-serif'],
				body: ['"Inter"', 'system-ui', 'sans-serif']
			},
			boxShadow: {
				card: '0 18px 42px -22px rgba(4, 24, 39, 0.6)',
				halo: '0 0 0 1px rgba(245, 165, 36, 0.35)'
			},
			backgroundImage: {
				'grid-soft': 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)'
			},
			borderRadius: {
				xl: '1.25rem'
			}
		}
	},
	plugins: [forms]
};

export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/index.html',
        './src/app/**/*.{html,ts}',
    ],
    theme: {
        extend: {
            colors: {
                mint: '#6FFFE9',
                teal: '#5BC0BE',
                'blue-gray': '#3A506B',
                'dark-blue': '#1C2541',
                navy: '#0B132B'
            },
            fontFamily: {
                alice: ['Alice', 'serif']
            }
        }
    },
    plugins: []
};

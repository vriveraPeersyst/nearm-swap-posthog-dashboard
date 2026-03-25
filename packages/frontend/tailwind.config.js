/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        primary: '#5F8AFA',
        nm: {
          bg: '#F5F6FA',
          bgTop: '#FFFFFF',
          bgBottom: '#EEF0F6',
          header: '#FFFFFF',
          surface: '#FFFFFF',
          surfaceHover: '#F6F6F6',
          card: '#FFFFFF',
          cardHover: '#F6F6F6',
          text: '#3F4246',
          textSecondary: '#999999',
          muted: '#999999',
          border: '#E5E5E5',
          borderLight: '#F6F6F6',
          accent: '#5F8AFA',
          accentDim: 'rgba(95, 138, 250, 0.10)',
          accentGlow: 'rgba(95, 138, 250, 0.15)',
          chip: '#F6F6F6',
          cta: '#5F8AFA',
          ctaHover: '#4A78E8',
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          // Loyalty tiers
          basic: { shade: '#F6F6F6', solid: '#3F4246' },
          ambassador: { shade: '#E5ECFE', solid: '#6B6EF9' },
          premium: { shade: '#FFF4CC', solid: '#FFB050' },
        }
      },
      spacing: {
        '13': '3.25rem',
        '18': '4.5rem',
      },
      height: {
        '13': '3.25rem',
        '18': '4.5rem',
      },
      maxWidth: {
        'content': '1200px',
      },
      borderRadius: {
        'nm': '16px',
        'nm-sm': '8px',
        'nm-lg': '24px',
      },
      boxShadow: {
        'nm': '0px 2px 12px rgba(0, 0, 0, 0.06)',
        'nm-hover': '0px 4px 20px rgba(0, 0, 0, 0.10)',
        'nm-button': '0px 2px 8px rgba(95, 138, 250, 0.25)',
        'nm-glow': '0px 0px 24px rgba(95, 138, 250, 0.10)',
      },
      backgroundImage: {
        'nm-logo-grad': 'linear-gradient(135deg, #5F8AFA 0%, #17D9D4 100%)',
        'nm-hero-grad': 'linear-gradient(180deg, #FFFFFF 0%, #F5F6FA 100%)',
        'nm-card-grad': 'linear-gradient(145deg, #FFFFFF 0%, #F7F8FB 100%)',
        'nm-accent-grad': 'linear-gradient(135deg, #5F8AFA 0%, #17D9D4 100%)',
        'nm-surface-grad': 'linear-gradient(180deg, rgba(95,138,250,0.04) 0%, rgba(95,138,250,0.02) 100%)',
      },
      fontFamily: {
        'sf': ['SF Pro', 'system-ui', 'sans-serif'],
        'sf-mono': ['SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      lineHeight: {
        '12': '3rem',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        templeMaroon: "#5B1E1E",
        templeGold: "#D4AF37",
        templeCream: "#F8F1E5",
        templeBeige: "#E6D3B3",
        templeBrown: "#3D1B12"
      },
      boxShadow: {
        glow: "0 0 18px rgba(212, 175, 55, 0.35)"
      },
      fontFamily: {
        heading: ["Cinzel", "serif"],
        body: ["Hind Madurai", "sans-serif"]
      },
      backgroundImage: {
        mandala:
          "radial-gradient(circle at 25% 20%, rgba(212,175,55,0.12), transparent 30%), radial-gradient(circle at 75% 80%, rgba(248,241,229,0.15), transparent 30%)"
      }
    }
  },
  plugins: []
};


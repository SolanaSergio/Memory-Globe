# Digital Memory Snow Globe

A romantic web application that displays cherished memories in a magical 3D snow globe. Shake the globe to see your memories come to life with beautiful snow effects and transitions.

## Features

- Interactive 3D snow globe with realistic glass and base
- Upload and display photos and videos inside the globe
- Realistic snow particles that respond to shaking
- Multiple ways to interact:
  - Mouse/touch drag
  - Device motion (mobile)
  - Keyboard controls
- Customizable appearance:
  - Snow colors and types
  - Base materials and engravings
  - Theme selection
- Sound effects and haptic feedback
- Responsive design for all devices

## Prerequisites

- Node.js 18.0.0 or higher
- Modern web browser with WebGL support
- For mobile features:
  - Device with accelerometer
  - HTTPS connection (for device motion API)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd digital-snow-globe
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Development

This project uses:
- Three.js for 3D rendering
- TypeScript for type safety
- Vite for development and building
- GSAP for animations
- Howler.js for audio

### Project Structure

```
digital-snow-globe/
├── src/
│   ├── js/          # TypeScript source files
│   ├── css/         # Stylesheets
│   └── assets/      # Static assets
├── public/          # Public static files
└── dist/           # Production build output
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js team for the amazing 3D library
- GSAP team for the animation library
- Howler.js team for the audio library 
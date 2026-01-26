# Running Split Calculator

A frontend-only Progressive Web App (PWA) for calculating running race splits with customizable pacing strategies.

## Features

- **Multiple race distances**: 5K, 10K, Half Marathon, Full Marathon, or custom distance
- **Unit selection**: Kilometers or Miles
- **Pacing strategies**: Even pace, Linear negative split, Linear positive split, Weighted exponential
- **Fixed pace anchors**: Enter specific paces for individual splits
- **Offline support**: Works offline after first load via Service Worker
- **Persistent state**: Automatically saves your inputs when you calculate

## Development

### Setup

```bash
npm install
```

### Running locally

```bash
npm run dev
```

Then open http://localhost:8000 in your browser.

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run linter
npm lint
```

## PWA Offline Testing

To verify offline functionality:

1. **Start the dev server**: `npm run dev`
2. **Open the app**: Navigate to http://localhost:8000
3. **Use the app once**: Calculate some splits to ensure all assets are cached
4. **Open DevTools**: Press F12 or Cmd+Option+I
5. **Go to Application tab** → Service Workers
6. **Verify Service Worker is registered**: You should see "activated and is running"
7. **Go to Network tab** → Check "Offline" checkbox
8. **Refresh the page**: The app should still load and function
9. **Test functionality**:
   - Change distance/unit
   - Enter paces
   - Calculate splits
   - All features should work offline (data is stored in localStorage)

### Expected Behavior

- ✅ App loads while offline
- ✅ All UI interactions work
- ✅ Calculations work
- ✅ State persists across page reloads
- ❌ Initial app load requires network (to cache assets)

## Architecture

This is a **no-build** frontend-only PWA:
- No bundler or build step
- ES modules loaded directly by the browser
- Service Worker caches app shell assets
- All state stored in localStorage
- Vitest + jsdom for testing

### File Structure

```
/public         - Static assets served directly
  index.html    - Main HTML
  styles.css    - App styles
  app.js        - Entry point
  sw.js         - Service Worker
  manifest.webmanifest - PWA manifest
  /icons        - App icons

/src            - Application code (ES modules)
  /domain       - Domain logic (distances, splits)
  /engine       - Calculation engine
  /state        - State management
  /ui           - UI rendering and events
  /persistence  - localStorage utilities
  app.js        - App initialization

/test           - Test files
```

## Browser Support

- Modern browsers with ES modules support
- Chrome/Edge 61+
- Firefox 60+
- Safari 11+
- iOS Safari 11+ (with PWA quirks handling)

## License

MIT

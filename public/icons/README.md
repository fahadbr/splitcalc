# PWA Icons

This directory should contain app icons for the PWA.

## Required Icons

- `icon-192.png` - 192x192px icon
- `icon-512.png` - 512x512px icon

## Generating Icons

You can create icons using any graphics tool. For a simple placeholder:

```bash
# Using ImageMagick (if installed)
convert -size 192x192 -background "#2563eb" -fill white \
  -gravity center -font Arial -pointsize 48 \
  label:"Split\nCalc" icon-192.png

convert -size 512x512 -background "#2563eb" -fill white \
  -gravity center -font Arial -pointsize 128 \
  label:"Split\nCalc" icon-512.png
```

Or use an online tool like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

# Peacock saree photos

Drop the product photos here, one folder per colourway:

```
beige/  grey/  sea-green/  wine/  purple/  blue/
```

Files are uploaded in filename order, so name them for the order you want:

```
beige/01-main.jpg     <- becomes the primary image for that colour
beige/02-side.jpg
beige/03-back.jpg
beige/04-fabric.jpg
```

Then run `npm run db:import:peacock-saree` (needs the R2_* env vars).

Rules for anything that will also go to Flipkart:

- No collages or multi-panel images — one frame per file.
- `01-main` must be a clean single-model shot, plain background, no props.
- No text, watermarks or logos anywhere in the frame.
- At least 500x500 px; 1000x1000+ preferred.

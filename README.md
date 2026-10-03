# Evergreen Passport Print

On-device passport photo editor and 4 × 6 inch sheet generator. Customer photographs are processed in browser memory. No image upload, backend image processing, database, or photo persistence.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. For production, run `npm run build`; the static site is written to `out/`. Serve that directory over HTTPS for camera picker and PWA installation.

## Printing

Save the complete sheet as JPG, copy it to USB, and select **one photo per page** on the HP Photosmart. Disable printer scaling if available. Print and measure the calibration test before relying on exact physical dimensions; browser canvas pixel geometry assumes the printer maps 300 pixels to one inch. Printer borderless cropping and firmware scaling vary by model.

## Privacy

The only persistent browser data is operator settings in localStorage. Photos and generated sheets remain in memory and clear on reload or New Customer. The service worker caches application assets only. No analytics or external image services are included.

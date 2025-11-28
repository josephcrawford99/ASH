import * as Print from 'expo-print';
import { Asset } from 'expo-asset';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { PhotoKey, KeyItem, Floorplan, Coordinates } from '@/types';

// Cache for the vector asset base64
let vectorAssetBase64: string | null = null;

// Load vector.png asset as base64
async function loadVectorAsset(): Promise<string | null> {
  if (vectorAssetBase64) return vectorAssetBase64;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asset = Asset.fromModule(require('../assets/vector.png'));
    await asset.downloadAsync();

    if (asset.localUri) {
      // Use image manipulator to get base64 (same method that works for photos)
      const result = await manipulateAsync(
        asset.localUri,
        [],
        { base64: true, format: SaveFormat.PNG }
      );
      vectorAssetBase64 = `data:image/png;base64,${result.base64}`;
      return vectorAssetBase64;
    }
  } catch (error) {
    console.warn('Failed to load vector asset:', error);
  }
  return null;
}

interface PdfExportResult {
  success: boolean;
  error?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
}

function formatDirection(direction: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(direction / 45) % 8;
  return `${direction.toFixed(0)}° (${directions[index]})`;
}

// Convert image URI to base64 for embedding in HTML
async function getImageBase64(uri: string): Promise<string | null> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { base64: true, format: SaveFormat.JPEG, compress: 0.8 }
    );
    return `data:image/jpeg;base64,${result.base64}`;
  } catch (error) {
    console.warn('Failed to process image for PDF:', uri, error);
    return null;
  }
}

// Generate HTML for a KeyVector marker using the vector.png asset
function generateVectorHtml(number: number, direction: number | null, vectorBase64: string, size: number = 40): string {
  // The asset points up (0°), so rotate by direction degrees
  const rotation = direction !== null ? direction : 0;

  return `
    <div class="vector-marker" style="width: ${size}px; height: ${size}px;">
      <img src="${vectorBase64}" class="vector-image" style="transform: rotate(${rotation}deg);" />
      <span class="vector-number">${number}</span>
    </div>
  `;
}

// Calculate percentage position of a marker on a floorplan
function calculateFloorplanPosition(
  markerCoords: Coordinates,
  floorplan: Floorplan
): { x: number; y: number } | null {
  if (!floorplan.centerCoordinates || floorplan.scale <= 0) {
    return null;
  }

  const deltaLat = markerCoords.latitude - floorplan.centerCoordinates.latitude;
  const deltaLng = markerCoords.longitude - floorplan.centerCoordinates.longitude;

  // scale = latitudeDelta, rotation = longitudeDelta (repurposed)
  const latDelta = floorplan.scale;
  const lngDelta = floorplan.rotation > 0 ? floorplan.rotation : floorplan.scale;

  // Convert to percentage (0-100)
  const x = 50 + (deltaLng / lngDelta) * 100;
  const y = 50 - (deltaLat / latDelta) * 100;

  // Only return if within reasonable bounds
  if (x >= -20 && x <= 120 && y >= -20 && y <= 120) {
    return { x, y };
  }
  return null;
}

// Generate floorplan with vector overlays
function generateFloorplanWithVectors(
  floorplanBase64: string,
  vectors: { number: number; direction: number | null; position: { x: number; y: number } }[],
  vectorBase64: string,
  isSmall: boolean = false
): string {
  const vectorsHtml = vectors
    .map(v => `
      <div class="floorplan-vector" style="left: ${v.position.x}%; top: ${v.position.y}%;">
        ${generateVectorHtml(v.number, v.direction, vectorBase64, isSmall ? 28 : 36)}
      </div>
    `)
    .join('');

  const sizeClass = isSmall ? 'floorplan-wrapper-small' : 'floorplan-wrapper-large';

  return `
    <div class="floorplan-container">
      <div class="floorplan-wrapper ${sizeClass}">
        <img src="${floorplanBase64}" class="floorplan-image" />
        ${vectorsHtml}
      </div>
    </div>
  `;
}

function generateCoverPageHtml(photoKey: PhotoKey): string {
  const dateCreated = formatDate(photoKey.dateCreated);

  return `
    <div class="page cover-page">
      <div class="cover-content">
        <h1 class="cover-title">${photoKey.name}</h1>
        <p class="cover-date">Photo Key Report</p>
        <p class="cover-date">${dateCreated}</p>
      </div>
    </div>
  `;
}

function generateFloorIntroPageHtml(
  floorLabel: string,
  floorplanBase64: string | null,
  vectors: { number: number; direction: number | null; position: { x: number; y: number } | null }[],
  vectorBase64: string
): string {
  let floorplanHtml = '';

  if (floorplanBase64) {
    const validVectors = vectors
      .filter(v => v.position !== null)
      .map(v => ({ number: v.number, direction: v.direction, position: v.position! }));

    if (validVectors.length > 0) {
      floorplanHtml = generateFloorplanWithVectors(floorplanBase64, validVectors, vectorBase64, false);
    } else {
      floorplanHtml = `
        <div class="floorplan-container">
          <div class="floorplan-wrapper floorplan-wrapper-large">
            <img src="${floorplanBase64}" class="floorplan-image" />
          </div>
        </div>
      `;
    }
  } else {
    floorplanHtml = `<div class="no-floorplan">No floorplan assigned</div>`;
  }

  return `
    <div class="page floor-intro-page">
      <h2 class="floor-intro-title">${floorLabel}</h2>
      ${floorplanHtml}
    </div>
  `;
}

function generatePhotoPageHtml(
  item: KeyItem,
  index: number,
  floorLabel: string,
  imageBase64: string | null,
  floorplanBase64: string | null,
  floorplan: Floorplan | null,
  vectorBase64: string
): string {
  const locationStr = item.coordinates
    ? formatCoordinates(item.coordinates.latitude, item.coordinates.longitude)
    : 'No location data';

  const directionStr = item.direction !== null
    ? formatDirection(item.direction)
    : 'No direction data';

  const imageHtml = imageBase64
    ? `<img src="${imageBase64}" class="photo-image" />`
    : `<div class="photo-placeholder">Photo unavailable</div>`;

  // Generate floorplan with single vector if available
  let floorplanHtml = '';
  if (floorplanBase64 && floorplan && item.coordinates) {
    const position = calculateFloorplanPosition(item.coordinates, floorplan);
    if (position) {
      floorplanHtml = `
        <div class="photo-floorplan-section">
          ${generateFloorplanWithVectors(floorplanBase64, [{ number: index + 1, direction: item.direction, position }], vectorBase64, true)}
        </div>
      `;
    }
  }

  return `
    <div class="page photo-page">
      <div class="photo-header">
        <span class="photo-number">#${index + 1}</span>
        <span class="photo-floor">${floorLabel}</span>
      </div>
      <h2 class="photo-name">${item.name}</h2>
      ${imageHtml}
      ${floorplanHtml}
      <div class="photo-details">
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value mono">${locationStr}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Direction:</span>
          <span class="detail-value mono">${directionStr}</span>
        </div>
        ${item.notes ? `
        <div class="detail-row">
          <span class="detail-label">Notes:</span>
          <span class="detail-value">${item.notes}</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

function generateStyles(): string {
  return `
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1A1A1A;
        background: #FAFAFA;
      }

      .page {
        page-break-after: always;
        padding: 40px;
        min-height: 100vh;
      }

      .page:last-child {
        page-break-after: auto;
      }

      /* Cover Page */
      .cover-page {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .cover-content {
        padding: 40px;
      }

      .cover-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 24px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .cover-date {
        font-size: 16px;
        color: #666;
        margin-bottom: 8px;
      }

      /* Floor Intro Page */
      .floor-intro-page {
        display: flex;
        flex-direction: column;
      }

      .floor-intro-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 24px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .floorplan-container {
        width: 100%;
        text-align: center;
      }

      .floorplan-wrapper {
        position: relative;
        display: inline-block;
      }

      .floorplan-wrapper-large .floorplan-image {
        max-width: 100%;
        max-height: 500px;
      }

      .floorplan-wrapper-small .floorplan-image {
        max-width: 100%;
        max-height: 200px;
      }

      .floorplan-image {
        display: block;
        object-fit: contain;
        border-radius: 8px;
      }

      .floorplan-vector {
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 10;
      }

      .vector-marker {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vector-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .vector-number {
        position: absolute;
        font-size: 11px;
        font-weight: bold;
        color: #1A1A1A;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .no-floorplan {
        padding: 40px;
        text-align: center;
        color: #666;
        font-style: italic;
        background: #F5F5F5;
        border-radius: 8px;
      }

      /* Photo Page */
      .photo-page {
        display: flex;
        flex-direction: column;
      }

      .photo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .photo-number {
        font-size: 24px;
        font-weight: 700;
        color: #1A1A1A;
      }

      .photo-floor {
        font-size: 14px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .photo-name {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 20px;
      }

      .photo-image {
        width: 100%;
        max-height: 300px;
        object-fit: contain;
        border-radius: 8px;
        margin-bottom: 16px;
        background: #E0E0E0;
      }

      .photo-placeholder {
        width: 100%;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #E0E0E0;
        border-radius: 8px;
        margin-bottom: 16px;
        color: #666;
        font-style: italic;
      }

      .photo-floorplan-section {
        margin-bottom: 16px;
      }

      .photo-details {
        background: #F5F5F5;
        border-radius: 8px;
        padding: 16px;
      }

      .detail-row {
        display: flex;
        margin-bottom: 12px;
      }

      .detail-row:last-child {
        margin-bottom: 0;
      }

      .detail-label {
        font-size: 12px;
        text-transform: uppercase;
        color: #666;
        letter-spacing: 0.5px;
        width: 100px;
        flex-shrink: 0;
      }

      .detail-value {
        font-size: 14px;
      }

      .mono {
        font-family: 'Courier New', Courier, monospace;
      }
    </style>
  `;
}

export async function exportPhotoKeyToPdf(photoKey: PhotoKey): Promise<PdfExportResult> {
  try {
    let htmlPages = '';

    // Load the vector asset
    const vectorBase64 = await loadVectorAsset();
    if (!vectorBase64) {
      return { success: false, error: 'Failed to load vector asset' };
    }

    // Cover page
    htmlPages += generateCoverPageHtml(photoKey);

    // Sort floors: numbered floors first (ascending), then unassigned
    const floorEntries = Object.entries(photoKey.floors);
    floorEntries.sort(([a], [b]) => {
      if (a === 'unassigned') return 1;
      if (b === 'unassigned') return -1;
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

    // Collect all items with their floor info and calculate global indices
    const allItems: { item: KeyItem; floorNumber: string; globalIndex: number }[] = [];
    let globalIndex = 0;
    for (const [floorNumber, floor] of floorEntries) {
      for (const item of floor.keyitems) {
        allItems.push({ item, floorNumber, globalIndex });
        globalIndex++;
      }
    }

    // Pre-load all floorplan images
    const floorplanImages: Record<string, string | null> = {};
    for (const [floorNumber, floor] of floorEntries) {
      if (floor.floorplan) {
        floorplanImages[floorNumber] = await getImageBase64(floor.floorplan.imageUri);
      }
    }

    // Generate floor intro pages and photo pages
    for (const [floorNumber, floor] of floorEntries) {
      if (floor.keyitems.length === 0) continue;

      const floorLabel = floorNumber === 'unassigned' ? 'Unassigned' : `Floor ${floorNumber}`;
      const floorplanBase64 = floorplanImages[floorNumber] || null;
      const floorplan = floor.floorplan;

      // Collect vectors for this floor
      const floorVectors = allItems
        .filter(i => i.floorNumber === floorNumber)
        .map(i => ({
          number: i.globalIndex + 1,
          direction: i.item.direction,
          position: i.item.coordinates && floorplan
            ? calculateFloorplanPosition(i.item.coordinates, floorplan)
            : null,
        }));

      // Floor intro page (only for numbered floors with floorplans)
      if (floorNumber !== 'unassigned' && floorplanBase64) {
        htmlPages += generateFloorIntroPageHtml(floorLabel, floorplanBase64, floorVectors, vectorBase64);
      }

      // Photo pages for this floor
      for (const { item, globalIndex: idx } of allItems.filter(i => i.floorNumber === floorNumber)) {
        const imageBase64 = await getImageBase64(item.photoUri);
        htmlPages += generatePhotoPageHtml(item, idx, floorLabel, imageBase64, floorplanBase64, floorplan, vectorBase64);
      }
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${photoKey.name} - Photo Key Report</title>
        ${generateStyles()}
      </head>
      <body>
        ${htmlPages}
      </body>
      </html>
    `;

    // Generate PDF file
    const { uri } = await Print.printToFileAsync({
      html: fullHtml,
      base64: false,
    });

    // Open iOS print dialog with preview and share options
    try {
      await Print.printAsync({ uri });
    } catch (printError) {
      const message = printError instanceof Error ? printError.message : '';
      if (message.includes('did not complete') || message.includes('cancelled') || message.includes('canceled')) {
        return { success: true };
      }
      throw printError;
    }

    return { success: true };
  } catch (error) {
    console.error('PDF export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export PDF',
    };
  }
}

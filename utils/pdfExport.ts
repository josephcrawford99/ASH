import * as Print from 'expo-print';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { PhotoKey, KeyItem } from '@/types';

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
    // Use expo-image-manipulator for reliable base64 conversion
    // This handles HEIC/HEIF and ensures consistent JPEG output
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // Resize to reduce memory usage
      { base64: true, format: SaveFormat.JPEG, compress: 0.8 }
    );

    return `data:image/jpeg;base64,${result.base64}`;
  } catch (error) {
    console.warn('Failed to process image for PDF:', uri, error);
    return null;
  }
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

function generatePhotoPageHtml(
  item: KeyItem,
  index: number,
  floorLabel: string,
  imageBase64: string | null
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

  return `
    <div class="page photo-page">
      <div class="photo-header">
        <span class="photo-number">#${index + 1}</span>
        <span class="photo-floor">${floorLabel}</span>
      </div>
      <h2 class="photo-name">${item.name}</h2>
      ${imageHtml}
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
        max-height: 400px;
        object-fit: contain;
        border-radius: 8px;
        margin-bottom: 20px;
        background: #E0E0E0;
      }

      .photo-placeholder {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #E0E0E0;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #666;
        font-style: italic;
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
    // Build HTML content
    let htmlPages = '';

    // Cover page
    htmlPages += generateCoverPageHtml(photoKey);

    // Collect all items with their floor info and global index
    const allItems: { item: KeyItem; floorNumber: string; globalIndex: number }[] = [];
    let globalIndex = 0;

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

    for (const [floorNumber, floor] of floorEntries) {
      for (const item of floor.keyitems) {
        allItems.push({ item, floorNumber, globalIndex });
        globalIndex++;
      }
    }

    // Generate photo pages
    for (const { item, floorNumber, globalIndex: idx } of allItems) {
      const floorLabel = floorNumber === 'unassigned' ? 'Unassigned' : `Floor ${floorNumber}`;
      const imageBase64 = await getImageBase64(item.photoUri);
      htmlPages += generatePhotoPageHtml(item, idx, floorLabel, imageBase64);
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
      // User cancelled the print dialog - this is not an error
      const message = printError instanceof Error ? printError.message : '';
      if (message.includes('did not complete') || message.includes('cancelled') || message.includes('canceled')) {
        return { success: true }; // User cancelled, not a failure
      }
      throw printError; // Re-throw actual errors
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

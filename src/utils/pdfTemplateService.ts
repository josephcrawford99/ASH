export interface PDFTemplateData {
  mapImageBase64: string;
  photos: Array<{
    imageBase64: string;
    markerNumber: number;
    floor?: number;
    note: string;
  }>;
}

export class PDFTemplateService {
  /**
   * Generates the complete HTML content for PDF export
   */
  static generateHTML(data: PDFTemplateData): string {
    const { mapImageBase64, photos } = data;
    
    const mapPage = this.generateMapPage(mapImageBase64);
    const photoPages = photos.map((photo, index) => 
      this.generatePhotoPage(photo, index === photos.length - 1)
    ).join('');

    return this.wrapInHTMLDocument(mapPage + photoPages);
  }

  /**
   * Generates the map page HTML
   */
  private static generateMapPage(mapImageBase64: string): string {
    return `
      <div style="padding: 40px; page-break-after: always; height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center;">
        <h1 style="color: #333; text-align: center; margin-bottom: 20px;">Map Export</h1>
        <img src="${mapImageBase64}" style="width: 100%; height: auto; max-height: 75vh; object-fit: contain;" alt="Map View" />
      </div>
    `;
  }

  /**
   * Generates a single photo page HTML
   */
  private static generatePhotoPage(
    photo: { imageBase64: string; markerNumber: number; floor?: number; note: string },
    isLastPhoto: boolean
  ): string {
    const floorText = photo.floor ? `Floor ${photo.floor}` : 'No floor specified';
    
    return `
      <div style="padding: 40px;${isLastPhoto ? '' : ' page-break-after: always;'} height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-start;">
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Marker #${photo.markerNumber}</h2>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <img src="${photo.imageBase64}" style="width: 100%; height: auto; max-height: 60vh; object-fit: contain; margin-bottom: 20px;" alt="Photo ${photo.markerNumber}" />
          <div style="text-align: center; margin-top: auto; padding-top: 20px;">
            <p style="font-size: 18px; margin: 10px 0;"><strong>${floorText}</strong></p>
            <p style="font-size: 16px; margin: 10px 0;">${photo.note}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Wraps content in complete HTML document structure
   */
  private static wrapInHTMLDocument(content: string): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            h1, h2 { color: #333; }
            div { padding: 40px; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }
}
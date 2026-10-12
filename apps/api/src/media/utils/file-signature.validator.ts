import { MediaType } from '@packages/shared';

export interface FileInspectionResult {
  isValid: boolean;
  detectedMimeType?: string;
  mediaType?: MediaType;
  width?: number;
  height?: number;
  durationSeconds?: number;
  error?: string;
}

export class FileSignatureValidator {
  /**
   * Inspects a buffer to verify magic bytes and extract dimensions.
   */
  static inspectBuffer(buffer: Buffer, declaredMimeType?: string): FileInspectionResult {
    if (!buffer || buffer.length < 12) {
      return {
        isValid: false,
        error: 'Buffer is too small to inspect file signature',
      };
    }

    // 1. Check PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      let width: number | undefined;
      let height: number | undefined;

      if (buffer.length >= 24) {
        width = buffer.readUInt32BE(16);
        height = buffer.readUInt32BE(20);
      }

      return {
        isValid: true,
        detectedMimeType: 'image/png',
        mediaType: MediaType.IMAGE,
        width,
        height,
      };
    }

    // 2. Check JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      const dimensions = this.extractJpegDimensions(buffer);
      return {
        isValid: true,
        detectedMimeType: 'image/jpeg',
        mediaType: MediaType.IMAGE,
        width: dimensions?.width,
        height: dimensions?.height,
      };
    }

    // 3. Check WebP: 'RIFF' at 0 and 'WEBP' at 8
    if (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      const dimensions = this.extractWebpDimensions(buffer);
      return {
        isValid: true,
        detectedMimeType: 'image/webp',
        mediaType: MediaType.IMAGE,
        width: dimensions?.width,
        height: dimensions?.height,
      };
    }

    // 4. Check MP4 / QuickTime (MOV): ftyp box at offset 4
    if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
      const majorBrand = buffer.toString('ascii', 8, 12);
      const isQuickTime = majorBrand.trim() === 'qt';
      const detectedMimeType = isQuickTime ? 'video/quicktime' : 'video/mp4';

      return {
        isValid: true,
        detectedMimeType,
        mediaType: MediaType.VIDEO,
      };
    }

    return {
      isValid: false,
      error: `Unsupported file signature or corrupt header. Declared: ${declaredMimeType || 'unknown'}`,
    };
  }

  /**
   * Scans JPEG SOF markers to extract true image dimensions.
   */
  private static extractJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = buffer[offset + 1];
      // Markers SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2) contain image height and width
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        if (offset + 9 <= buffer.length) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
      }

      // Variable-length marker: advance by length field
      if (offset + 3 < buffer.length) {
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      } else {
        break;
      }
    }
    return null;
  }

  /**
   * Extracts WebP dimensions based on VP8, VP8L, or VP8X chunks.
   */
  private static extractWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
    if (buffer.length < 30) return null;

    const chunkHeader = buffer.toString('ascii', 12, 16);

    // VP8 (lossy)
    if (chunkHeader === 'VP8 ') {
      // Keyframe check: 0x9d 0x01 0x2a
      if (buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
    }

    // VP8L (lossless)
    if (chunkHeader === 'VP8L') {
      if (buffer[20] === 0x2f) {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        return { width, height };
      }
    }

    // VP8X (extended)
    if (chunkHeader === 'VP8X' && buffer.length >= 30) {
      const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      return { width, height };
    }

    return null;
  }
}

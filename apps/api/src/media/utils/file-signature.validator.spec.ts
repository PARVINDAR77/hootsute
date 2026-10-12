import { FileSignatureValidator } from './file-signature.validator';
import { MediaType } from '@packages/shared';

describe('FileSignatureValidator', () => {
  it('rejects buffers that are too small', () => {
    const smallBuffer = Buffer.from([0x01, 0x02, 0x03]);
    const result = FileSignatureValidator.inspectBuffer(smallBuffer);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too small');
  });

  it('rejects text disguised as an image', () => {
    const fakeBuffer = Buffer.from('This is a text file, definitely not a photo or video!');
    const result = FileSignatureValidator.inspectBuffer(fakeBuffer, 'image/png');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsupported file signature or corrupt header');
  });

  it('correctly validates and parses PNG magic bytes and dimensions', () => {
    // PNG Header: 89 50 4E 47 0D 0A 1A 0A + 4 bytes length + 4 bytes 'IHDR' + 4 bytes width + 4 bytes height
    const pngBuffer = Buffer.alloc(32);
    pngBuffer[0] = 0x89;
    pngBuffer[1] = 0x50;
    pngBuffer[2] = 0x4e;
    pngBuffer[3] = 0x47;
    pngBuffer[4] = 0x0d;
    pngBuffer[5] = 0x0a;
    pngBuffer[6] = 0x1a;
    pngBuffer[7] = 0x0a;
    // Chunk length & IHDR
    pngBuffer.writeUInt32BE(13, 8);
    pngBuffer.write('IHDR', 12, 'ascii');
    // Width: 1920, Height: 1080
    pngBuffer.writeUInt32BE(1920, 16);
    pngBuffer.writeUInt32BE(1080, 20);

    const result = FileSignatureValidator.inspectBuffer(pngBuffer, 'image/png');
    expect(result.isValid).toBe(true);
    expect(result.detectedMimeType).toBe('image/png');
    expect(result.mediaType).toBe(MediaType.IMAGE);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it('correctly validates JPEG magic bytes and extracts dimensions from SOF marker', () => {
    // JPEG SOI: FF D8 FF E0 (JFIF APP0) ... then SOF0 (FF C0)
    const jpegBuffer = Buffer.alloc(64);
    jpegBuffer[0] = 0xff;
    jpegBuffer[1] = 0xd8;
    jpegBuffer[2] = 0xff;
    jpegBuffer[3] = 0xe0; // APP0 marker
    jpegBuffer.writeUInt16BE(16, 4); // APP0 length 16 bytes

    // SOF0 marker at offset 22
    jpegBuffer[22] = 0xff;
    jpegBuffer[23] = 0xc0; // SOF0
    jpegBuffer.writeUInt16BE(17, 24); // marker length
    jpegBuffer[26] = 8; // precision
    jpegBuffer.writeUInt16BE(600, 27); // height: 600
    jpegBuffer.writeUInt16BE(800, 29); // width: 800

    const result = FileSignatureValidator.inspectBuffer(jpegBuffer, 'image/jpeg');
    expect(result.isValid).toBe(true);
    expect(result.detectedMimeType).toBe('image/jpeg');
    expect(result.mediaType).toBe(MediaType.IMAGE);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('correctly validates WebP magic bytes', () => {
    const webpBuffer = Buffer.alloc(40);
    webpBuffer.write('RIFF', 0, 'ascii');
    webpBuffer.writeUInt32LE(32, 4);
    webpBuffer.write('WEBP', 8, 'ascii');
    webpBuffer.write('VP8 ', 12, 'ascii');

    const result = FileSignatureValidator.inspectBuffer(webpBuffer, 'image/webp');
    expect(result.isValid).toBe(true);
    expect(result.detectedMimeType).toBe('image/webp');
    expect(result.mediaType).toBe(MediaType.IMAGE);
  });

  it('correctly validates MP4 video ftyp container', () => {
    const mp4Buffer = Buffer.alloc(32);
    mp4Buffer.writeUInt32BE(28, 0); // box length
    mp4Buffer.write('ftyp', 4, 'ascii');
    mp4Buffer.write('isom', 8, 'ascii'); // major brand
    mp4Buffer.writeUInt32BE(512, 12); // minor version

    const result = FileSignatureValidator.inspectBuffer(mp4Buffer, 'video/mp4');
    expect(result.isValid).toBe(true);
    expect(result.detectedMimeType).toBe('video/mp4');
    expect(result.mediaType).toBe(MediaType.VIDEO);
  });

  it('correctly validates QuickTime (MOV) video container', () => {
    const movBuffer = Buffer.alloc(32);
    movBuffer.writeUInt32BE(28, 0);
    movBuffer.write('ftyp', 4, 'ascii');
    movBuffer.write('qt  ', 8, 'ascii'); // major brand

    const result = FileSignatureValidator.inspectBuffer(movBuffer, 'video/quicktime');
    expect(result.isValid).toBe(true);
    expect(result.detectedMimeType).toBe('video/quicktime');
    expect(result.mediaType).toBe(MediaType.VIDEO);
  });
});

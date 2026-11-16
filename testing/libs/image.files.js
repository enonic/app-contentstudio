/**
 * Created on 16.11.2026
 *
 * Image files for the upload buttons (a hidden input[type='file'] gets the absolute path).
 *
 * The files are made here rather than committed: a PNG is small enough to be built with node's own zlib,
 * and each test gets a file with a unique name, so the uploaded content can be found by its name.
 *
 * The files land under build/, which git ignores.
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const DIR = path.join(__dirname, '../build/fixtures');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = Array.from({ length: 256 }, (unused, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
});

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([length, typeAndData, crc]);
}

// One-colour RGB image, 8 bits per channel:
function buildPng(width, height, [red, green, blue]) {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8; // bit depth
    header[9] = 2; // colour type: RGB
    // each row starts with the filter byte (0 - none):
    const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, Buffer.from([red, green, blue]))]);
    const pixels = Buffer.concat(Array.from({ length: height }, () => row));
    return Buffer.concat([
        PNG_SIGNATURE,
        chunk('IHDR', header),
        chunk('IDAT', zlib.deflateSync(pixels)),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

module.exports = {
    // Writes '<name>.png' and answers with its absolute path, which is what a file input is given.
    writePng(name, width = 200, height = 120) {
        fs.mkdirSync(DIR, { recursive: true });
        const filePath = path.join(DIR, `${name}.png`);
        fs.writeFileSync(filePath, buildPng(width, height, [0x2f, 0x6f, 0xb7]));
        return filePath;
    },
};

import {adjustCropForOrientation} from './crop';
import {FORWARD_MATRICES, IDENTITY_MATRIX} from './matrices';
import {type Crop, type Dimensions} from './types';

export function getBase64Image(
    imageUrl: string,
    orientation: number,
    crop?: Crop | null
): Promise<{base64Image: string; dimensions: Dimensions}> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas 2d context'));
                return;
            }

            const {a, b, c, d, e, f, canvasW, canvasH} = getCanvasTransform(orientation, img.naturalWidth, img.naturalHeight);
            canvas.width = canvasW;
            canvas.height = canvasH;
            ctx.setTransform(a, b, c, d, e, f);
            ctx.drawImage(img, 0, 0);

            const dimensions: Dimensions = {w: canvasW, h: canvasH};

            if (crop) {
                const oc = adjustCropForOrientation(crop, orientation, dimensions);

                if (oc) {
                    const cx = Math.round(oc.x1);
                    const cy = Math.round(oc.y1);
                    const cw = Math.round(oc.x2 - oc.x1);
                    const ch = Math.round(oc.y2 - oc.y1);

                    if (cw > 0 && ch > 0) {
                        const imageData = ctx.getImageData(cx, cy, cw, ch);
                        canvas.width = cw;
                        canvas.height = ch;
                        ctx.putImageData(imageData, 0, 0);
                    }
                }
            }

            resolve({base64Image: canvas.toDataURL('image/png'), dimensions});
        };

        img.onerror = () => {
            reject(new Error(`Failed to load image: ${imageUrl}`));
        };

        img.src = imageUrl;
    });
}

//
// * Utilities
//

function getCanvasTransform(
    orientation: number,
    w: number,
    h: number
): {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    canvasW: number;
    canvasH: number;
} {
    const matrices = FORWARD_MATRICES[orientation];

    const composed = matrices
        ? matrices.reduce<number[][]>(
              (acc, m) => [
                  [acc[0][0] * m[0][0] + acc[0][1] * m[1][0], acc[0][0] * m[0][1] + acc[0][1] * m[1][1]],
                  [acc[1][0] * m[0][0] + acc[1][1] * m[1][0], acc[1][0] * m[0][1] + acc[1][1] * m[1][1]],
              ],
              IDENTITY_MATRIX
          )
        : IDENTITY_MATRIX;

    const corners = [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
    ].map(([cx, cy]) => [composed[0][0] * cx + composed[0][1] * cy, composed[1][0] * cx + composed[1][1] * cy]);

    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    return {
        a: composed[0][0],
        b: composed[1][0],
        c: composed[0][1],
        d: composed[1][1],
        e: -minX,
        f: -minY,
        canvasW: Math.max(...xs) - minX,
        canvasH: Math.max(...ys) - minY,
    };
}

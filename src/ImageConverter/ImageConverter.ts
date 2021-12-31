import GIF from "gif.js";

import { Image } from "../types";

export function grayscaleImageDataTo2DArray(
    imageData: ImageData,
    targetWidth: number,
    targetHeight: number
): Image {
    // Validation
    if (targetWidth > imageData.width)
        throw new Error("`targetWidth` must be less than or equal to `imageData.width`");
    if (targetHeight > imageData.height)
        throw new Error("`targetHeight` must be less than or equal to `imageData.height`");
    if (imageData.width % targetWidth)
        throw new Error("`targetWidth` must be a divisor of `imageData.width`");
    if (imageData.height % targetHeight)
        throw new Error("`targetHeight` must be a divisor of `imageData.height`");

    const returnArray: Image = [...Array(targetHeight)].map(() => [...Array(targetWidth)].fill(0));

    const [stepX, stepY] = [imageData.width / targetWidth, imageData.height / targetHeight];

    for (let i = 0; i < imageData.data.length; i += 4) {
        const [origX, origY] = [
            Math.floor(i / 4) % imageData.width,
            Math.floor(Math.floor(i / 4) / imageData.width)
        ];
        const [resultX, resultY] = [
            Math.floor(origX / stepX),
            Math.floor(origY / stepY)
        ];

        // Use RED pixel value to convert.
        const p = imageData.data[i];
        returnArray[resultY][resultX] += p;
    }

    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            returnArray[y][x] /= stepX * stepY;
            returnArray[y][x] = Math.floor(returnArray[y][x]);
            returnArray[y][x] = Math.max(returnArray[y][x], 0);
            returnArray[y][x] = Math.min(returnArray[y][x], 255);
        }
    }

    return returnArray;
}

export function normalize2DArrayImage(image: Image) {
    return image.map(row => row.map(pixel => pixel / 255.0));
}

export function amplify2DArrayImage(image: Image) {
    return image.map(row => row.map(pixel => pixel * 255));
}

export function array2DToGrayscaleImageData(
    image: Image,
    targetWidth: number,
    targetHeight: number
): ImageData {
    // Check if the array is empty
    if (image.length === 0 || image[0].length === 0)
        throw new Error("Empty array is not supported");

    const [imageWidth, imageHeight] = [image[0].length, image.length];
    // Validation
    if (targetWidth < imageWidth)
        throw new Error("`targetWidth` must be greater than or equal to image width");
    if (targetHeight < imageHeight)
        throw new Error("`targetHeight` must be greater than or equal to image height");
    if (targetWidth % imageWidth)
        throw new Error("`targetWidth` must be a multiple of `imageData.width`");
    if (targetHeight % imageWidth)
        throw new Error("`targetHeight` must be a multiple of `imageData.height`");

    const dataArray = [];

    const [repeatX, repeatY] = [Math.floor(targetWidth / imageWidth), Math.floor(targetHeight / imageHeight)];

    for (let y = 0; y < imageHeight; y++) {
        for (let ry = 0; ry < repeatY; ry++) {
            for (let x = 0; x < imageWidth; x++) {
                for (let rx = 0; rx < repeatX; rx++) {
                    dataArray.push(image[y][x]); // R
                    dataArray.push(image[y][x]); // G
                    dataArray.push(image[y][x]); // B
                    dataArray.push(255);         // A
                }
            }
        }
    }

    return new ImageData(
        Uint8ClampedArray.from(dataArray), targetWidth, targetHeight
    );
}

export function imageDataToDataUrl(imageData: ImageData): string {
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = imageData.width;
    tmpCanvas.height = imageData.height;
    const tmpCanvasContext = tmpCanvas.getContext("2d")!!;
    tmpCanvasContext.putImageData(imageData, 0, 0);
    return tmpCanvas.toDataURL("image/png", 1);
}

export function createGifFromDataUrlList(images: ImageData[]): Promise<string> {
    return new Promise<string>((resolve) => {
        const gif = new GIF({
            workerScript: `${process.env.PUBLIC_URL}/gif.worker.js`
        });

        images.forEach((img) => {
            gif.addFrame(img);
        });

        gif.on("finished", (blob: Blob, _data: Uint8Array) => {
            resolve(URL.createObjectURL(blob));
        });

        gif.render();
    });
}

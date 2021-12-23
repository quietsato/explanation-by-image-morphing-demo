import { array2DToGrayscaleImageData, grayscaleImageDataTo2DArray } from "./ImageConverter";

test("image converter can convert an `ImageData` instance to a shrinked array", () => {
    const dummyImageDataArray =
        Uint8ClampedArray.from(
            [...Array(4 * 280 * 280)].map((_, i) =>
                Math.floor(i / 4) % 10
            ));

    const imageData = new ImageData(dummyImageDataArray, 280, 280)

    const shrinkedArray = grayscaleImageDataTo2DArray(imageData, 28, 28);

    expect(shrinkedArray.length).toEqual(28);
    expect(shrinkedArray[0].length).toEqual(28);
    for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
            expect(shrinkedArray[y][x]).toEqual(4); // 4 = (0..9).sum() / 10;
        }
    }
})

test("image converter can convert an array to an expanded `ImageData` instance", () => {
    const dummyImage = [...Array(28)].map((_, i) =>
        [...Array(28)].map((_, j) => 28 * i + j)
    );

    const imageData = array2DToGrayscaleImageData(dummyImage, 56, 56);

    expect(imageData.width).toEqual(56);
    expect(imageData.height).toEqual(56);

    // First Pixel
    expect(imageData.data[0 * 4]).toEqual(0);
    expect(imageData.data[0 * 4 + 1]).toEqual(0);
    expect(imageData.data[0 * 4 + 2]).toEqual(0);
    expect(imageData.data[0 * 4 + 3]).toEqual(255);

    // First Row
    expect(imageData.data[1 * 4]).toEqual(0);
    expect(imageData.data[2 * 4]).toEqual(1);
    expect(imageData.data[3 * 4]).toEqual(1);

    // Next Row
    expect(imageData.data[56 * 4]).toEqual(0);
    expect(imageData.data[57 * 4]).toEqual(0);
    expect(imageData.data[58 * 4]).toEqual(1);
    expect(imageData.data[59 * 4]).toEqual(1);
});

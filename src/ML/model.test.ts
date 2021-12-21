import { Feature, Image, Label } from "../types";
import IDCVAE from "./model";

//
// Setup Models and Dummy Data
//
function createDummyData(): [Image[], Label[], Feature[]] {
    const imgs: Image[] = [];
    const labels: Label[] = [];
    const features: Feature[] = [];

    for (let i = 0; i < 20; i++) {
        const img = [];
        const label = i % 10;
        const feature = [];

        for (let j = 0; j < 28; j++) {
            const arr = [];
            for (let k = 0; k < 28; k++) {
                arr.push(k / 28);
            }
            img.push(arr);
        }
        imgs.push(img);

        labels.push(label);

        for (let j = 0; j < 16; j++) {
            feature.push(j / 16);
        }
        features.push(feature);
    }
    return [imgs, labels, features];
}

const [imgs, labels, features] = createDummyData();

//
// Tests
//
test("model can encode images to features", async () => {
    const model = new IDCVAE();
    model.buildDefaultModel();

    const [z, z_mean, z_log_var] = await model.encode(imgs);

    expect(z.length).toEqual(imgs.length);
    expect(z[0].length).toEqual(16);

    expect(z_mean.length).toEqual(imgs.length);
    expect(z_mean[0].length).toEqual(16);

    expect(z_log_var.length).toEqual(imgs.length);
    expect(z_log_var[0].length).toEqual(16);
});

test("model can decode pairs of features and labels to images", async () => {
    const model = new IDCVAE();
    model.buildDefaultModel();

    const x = await model.decode(features, labels);

    expect(x.length).toEqual(features.length);
    expect(x[0].length).toEqual(28)
    expect(x[0][0].length).toEqual(28)
});

test("model can update representative features using pairs of images and labels", async () => {
    const model = new IDCVAE();
    model.buildDefaultModel();

    expect(model.getRepresentative()).toBeNull();

    await model.updateRepresentative(imgs, labels);

    const r = model.getRepresentative();
    expect(r).not.toBeNull();
    expect(r!!.length).toEqual(10);
    expect(r!![0].length).toEqual(features[0].length);
});

test("model can generate mophing images", async () => {
    const model = new IDCVAE();
    model.buildDefaultModel();
    await model.updateRepresentative(imgs, labels);

    const n = 3;

    const morphingImages = await model.generateMorphingImages(imgs, labels, n);

    expect(morphingImages.length).toEqual(imgs.length);
    expect(morphingImages[0].length).toEqual(n + 1);
    expect(morphingImages[0][0].length).toEqual(imgs[0].length);
    expect(morphingImages[0][0][0].length).toEqual(imgs[0][0].length);
});

test("model can classify images with explanation by image morphing", async () => {
    const model = new IDCVAE();
    model.buildDefaultModel();
    await model.updateRepresentative(imgs, labels);

    const n = 3;

    const [predictedLabels, explanation] = await model.classifyWithExplanation(imgs, n);

    expect(predictedLabels.length).toEqual(imgs.length);

    expect(explanation.length).toEqual(imgs.length);
    expect(explanation[0].length).toEqual(n + 1);
    expect(explanation[0][0].length).toEqual(imgs[0].length)
    expect(explanation[0][0][0].length).toEqual(imgs[0][0].length)
});

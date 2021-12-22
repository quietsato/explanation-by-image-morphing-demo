import * as tf from "@tensorflow/tfjs";

import { Feature, Image, Label } from "../types";

export default class IDCVAE {
    private encoder: tf.LayersModel | null = null;
    private decoder: tf.LayersModel | null = null;

    public random: boolean = false;
    private representative: tf.Tensor2D | null = null;

    async encode(images: Image[]): Promise<[Feature[], Feature[], Feature[]]> {
        let xs = tf.tensor(images).reshape([-1, 28, 28, 1]) as tf.Tensor4D;
        const [z, z_mean, z_log_var] = this.encodeWithTensor(xs);
        return Promise.all([z.array(), z_mean.array(), z_log_var.array()]);
    }

    async decode(features: Feature[], label: Label[]): Promise<Image[]> {
        const zs = tf.tensor2d(features);
        const ys = tf.tensor1d(label, "int32");

        const xs = this.decodeWithTensor(zs, ys);

        return (xs.reshape([-1, 28, 28]) as tf.Tensor3D).array();
    }

    private encodeWithTensor(xs: tf.Tensor4D): [tf.Tensor2D, tf.Tensor2D, tf.Tensor2D] {
        if (!this.encoder) {
            throw new Error("Encoder is not initialized.");
        }

        const [z, z_mean, z_log_var] = this.encoder.call(xs, {}) as tf.Tensor2D[];
        return [z, z_mean, z_log_var];
    }

    private decodeWithTensor(zs: tf.Tensor2D, ys: tf.Tensor1D): tf.Tensor4D {
        if (!this.decoder) {
            throw new Error("Decoder is not initialized.");
        }

        const l = tf.oneHot(ys, 10);
        const d_in = tf.concat([zs, l], 1);

        const [xs] = this.decoder.call([d_in], {}) as tf.Tensor4D[];
        return xs;
    }

    async classify(images: Image[]): Promise<Label[]> {
        const xs = tf.tensor(images).reshape([-1, 28, 28, 1]) as tf.Tensor4D;

        let zs = this.encodeWithTensor(xs)[(this.random ? 0 : 1)] as tf.Tensor2D;

        const promises = [...Array(10)].map((_, l) =>
            new Promise<tf.Tensor1D>((resolve, _) => {
                const ys = tf.tensor1d([l], "int32").tile([xs.shape[0]]) as tf.Tensor1D;
                const xs_rec = this.decodeWithTensor(zs, ys);
                const loss = reconstructionLoss(xs, xs_rec);
                resolve(loss);
            })
        );
        const loss_each_label = await Promise.all(promises);

        const ys = tf.stack(loss_each_label).argMin(0) as tf.Tensor1D;
        return ys.array();
    }

    async classifyWithExplanation(images: Image[], n: number): Promise<[Label[], Image[][]]> {
        const ys = await this.classify(images);
        const expl = await this.generateMorphingImages(images, ys, n);
        return [ys, expl];
    }

    async generateMorphingImages(images: Image[], labels: Label[], n: number): Promise<Image[][]> {
        if (!this.representative) {
            throw new Error("Representative points is not supplied.");
        }

        const xs = tf.tensor(images).reshape([-1, 28, 28, 1]) as tf.Tensor4D;
        const ys = tf.tensor1d(labels, "int32");

        const encoded = this.encodeWithTensor(xs);
        const zs = this.random ? encoded[0] : encoded[1];

        let zs_l = tf.gather(zs, ys);
        const repr_l = tf.gather(this.representative, ys);
        const diff = repr_l.sub(zs_l).div(n);

        let morphing_images: tf.Tensor4D[] = [];
        for (let i = 0; i <= n; i++) {
            zs_l = zs_l.add(diff);
            const decoded = this.decodeWithTensor(zs_l, ys);
            morphing_images.push(decoded);
        }

        return tf.concat4d(morphing_images, 0)
            .reshape([-1, n + 1, 28, 28]).array() as Promise<Image[][]>;
    }

    getRepresentative(): Feature[] | null {
        return this.representative?.arraySync() || null;
    }

    setRepresentative(value: Feature[]) {
        this.representative = tf.tensor2d(value);
    }

    async updateRepresentative(imgs: Image[], labels: Label[]) {
        const xs = tf.tensor(imgs).reshape([-1, 28, 28, 1]) as tf.Tensor4D;
        const ys = tf.tensor1d(labels);
        const [zs, zs_mean, _zs_log_var] = this.encodeWithTensor(xs);

        this.representative = this.random ?
            await this.calculateRepresentative(zs, ys) :
            await this.calculateRepresentative(zs_mean, ys);
    }

    private async calculateRepresentative(zs: tf.Tensor2D, ys: tf.Tensor1D): Promise<tf.Tensor2D> {
        let promises = [...Array(10)].map((_, l) =>
            new Promise<tf.Tensor2D>(async (resolve, _) => {
                const mask = tf.equal(ys, l);
                const zs_l = await tf.booleanMaskAsync(zs, mask);
                const repr_l = tf.mean(zs_l, 0, true);
                resolve(repr_l as tf.Tensor2D);
            })
        );

        const representative: tf.Tensor2D[] = await Promise.all(promises);
        return tf.concat2d(representative, 0);
    }

    async load(): Promise<any> {
        const modelBasePath = process.env.MODEL_URL_PATH || process.env.PUBLIC_URL;
        this.encoder = await tf.loadLayersModel(
            `${modelBasePath}/assets/model_encoder/model.json`
        );
        this.decoder = await tf.loadLayersModel(
            `${modelBasePath}/assets/model_decoder/model.json`
        );
    }

    buildDefaultModel() {
        this.encoder = buildEncoder();
        this.decoder = buildDecoder();
    }
}

class Sampling extends tf.layers.Layer {
    computeOutputShape(inputShape: tf.Shape[]): tf.Shape {
        return inputShape[0];
    }

    call(inputs: [tf.Tensor, tf.Tensor], _kwargs: any): tf.Tensor {
        const [z_mean, z_log_var] = inputs;
        const z = z_mean.add(tf.randomNormal(z_mean.shape).mul(z_log_var));
        return z;
    }

    static get className() { return "Sampling"; }
}
tf.serialization.registerClass(Sampling);

function buildEncoder(): tf.LayersModel {
    let input = tf.layers.input({ shape: [28, 28, 1] });

    let x = input;
    x = tf.layers.conv2d({ filters: 32, kernelSize: 4, strides: 2, padding: "same" }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.leakyReLU({ alpha: 0.01 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.conv2d({ filters: 64, kernelSize: 4, strides: 2, padding: "same" }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.leakyReLU({ alpha: 0.01 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.flatten().apply(x) as tf.SymbolicTensor;
    x = tf.layers.dense({ units: 64, activation: "relu" }).apply(x) as tf.SymbolicTensor;

    const z_mean = tf.layers.dense({ units: 16, name: "z_mean" }).apply(x) as tf.SymbolicTensor;
    const z_log_var = tf.layers.dense({ units: 16, name: "z_log_var" }).apply(x) as tf.SymbolicTensor;

    const z = (new Sampling()).apply([z_mean, z_log_var]) as tf.SymbolicTensor;

    const encoder = tf.model({ inputs: input, outputs: [z, z_mean, z_log_var] });
    return encoder;
}

function buildDecoder(): tf.LayersModel {
    const decoder = tf.sequential();

    decoder.add(tf.layers.inputLayer({ inputShape: [16 + 10] }));
    decoder.add(tf.layers.dense({ units: 7 * 7 * 64 }));
    decoder.add(tf.layers.reshape({ targetShape: [7, 7, 64] }));
    decoder.add(tf.layers.conv2dTranspose({ filters: 64, kernelSize: 4, strides: 2, padding: "same" }));
    decoder.add(tf.layers.leakyReLU({ alpha: 0.01 }));
    decoder.add(tf.layers.conv2dTranspose({ filters: 32, kernelSize: 4, strides: 2, padding: "same" }));
    decoder.add(tf.layers.leakyReLU({ alpha: 0.01 }));
    decoder.add(tf.layers.conv2dTranspose({ filters: 1, kernelSize: 4, strides: 1, padding: "same", activation: "sigmoid" }));

    return decoder;
}

function reconstructionLoss(xs: tf.Tensor4D, xs_rec: tf.Tensor4D): tf.Tensor1D {
    return tf.losses.sigmoidCrossEntropy(
        xs,
        xs_rec,
        undefined,
        undefined,
        tf.Reduction.NONE
    ).mean([1, 2, 3]) as tf.Tensor1D;
}

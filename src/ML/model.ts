import * as tf from "@tensorflow/tfjs";

import { Feature, Image, Label } from "../types";

export default class IDCVAE {
    private encoder: tf.LayersModel | null = null;
    private decoder: tf.LayersModel | null = null;

    public random: boolean = false;

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

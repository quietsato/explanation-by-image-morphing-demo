import React from "react";
import "./App.css";

import {
  amplify2DArrayImage,
  array2DToGrayscaleImageData,
  grayscaleImageDataTo2DArray,
  normalize2DArrayImage,
} from "./ImageConverter/ImageConverter";
import IDCVAE from "./ML/model";

import HandwriteCanvas from './HandwriteCanvas/HandwriteCanvas';
import ControllerButtons from './ControllerButtons/ControllerButtons';
import PredictionView from './Result/PredictionView';
import GifView from './Result/GifView';
import MorphingView from './Result/MorphingView';

import { setBackend } from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';

function App() {
  const [images, setImages] = React.useState<ImageData[] | null>(null);
  const [label, setLabel] = React.useState<number | null>(null);
  const [model, setModel] = React.useState<IDCVAE | null>(null);

  React.useEffect(() => {
    setBackend('wasm').then(() => {
    const model = new IDCVAE();
      model.load().then(() => {
        setModel(model);
      });
    });
  }, []);

  async function onImageDataProvided(imageData: ImageData) {
    let canvasImage = grayscaleImageDataTo2DArray(imageData, 28, 28);
    canvasImage = normalize2DArrayImage(canvasImage);

    if (model == null) return;

    model
      .classifyWithExplanation([canvasImage], 10)
      .then(([label, morphingImages]) => {
        setLabel(label[0]);
        setImages(
          [canvasImage, ...morphingImages[0]].map((image) => {
            const ampImage = amplify2DArrayImage(image);
            return array2DToGrayscaleImageData(ampImage, 28 * 4, 28 * 4);
          })
        );
      });
  }

  return (
    <div className="App">
      <main className="App__Container">
        <h1>
          Draw a digit on the following box
        </h1>
        <HandwriteCanvas className="App__Canvas" onImageDataRequested={onImageDataProvided}>
          <ControllerButtons className='App__Button' />
        </HandwriteCanvas>
        <PredictionView predictedLabel={label} />
        <GifView morphingImages={images} />
        <MorphingView morphingImages={images} />
      </main>
    </div>
  );
}

export default App;

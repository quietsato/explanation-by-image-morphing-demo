import React from 'react';
import './App.css';

import HandwriteCanvas from './HandwriteCanvas/HandwriteCanvas';
import ControllerButtons from './ControllerButtons/ControllerButtons';
import PredictionView from './Result/PredictionView';
import GifView from './Result/GifView';
import MorphingView from './Result/MorphingView';

function App() {
  const [images, setImages] = React.useState<ImageData[] | null>(null);
  const [label, setLabel] = React.useState<number | null>(null);

  return (
    <div className="App">
      <main className="App__Container">
        <h1>
          Draw a digit on the following box
        </h1>
        <HandwriteCanvas className="App__Canvas">
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

import React from 'react';
import logo from './logo.svg';
import './App.css';

import HandwriteCanvas from './HandwriteCanvas/HandwriteCanvas';
import ControllerButtons from './ControllerButtons/ControllerButtons';

function App() {
  return (
    <div className="App">
      <main className="App__Container">
        <h1>
          Draw a digit on the following box
        </h1>
        <HandwriteCanvas className="App__Canvas">
          <ControllerButtons className='App__Button' />
        </HandwriteCanvas>
      </main>
    </div>
  );
}

export default App;

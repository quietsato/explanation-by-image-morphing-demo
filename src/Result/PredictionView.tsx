
import React from "react";

import { Label } from "../types";

import "./PredictionView.css";

type Props = {
  inputImage: ImageData | null,
  predictedLabel: Label | null
};

const PredictionView: React.FC<Props> = (props) => {
  if (props.inputImage === null || props.predictedLabel === null) {
    return (<></>);
  }

  return (
    <span className="PredictionView__Text">
      Looks like {props.predictedLabel}
    </span>
  );
}

export default PredictionView;


import React from "react";
import { imageDataToDataUrl } from "../ImageConverter/ImageConverter";

import "./MorphingView.css";

type Props = {
  morphingImages: ImageData[] | null
};

const MorphingView: React.FC<Props> = (props) => {
  if (!props.morphingImages) {
    return <></>
  }
  return (
    <div className="MorphingView">
      {props.morphingImages.map((image, i) => (
        <div key={i} className="MorphingView__Item">
          <img
            className="MorphingView__Item__Image"
            src={imageDataToDataUrl(image)}
            alt=""
          />
        </div>
      ))}
    </div>
  );
}

export default MorphingView;

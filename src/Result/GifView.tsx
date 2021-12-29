
import React from "react";
import { createGifFromDataUrlList } from "../ImageConverter/ImageConverter";

import "./GifView.css";

type Props = {
  morphingImages: ImageData[] | null
}

const GifView: React.FC<Props> = (props) => {
  const [images, setImages] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (props.morphingImages == null) return;
    createGifFromDataUrlList(props.morphingImages).then(gif => {
      setImages(gif);
    })
  }, [props.morphingImages])

  if (props.morphingImages == null || !images) {
    return (<></>);
  }

  return (
    <img
      className="GifView__Image"
      src={images}
      alt="Morphing GIF" />
  );
}

export default GifView;

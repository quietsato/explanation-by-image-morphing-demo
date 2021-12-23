import React from "react";
import { ControllerProps as CanvasControllerProps } from "../HandwriteCanvas/HandwriteCanvas";

import "./ControllerButtons.css"

export type Props = CanvasControllerProps & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const ControllerButtons: React.FC<Props> = (props) => {
    const {
        onImageDataRequested,
        onClearCanvas,
        ...rootProps
    } = props;
    return (
        <div {...rootProps}>
            <button
                className={[
                    "ControllerButtons__Button",
                    "ControllerButtons__PredictButton"
                ].join(" ")}
                onClick={onImageDataRequested}
            >
                Predict
            </button>
            <button
                className={[
                    "ControllerButtons__Button",
                    "ControllerButtons__ClearButton"
                ].join(" ")}
                onClick={onClearCanvas}
            >
                Clear Canvas
            </button>
        </div>
    )
};

export default ControllerButtons;

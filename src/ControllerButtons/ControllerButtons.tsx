import React from "react";
import { ControllerProps as CanvasControllerProps } from "../HandwriteCanvas/HandwriteCanvas";

export type Props = CanvasControllerProps & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

const ControllerButtons: React.FC<Props> = (props) => {
    const {
        onImageDataRequested,
        onClearCanvas,
        ...rootProps
    } = props;
    return (
        <div {...rootProps}>
            <button onClick={onImageDataRequested}>Predict</button>
            <button onClick={onClearCanvas}>Clear Canvas</button>
        </div>
    )
};

export default ControllerButtons;

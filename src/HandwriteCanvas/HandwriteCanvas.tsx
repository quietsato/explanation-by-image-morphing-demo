import React from "react";


export type Props = {
    onImageDataRequested?: (data: ImageData) => any,
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export type ControllerProps = {
    onImageDataRequested?: () => any,
    onClearCanvas?: () => any
}

const HandwriteCanvas: React.FC<Props> = (props) => {
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [canvasContext, setCanvasContext] = React.useState(null as CanvasRenderingContext2D | null | undefined);
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    //
    // Canvas Functions
    //
    function initCanvasContext(): CanvasRenderingContext2D {
        let localCanvasContext = canvasContext;
        if (!localCanvasContext) {
            localCanvasContext = canvasRef.current?.getContext("2d");
            if (!localCanvasContext) {
                throw new Error("Failed to initialize `canvasContext`");
            }
            setCanvasContext(localCanvasContext);
        }
        return localCanvasContext!!;
    }

    function initCanvasRef(): HTMLCanvasElement {
        const currentCanvasRef = canvasRef.current;
        if (!currentCanvasRef) {
            throw new Error("Canvas is not initialized");
        }
        return currentCanvasRef;
    }

    function startDrawing(x: number, y: number) {
        setIsDrawing(true)
        const canvasContext = initCanvasContext();
        canvasContext.beginPath();
        canvasContext.moveTo(x, y);
    }

    function stopDrawing(x: number, y: number) {
        if (!isDrawing) return;
        setIsDrawing(false)
        draw(x, y);
    }

    function clearCanvas() {
        const ref = initCanvasRef();
        initCanvasContext().clearRect(0, 0, ref.width, ref.height);
    }

    function draw(x: number, y: number) {
        const canvasContext = initCanvasContext();
        canvasContext.lineTo(x, y);
        canvasContext.lineWidth = 10;
        canvasContext.lineCap = "round";
        canvasContext.lineJoin = "round";
        canvasContext.strokeStyle = "#ff0000";
        canvasContext.stroke();
    }

    function getImageData(): ImageData {
        const canvasContext = initCanvasContext();
        const ref = initCanvasRef();
        const imageData = canvasContext.getImageData(0, 0, ref.width, ref.height);
        return imageData;
    }

    //
    // Event Handlers
    //
    function onMouseDown(e: React.MouseEvent) {
        e.preventDefault();
        const [x, y] = getCurrentPointerPosition(e);
        startDrawing(x, y);
    }

    function onMouseUp(e: React.MouseEvent) {
        e.preventDefault()
        const [x, y] = getCurrentPointerPosition(e);
        stopDrawing(x, y);
    }

    function onMouseMove(e: React.MouseEvent) {
        e.preventDefault()
        if (!isDrawing) {
            return;
        }
        const [x, y] = getCurrentPointerPosition(e);
        draw(x, y);
    }

    function onTouchStart(e: React.TouchEvent) {
        e.preventDefault();
        const [x, y] = getCurrentTouchPosition(e, canvasRef.current!!);
        startDrawing(x, y);
    }
    function onTouchEnd(e: React.TouchEvent) {
        e.preventDefault();
        const [x, y] = getCurrentTouchPosition(e, canvasRef.current!!);
        stopDrawing(x, y);
    }
    function onTouchMove(e: React.TouchEvent) {
        e.preventDefault();
        if (!isDrawing) {
            return;
        }
        const [x, y] = getCurrentTouchPosition(e, canvasRef.current!!);
        draw(x, y);
    }

    //
    // Canvas Controller
    //
    const controllerProps: ControllerProps = {
        onClearCanvas: clearCanvas,
        onImageDataRequested: () => {
            props.onImageDataRequested &&
                props.onImageDataRequested(getImageData())
        }
    };
    const controllerChildren = React.Children.map(props.children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { ...controllerProps });
        } else {
            return child;
        }
    });

    //
    // DOM
    //
    const { onImageDataRequested, ...rootProps } = props;
    return (
        <>
            <div {...rootProps}>
                <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
                    onMouseDown={(e) => onMouseDown(e)}
                    onMouseUp={(e) => onMouseUp(e)}
                    onMouseOut={(e) => onMouseUp(e)}
                    onMouseMove={(e) => onMouseMove(e)}
                    onTouchStart={(e) => onTouchStart(e)}
                    onTouchEnd={(e) => onTouchEnd(e)}
                    onTouchCancel={(e) => onTouchEnd(e)}
                    onTouchMove={(e) => onTouchMove(e)}
                    onScroll={(e) => e.preventDefault()}
                />
            </div>
            {controllerChildren}
        </>
    );
}

function getCurrentPointerPosition(e: React.MouseEvent): [number, number] {
    return [e.nativeEvent.offsetX, e.nativeEvent.offsetY];
}

function getCurrentTouchPosition(e: React.TouchEvent, canvasRef: HTMLCanvasElement): [number, number] {
    const x = e.targetTouches[0].clientX - canvasRef.getBoundingClientRect().left;
    const y = e.targetTouches[0].clientY - canvasRef.getBoundingClientRect().top;
    return [x, y];
}


export default HandwriteCanvas;

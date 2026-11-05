import { type ReactElement, useLayoutEffect, useRef, useState } from 'react';
import { type TargetedKeyboardEvent } from 'preact';
import { LoaderCircle } from 'lucide-react';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { type Dimensions } from '../lib/types';
import { useImageUploaderApply, useImageUploaderCancel, useImageUploaderReset } from '../useImageUploaderActions';
import { IMAGE_KEYBOARD_STEP } from '../useImageArrowKeys';
import { ImageUploaderInputCropSvg } from './ImageUploaderInputCropSvg';
import { ImageUploaderInputFocusSvg } from './ImageUploaderInputFocusSvg';

// Reserve the 3px ring and its 3px offset without changing the image size on focus.
const FRAME_PADDING = 6;

export const ImageUploaderInputImage = (): ReactElement | null => {
    const { base64Image, mode, focus, dimensions, crop, enabled } = useImageUploaderContext();
    const { resetImage } = useImageUploaderReset();
    const { apply } = useImageUploaderApply();
    const { cancel } = useImageUploaderCancel();
    const viewportRef = useRef<HTMLDivElement>(null);
    const [viewportSize, setViewportSize] = useState<Dimensions>();
    const hasImage = !!base64Image && !!dimensions;

    const handleKeyDown = (event: TargetedKeyboardEvent<HTMLDivElement>): void => {
        if (
            !enabled ||
            (mode !== 'crop' && mode !== 'focus') ||
            event.defaultPrevented ||
            event.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            !event.currentTarget.contains(document.activeElement)
        ) {
            return;
        }

        const key = event.key.toLowerCase();
        const action = key === 'r' ? resetImage : key === 'enter' ? apply : key === 'escape' ? cancel : null;
        if (!action) {
            return;
        }
        if (!event.repeat && !action()) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
    };

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }

        const updateSize = (): void => {
            const { width: w, height: h } = viewport.getBoundingClientRect();
            setViewportSize((previous) => (previous?.w === w && previous.h === h ? previous : { w, h }));
        };
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [hasImage]);

    if (!hasImage) {
        return null;
    }

    const isCropping = mode === 'crop';
    const isFocusing = mode === 'focus';
    const isLoading = mode === 'loading';

    const showImage = !isCropping && !isFocusing && !focus;
    const showFocus = isFocusing || (!isCropping && focus);
    const imageWidth = !isCropping && crop ? crop.x2 - crop.x1 : dimensions.w;
    const imageHeight = !isCropping && crop ? crop.y2 - crop.y1 : dimensions.h;
    const maxScale = Math.min(dimensions.w / imageWidth, dimensions.h / imageHeight);
    const scale = viewportSize
        ? Math.min(
              maxScale,
              Math.max(0, viewportSize.w - FRAME_PADDING * 2) / imageWidth,
              Math.max(0, viewportSize.h - FRAME_PADDING * 2) / imageHeight,
          )
        : maxScale;
    // Convert the CSS-pixel step to the SVG's image coordinates.
    const keyboardStep = scale > 0 ? IMAGE_KEYBOARD_STEP / scale : IMAGE_KEYBOARD_STEP;
    const pixelRatio = scale > 0 ? 1 / scale : 1;

    return (
        <div
            ref={viewportRef}
            data-component="ImageUploaderInputImage"
            className="mt-5 flex flex-1 items-center justify-center min-h-0 min-w-0"
            style={{ padding: FRAME_PADDING }}
        >
            <div
                data-component="ImageUploaderInputImageFrame"
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                className="relative rounded-sm shrink-0 focus-within:ring-ring focus-within:ring-offset-ring-offset focus-within:ring-3 focus-within:ring-offset-3"
                style={{ width: imageWidth * scale, height: imageHeight * scale }}
            >
                {showImage && <img src={base64Image} className="block w-full h-full object-contain" />}
                {showImage && isLoading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <LoaderCircle className="animate-spin" />
                    </div>
                )}
                {isCropping && <ImageUploaderInputCropSvg keyboardStep={keyboardStep} pixelRatio={pixelRatio} />}
                {showFocus && <ImageUploaderInputFocusSvg keyboardStep={keyboardStep} pixelRatio={pixelRatio} />}
            </div>
        </div>
    );
};

ImageUploaderInputImage.displayName = 'ImageUploaderInputImage';

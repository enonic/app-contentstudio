import {type ReactElement} from 'react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {ImageUploaderInputCropSvg} from './ImageUploaderInputCropSvg';
import {ImageUploaderInputFocusSvg} from './ImageUploaderInputFocusSvg';
import {LoaderCircle} from 'lucide-react';

export const ImageUploaderInputImage = (): ReactElement | null => {
    const {base64Image, mode, focus, dimensions} = useImageUploaderContext();

    if (!base64Image) return null;

    const isCropping = mode === 'crop';
    const isFocusing = mode === 'focus';
    const isLoading = mode === 'loading';

    const showImage = !isCropping && !isFocusing && !focus;
    const showFocus = isFocusing || (!isCropping && focus);

    return (
        <div data-component="ImageUploaderInputImage" className="mt-5 flex flex-1 items-center justify-center min-h-0">
            {showImage && (
                <div className="relative w-full h-full">
                    {base64Image && (
                        <img
                            src={base64Image}
                            className="w-full h-full object-contain"
                            style={{maxWidth: dimensions?.w, maxHeight: dimensions?.h}}
                        />
                    )}
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <LoaderCircle />
                        </div>
                    )}
                </div>
            )}
            {isCropping && <ImageUploaderInputCropSvg />}
            {showFocus && <ImageUploaderInputFocusSvg />}
        </div>
    );
};

ImageUploaderInputImage.displayName = 'ImageUploaderInputImage';

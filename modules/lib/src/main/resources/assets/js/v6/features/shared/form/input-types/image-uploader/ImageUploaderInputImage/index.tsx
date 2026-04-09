import {type ReactElement} from 'react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {ImageUploaderInputCropSvg} from './ImageUploaderInputCropSvg';
import {ImageUploaderInputFocusSvg} from './ImageUploaderInputFocusSvg';
import {LoaderCircle} from 'lucide-react';

export const ImageUploaderInputImage = (): ReactElement | null => {
    const {base64Image, mode, focus} = useImageUploaderContext();

    if (!base64Image) return null;

    const isCropping = mode === 'crop';
    const isFocusing = mode === 'focus';
    const isLoading = mode === 'loading';

    const showImage = !isCropping && !isFocusing && !focus;
    const showFocus = isFocusing || (!isCropping && focus);

    return (
        <div className="@container mt-5 overflow-hidden">
            {showImage && (
                <div className="relative min-w-32 min-h-32">
                    {base64Image && <img src={base64Image} />}
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

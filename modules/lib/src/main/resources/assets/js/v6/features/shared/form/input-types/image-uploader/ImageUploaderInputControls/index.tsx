import {type ReactElement} from 'react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {ImageUploaderInputApplyButton} from './ImageUploaderInputApplyButton';
import {ImageUploaderInputCancelButton} from './ImageUploaderInputCancelButton';
import {ImageUploaderInputCropButton} from './ImageUploaderInputCropButton';
import {ImageUploaderInputFlipButton} from './ImageUploaderInputFlipButton';
import {ImageUploaderInputFocusButton} from './ImageUploaderInputFocusButton';
import {ImageUploaderInputResetButton} from './ImageUploaderInputResetButton';
import {ImageUploaderInputRotateButton} from './ImageUploaderInputRotateButton';
import {ImageUploaderInputUploadButton} from './ImageUploaderInputUploadButton';

export const ImageUploaderInputControls = (): ReactElement => {
    const {mode} = useImageUploaderContext();

    return (
        <div className="flex gap-2.5 items-center justify-between">
            <div className="flex items-center gap-2.5">
                <ImageUploaderInputCropButton />
                <ImageUploaderInputFocusButton />
                <ImageUploaderInputRotateButton />
                <ImageUploaderInputFlipButton />
            </div>
            <div className="flex items-center gap-2.5">
                {mode === 'focus' || mode === 'crop' ? (
                    <>
                        <ImageUploaderInputResetButton />
                        <ImageUploaderInputApplyButton />
                        <ImageUploaderInputCancelButton />
                    </>
                ) : (
                    <>
                        <ImageUploaderInputResetButton />
                        <ImageUploaderInputUploadButton />
                    </>
                )}
            </div>
        </div>
    );
};

ImageUploaderInputControls.displayName = 'ImageUploaderInputControls';

import { type KeyboardEvent, type ReactElement } from 'react';
import { type SelfManagedComponentProps } from '@enonic/input-types';
import { type ImageUploaderConfig } from './ImageUploaderConfig';
import { ImageUploaderProvider } from './ImageUploaderContext';
import { ImageUploaderInputImage } from './ImageUploaderInputImage';
import { ImageUploaderInputControls } from './ImageUploaderInputControls';
import { useFormScopeRequirement } from '../../FormScopeContext';
import { IMAGE_UPLOADER_SCOPE_REQUIREMENT } from './ImageUploaderDescriptor';
import { matchesShortcut } from '../../../../../shared/lib/dom/keyboard';

const IMAGE_UPLOADER_INPUT_NAME = 'ImageUploaderInput';

export const ImageUploaderInput = ({
    values,
    input,
    enabled,
}: SelfManagedComponentProps<ImageUploaderConfig>): ReactElement | null => {
    const { enabled: scopeEnabled } = useFormScopeRequirement(input, IMAGE_UPLOADER_SCOPE_REQUIREMENT);

    if (values.length === 0) return null;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (!enabled || !scopeEnabled || event.defaultPrevented || event.isComposing) return;

        const target = event.target;
        // Portalled dialogs keep their own shortcuts, even though their events can bubble here.
        if (
            !(target instanceof Element) ||
            !event.currentTarget.contains(target) ||
            target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
        )
            return;

        const shortcut = ['Alt+R', 'Alt+Enter', 'Alt+Escape'].find((value) => matchesShortcut(event, value));
        if (!shortcut) return;

        const button = event.currentTarget.querySelector<HTMLButtonElement>(
            `button[aria-keyshortcuts~="${shortcut}"]:enabled`,
        );
        if (!button) return;

        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) button.click();
    };

    return (
        <div
            data-component={IMAGE_UPLOADER_INPUT_NAME}
            className="flex flex-col flex-1 min-h-0"
            onKeyDown={handleKeyDown}
        >
            <ImageUploaderProvider values={values} enabled={enabled && scopeEnabled}>
                <ImageUploaderInputControls />
                <ImageUploaderInputImage />
            </ImageUploaderProvider>
        </div>
    );
};

ImageUploaderInput.displayName = IMAGE_UPLOADER_INPUT_NAME;

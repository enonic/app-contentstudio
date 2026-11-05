import { type ReactElement, useRef, useState } from 'react';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { useImageUploaderReset } from '../useImageUploaderActions';
import { Button } from '@enonic/ui';
import { ConfirmationDialog } from '../../../../../../shared/ui/dialogs/ConfirmationDialog';

export const ImageUploaderInputResetButton = (): ReactElement => {
    const { enabled, mode, imageFrameRef, transformButtonRef } = useImageUploaderContext();
    const { canReset, isEditing, resetImage } = useImageUploaderReset();
    const resetLabel = useI18n('action.reset');
    const title = useI18n('dialog.image.reset.title');
    const description = useI18n('dialog.image.reset.description');
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <ConfirmationDialog.Root open={open} onOpenChange={setOpen}>
            {(isEditing || canReset) && (
                <Button
                    ref={buttonRef}
                    variant="text"
                    onClick={() => {
                        if (!isEditing) {
                            setOpen(true);
                        } else if (resetImage()) {
                            const frame = imageFrameRef.current;
                            const target =
                                mode === 'transform'
                                    ? transformButtonRef.current
                                    : (frame?.querySelector<SVGSVGElement>('[role="application"]') ?? frame);
                            target?.focus({ preventScroll: true });
                        }
                    }}
                    disabled={!enabled || !canReset}
                    aria-keyshortcuts="Alt+R"
                >
                    {resetLabel}
                </Button>
            )}
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        // The Reset button disappears after a total reset; the image remains available.
                        requestAnimationFrame(() => {
                            const button = buttonRef.current;
                            const target = button && !button.disabled ? button : imageFrameRef.current;
                            target?.focus({ preventScroll: true });
                        });
                    }}
                >
                    <ConfirmationDialog.DefaultHeader title={title} description={description} />
                    <ConfirmationDialog.Footer
                        intent="danger"
                        onConfirm={() => {
                            if (!isEditing) resetImage();
                        }}
                    />
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};

ImageUploaderInputResetButton.displayName = 'ImageUploaderInputResetButton';

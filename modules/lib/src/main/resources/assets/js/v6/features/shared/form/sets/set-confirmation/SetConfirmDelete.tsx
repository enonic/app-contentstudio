import {Button} from '@enonic/ui';
import {createPortal, forwardRef, type ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {ConfirmFocusTrap} from './ConfirmFocusTrap';
import {useConfirmKeyboard} from './hooks';

type SetConfirmDeleteProps = {
    position: {top: number; left: number; width: number} | null;
    onCancel: () => void;
    onConfirm: () => void;
};

export const SetConfirmDelete = forwardRef<HTMLDivElement, SetConfirmDeleteProps>(
    ({position, onCancel, onConfirm}, ref): ReactElement | null => {
        const cancelLabel = useI18n('action.cancel');
        const deleteLabel = useI18n('action.delete');

        useConfirmKeyboard({onCancel, enabled: true});

        return createPortal(
            <ConfirmFocusTrap
                ref={ref}
                className="fixed z-40 flex gap-2 justify-center outline-none"
                style={{
                    top: position?.top ?? 0,
                    left: position?.left ?? 0,
                    width: position?.width,
                    visibility: position ? 'visible' : 'hidden',
                }}
            >
                <Button variant="filled" label={cancelLabel} onClick={onCancel} />
                <Button
                    variant="solid"
                    label={deleteLabel}
                    onClick={onConfirm}
                    className="bg-btn-error hover:bg-btn-error-hover focus-visible:ring-error/50 active:bg-btn-error-active"
                />
            </ConfirmFocusTrap>,
            document.body
        );
    }
);

SetConfirmDelete.displayName = 'SetConfirmDelete';

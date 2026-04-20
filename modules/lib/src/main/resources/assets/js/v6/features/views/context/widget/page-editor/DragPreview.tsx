import {FilledCircleCheck, FilledCircleX} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {createPortal} from 'react';
import {$dragState} from '../../../../store/page-editor/drag';

const DRAG_PREVIEW_NAME = 'DragPreview';

export const DragPreview = (): ReactElement | null => {
    const dragState = useStore($dragState);

    if (dragState == null) return null;

    return createPortal(
        <div
            data-component={DRAG_PREVIEW_NAME}
            className="pointer-events-none fixed z-50 flex gap-4"
            style={{top: `${dragState.y - 28}px`, left: `${dragState.x - 24}px`}}
        >
            <span className="relative mt-2.5 size-7 shrink-0">
                <span className="absolute inset-[2.33px] rounded-full bg-surface-neutral" />
                {dragState.dropAllowed
                    ? <FilledCircleCheck className="relative size-7 text-success" />
                    : <FilledCircleX className="relative size-7 text-error" />}
            </span>
            <div className="rounded-lg border border-bdr-soft bg-surface-neutral px-7.5 py-4 leading-5.5 font-semibold whitespace-nowrap text-main shadow">
                {dragState.itemLabel}
            </div>
        </div>,
        document.body,
    );
};

DragPreview.displayName = DRAG_PREVIEW_NAME;

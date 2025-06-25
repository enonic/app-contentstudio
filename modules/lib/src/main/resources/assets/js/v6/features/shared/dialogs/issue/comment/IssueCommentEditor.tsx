import {Button, TextArea} from '@enonic/ui';
import React, {type ComponentPropsWithoutRef, type ReactElement} from 'react';

export type IssueCommentEditorProps = {
    value: string;
    commentLabel: string;
    cancelLabel: string;
    saveLabel: string;
    canSave: boolean;
    saving: boolean;
    textAreaRef: React.RefObject<HTMLTextAreaElement>;
    onChange: (value: string) => void;
    onCancel: () => void;
    onSave: () => void;
    onKeyDown: ComponentPropsWithoutRef<'textarea'>['onKeyDown'];
};

const ISSUE_COMMENT_EDITOR_NAME = 'IssueCommentEditor';

export const IssueCommentEditor = ({
    value,
    commentLabel,
    cancelLabel,
    saveLabel,
    canSave,
    saving,
    textAreaRef,
    onChange,
    onCancel,
    onSave,
    onKeyDown,
}: IssueCommentEditorProps): ReactElement => {
    return (
        <div className='flex flex-col gap-2'>
            <TextArea
                ref={textAreaRef}
                value={value}
                onInput={(event) => onChange(event.currentTarget.value)}
                onKeyDown={onKeyDown}
                rows={3}
                disabled={saving}
                aria-label={commentLabel}
            />
            <div className='flex items-center gap-2'>
                <Button
                    size='sm'
                    variant='outline'
                    label={cancelLabel}
                    onClick={onCancel}
                    disabled={saving}
                    className='min-w-20'
                />
                <Button
                    size='sm'
                    variant='solid'
                    label={saveLabel}
                    onClick={() => void onSave()}
                    disabled={!canSave}
                    className='min-w-20'
                />
            </div>
        </div>
    );
};

IssueCommentEditor.displayName = ISSUE_COMMENT_EDITOR_NAME;

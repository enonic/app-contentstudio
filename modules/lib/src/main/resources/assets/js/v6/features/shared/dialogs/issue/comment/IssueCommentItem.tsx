import {Avatar, cn} from '@enonic/ui';
import {type ComponentPropsWithoutRef, type ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {getInitials} from '../../../../utils/format/initials';
import {IssueCommentEditor} from './IssueCommentEditor';
import {IssueCommentMenu} from './IssueCommentMenu';

export type IssueCommentItemProps = {
    name: string;
    timeLabel?: string;
    text: string;
    textClassName?: string;
    onUpdate?: (nextText: string) => Promise<boolean> | boolean;
    onDelete?: () => void;
    portalContainer?: HTMLElement | null;
};

const ISSUE_COMMENT_ITEM_NAME = 'IssueCommentItem';

export const IssueCommentItem = ({
    name,
    timeLabel,
    text,
    textClassName,
    onUpdate,
    onDelete,
    portalContainer,
}: IssueCommentItemProps): ReactElement => {
    const moreLabel = useI18n('tooltip.moreActions');
    const editLabel = useI18n('action.edit');
    const deleteLabel = useI18n('action.delete');
    const saveLabel = useI18n('action.save');
    const cancelLabel = useI18n('action.cancel');
    const commentLabel = useI18n('field.comment.label');
    const canEdit = !!onUpdate;
    const canDelete = !!onDelete;
    const [editMode, setEditMode] = useState(false);
    const [draftText, setDraftText] = useState(text);
    const [saving, setSaving] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const editTextRef = useRef(text);

    const trimmedDraft = draftText.trim();
    const trimmedText = text.trim();
    const canSave = trimmedDraft.length > 0 && trimmedDraft !== trimmedText && !saving;
    useEffect(() => {
        if (!editMode) {
            setDraftText(text);
            return;
        }

        if (text !== editTextRef.current) {
            setEditMode(false);
            setDraftText(text);
        }
    }, [editMode, text]);

    useEffect(() => {
        if (!editMode || !textAreaRef.current) {
            return;
        }
        textAreaRef.current.focus();
        textAreaRef.current.scrollIntoView({behavior: 'smooth', block: 'center'});
        textAreaRef.current.select();
    }, [editMode]);

    const handleEdit = useCallback(() => {
        if (!canEdit) {
            return;
        }
        editTextRef.current = text;
        setDraftText(text);
        setEditMode(true);
    }, [canEdit, text]);

    const handleCancel = useCallback(() => {
        setDraftText(text);
        setEditMode(false);
    }, [text]);

    const handleSave = useCallback(async () => {
        if (!onUpdate || saving) {
            return;
        }

        if (!canSave) {
            setEditMode(false);
            return;
        }

        setSaving(true);
        try {
            const result = await onUpdate(trimmedDraft);
            if (result !== false) {
                setEditMode(false);
            }
        } finally {
            setSaving(false);
        }
    }, [canSave, onUpdate, saving, trimmedDraft]);

    const handleDelete = useCallback(() => {
        if (!onDelete) {
            return;
        }
        onDelete();
    }, [onDelete]);

    const handleDraftKeyDown: NonNullable<ComponentPropsWithoutRef<'textarea'>['onKeyDown']> = useCallback((event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            handleCancel();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            void handleSave();
        }
    }, [handleCancel, handleSave]);

    const hasActions = canEdit || canDelete;
    const initials = getInitials(name);

    return (
        <div
            data-component={ISSUE_COMMENT_ITEM_NAME}
            className='grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 items-center py-2.5'
        >
            <Avatar size='md' className='row-span-2 self-start mt-2.25'>
                <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar>
            <div className='flex flex-col gap-1.5 min-w-0 leading-5.5'>
                <div className='flex min-w-0 flex-wrap items-baseline gap-2'>
                    <span className='truncate text-md font-semibold'>{name}</span>
                    {timeLabel && <span className='text-xs text-subtle'>{timeLabel}</span>}
                </div>
                {editMode ? (
                    <IssueCommentEditor
                        value={draftText}
                        commentLabel={commentLabel}
                        cancelLabel={cancelLabel}
                        saveLabel={saveLabel}
                        canSave={canSave}
                        saving={saving}
                        textAreaRef={textAreaRef}
                        onChange={setDraftText}
                        onCancel={handleCancel}
                        onSave={() => void handleSave()}
                        onKeyDown={handleDraftKeyDown}
                    />
                ) : (
                    <div className={cn('whitespace-pre-wrap text-md', textClassName)}>{text}</div>
                )}
            </div>
            {hasActions && !editMode && (
                <IssueCommentMenu
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    moreLabel={moreLabel}
                    editLabel={editLabel}
                    deleteLabel={deleteLabel}
                    portalContainer={portalContainer}
                    className='row-span-2 justify-self-end self-start'
                />
            )}
        </div>
    );
};

IssueCommentItem.displayName = ISSUE_COMMENT_ITEM_NAME;

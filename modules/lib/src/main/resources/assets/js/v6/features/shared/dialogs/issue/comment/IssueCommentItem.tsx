import {Avatar, cn} from '@enonic/ui';
import {type ComponentPropsWithoutRef, type ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {getInitials} from '../../../../utils/format/initials';
import {IssueCommentActionsMenu} from './IssueCommentActionsMenu';
import {IssueCommentEditor} from './IssueCommentEditor';
import {IssueCommentDeleteDialog} from './IssueCommentDeleteDialog';

export type IssueCommentItemProps = {
    name: string;
    timeLabel?: string;
    label?: string;
    text: string;
    textClassName?: string;
    showMeta?: boolean;
    onUpdate?: (nextText: string) => Promise<boolean> | boolean;
    onDelete?: () => Promise<boolean> | boolean;
    portalContainer?: HTMLElement | null;
};

const ISSUE_COMMENT_ITEM_NAME = 'IssueCommentItem';

export const IssueCommentItem = ({
    name,
    timeLabel,
    label,
    text,
    textClassName,
    showMeta = true,
    onUpdate,
    onDelete,
    portalContainer,
}: IssueCommentItemProps): ReactElement => {
    const labels = {
        more: useI18n('tooltip.moreActions'),
        edit: useI18n('action.edit'),
        delete: useI18n('action.delete'),
        save: useI18n('action.save'),
        cancel: useI18n('action.cancel'),
        comment: useI18n('field.comment.label'),
        confirmDeleteTitle: useI18n('dialog.confirmDelete'),
        confirmDeleteDescription: useI18n('dialog.issue.confirmCommentDelete'),
    };
    const canEdit = !!onUpdate;
    const canDelete = !!onDelete;
    const [editMode, setEditMode] = useState(false);
    const [draftText, setDraftText] = useState(text);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
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
        if (!canDelete) {
            return;
        }
        setConfirmDeleteOpen(true);
    }, [canDelete]);

    const handleConfirmDelete = useCallback(async () => {
        if (!onDelete) {
            return;
        }
        await onDelete();
        setConfirmDeleteOpen(false);
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
    const meta = showMeta ? (
        <div className='flex min-w-0 flex-wrap items-baseline gap-2'>
            <span className='truncate text-md font-semibold'>{name}</span>
            {timeLabel && <span className='text-xs text-subtle'>{timeLabel}</span>}
        </div>
    ) : null;

    return (
        <>
            <div
                data-component={ISSUE_COMMENT_ITEM_NAME}
                className='grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 items-center py-2.5'
            >
                <Avatar size='md' className='row-span-2 self-start mt-2.25'>
                    <Avatar.Fallback>{initials}</Avatar.Fallback>
                </Avatar>
                <div className='flex flex-col gap-1.5 min-w-0 leading-5.5'>
                    {meta}
                    {label && <div className='text-md font-semibold'>{label}</div>}
                    {editMode ? (
                        <IssueCommentEditor
                            value={draftText}
                            commentLabel={labels.comment}
                            cancelLabel={labels.cancel}
                            saveLabel={labels.save}
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
                    <IssueCommentActionsMenu
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
                        moreLabel={labels.more}
                        editLabel={labels.edit}
                        deleteLabel={labels.delete}
                        portalContainer={portalContainer}
                        className='row-span-2 justify-self-end self-start'
                    />
                )}
            </div>
            {canDelete && (
                <IssueCommentDeleteDialog
                    open={confirmDeleteOpen}
                    onOpenChange={setConfirmDeleteOpen}
                    onConfirm={() => void handleConfirmDelete()}
                    portalContainer={portalContainer}
                    title={labels.confirmDeleteTitle}
                    description={labels.confirmDeleteDescription}
                />
            )}
        </>
    );
};

IssueCommentItem.displayName = ISSUE_COMMENT_ITEM_NAME;

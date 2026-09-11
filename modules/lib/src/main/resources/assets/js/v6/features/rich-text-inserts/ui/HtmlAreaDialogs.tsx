import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import { $anchorDialog } from '../model/anchorDialog.store';
import { $bulletedListDialog } from '../model/bulletedListDialog.store';
import { $codeDialog } from '../model/codeDialog.store';
import { $fullscreenDialog } from '../model/fullscreenDialog.store';
import { $numberedListDialog } from '../model/numberedListDialog.store';
import { $searchPopup } from '../model/searchPopup.store';
import { $specialCharDialog } from '../model/specialCharDialog.store';
import { $tableDialog } from '../model/tableDialog.store';
import { $tableQuicktablePopup } from '../model/tableQuicktablePopup.store';
import { AnchorDialog } from './AnchorDialog';
import { BulletedListDialog } from './BulletedListDialog';
import { CodeDialog } from './CodeDialog';
import { FullscreenDialog } from './FullscreenDialog';
import { NumberedListDialog } from './NumberedListDialog';
import { SearchPopup } from './SearchPopup';
import { SpecialCharDialog } from './SpecialCharDialog';
import { TableDialog } from './TableDialog';
import { TableQuicktablePopup } from './TableQuicktablePopup';

type HtmlAreaDialogsProps = {
    editorId: string;
};

/**
 * Renders all store-based HtmlArea dialogs, scoped to a specific editor instance.
 * Each dialog only renders when its store's editor matches the given editorId,
 * preventing duplicate dialogs when multiple HtmlArea inputs exist on the page.
 */
export const HtmlAreaDialogs = ({ editorId }: HtmlAreaDialogsProps): ReactElement => {
    const anchorEditor = useStore($anchorDialog, { keys: ['editor'] }).editor;
    const bulletedEditor = useStore($bulletedListDialog, { keys: ['editor'] }).editor;
    const codeEditor = useStore($codeDialog, { keys: ['editor'] }).editor;
    const { editor: fullscreenEditor, editorContainerId: fullscreenEditorId } = useStore($fullscreenDialog, {
        keys: ['editor', 'editorContainerId'],
    });
    const numberedEditor = useStore($numberedListDialog, { keys: ['editor'] }).editor;
    const searchEditor = useStore($searchPopup, { keys: ['editor'] }).editor;
    const specialCharEditor = useStore($specialCharDialog, { keys: ['editor'] }).editor;
    const tableEditor = useStore($tableDialog, { keys: ['editor'] }).editor;
    const quicktableEditor = useStore($tableQuicktablePopup, { keys: ['editor'] }).editor;

    const ownedFullscreenEditorId = fullscreenEditor?.name === editorId ? fullscreenEditorId : undefined;

    const isOwnEditor = (editor?: CKEDITOR.editor): boolean =>
        !!editor &&
        (editor.name === editorId || (!!ownedFullscreenEditorId && editor.name === ownedFullscreenEditorId));

    return (
        <>
            {isOwnEditor(anchorEditor) && <AnchorDialog />}
            {isOwnEditor(bulletedEditor) && <BulletedListDialog />}
            {isOwnEditor(codeEditor) && <CodeDialog />}
            {fullscreenEditor?.name === editorId && <FullscreenDialog />}
            {isOwnEditor(numberedEditor) && <NumberedListDialog />}
            {isOwnEditor(searchEditor) && <SearchPopup />}
            {isOwnEditor(specialCharEditor) && <SpecialCharDialog />}
            {isOwnEditor(tableEditor) && <TableDialog />}
            {isOwnEditor(quicktableEditor) && <TableQuicktablePopup />}
        </>
    );
};

HtmlAreaDialogs.displayName = 'HtmlAreaDialogs';

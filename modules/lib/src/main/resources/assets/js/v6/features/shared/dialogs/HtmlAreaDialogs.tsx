import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {$anchorDialog} from '../../store/dialogs/anchorDialog.store';
import {$bulletedListDialog} from '../../store/dialogs/bulletedListDialog.store';
import {$codeDialog} from '../../store/dialogs/codeDialog.store';
import {$fullscreenDialog} from '../../store/dialogs/fullscreenDialog.store';
import {$numberedListDialog} from '../../store/dialogs/numberedListDialog.store';
import {$searchPopup} from '../../store/dialogs/searchPopup.store';
import {$specialCharDialog} from '../../store/dialogs/specialCharDialog.store';
import {$tableDialog} from '../../store/dialogs/tableDialog.store';
import {$tableQuicktablePopup} from '../../store/dialogs/tableQuicktablePopup.store';
import {AnchorDialog} from './AnchorDialog';
import {BulletedListDialog} from './BulletedListDialog';
import {CodeDialog} from './CodeDialog';
import {FullscreenDialog} from './FullscreenDialog';
import {NumberedListDialog} from './NumberedListDialog';
import {SearchPopup} from './SearchPopup';
import {SpecialCharDialog} from './SpecialCharDialog';
import {TableDialog} from './TableDialog';
import {TableQuicktablePopup} from './TableQuicktablePopup';

type HtmlAreaDialogsProps = {
    editorId: string;
};

/**
 * Renders all store-based HtmlArea dialogs, scoped to a specific editor instance.
 * Each dialog only renders when its store's editor matches the given editorId,
 * preventing duplicate dialogs when multiple HtmlArea inputs exist on the page.
 */
export const HtmlAreaDialogs = ({editorId}: HtmlAreaDialogsProps): ReactElement => {
    const anchorEditor = useStore($anchorDialog, {keys: ['editor']}).editor;
    const bulletedEditor = useStore($bulletedListDialog, {keys: ['editor']}).editor;
    const codeEditor = useStore($codeDialog, {keys: ['editor']}).editor;
    const fullscreenEditor = useStore($fullscreenDialog, {keys: ['editor']}).editor;
    const numberedEditor = useStore($numberedListDialog, {keys: ['editor']}).editor;
    const searchEditor = useStore($searchPopup, {keys: ['editor']}).editor;
    const specialCharEditor = useStore($specialCharDialog, {keys: ['editor']}).editor;
    const tableEditor = useStore($tableDialog, {keys: ['editor']}).editor;
    const quicktableEditor = useStore($tableQuicktablePopup, {keys: ['editor']}).editor;

    return (
        <>
            {anchorEditor?.name === editorId && <AnchorDialog />}
            {bulletedEditor?.name === editorId && <BulletedListDialog />}
            {codeEditor?.name === editorId && <CodeDialog />}
            {fullscreenEditor?.name === editorId && <FullscreenDialog />}
            {numberedEditor?.name === editorId && <NumberedListDialog />}
            {searchEditor?.name === editorId && <SearchPopup />}
            {specialCharEditor?.name === editorId && <SpecialCharDialog />}
            {tableEditor?.name === editorId && <TableDialog />}
            {quicktableEditor?.name === editorId && <TableQuicktablePopup />}
        </>
    );
};

HtmlAreaDialogs.displayName = 'HtmlAreaDialogs';

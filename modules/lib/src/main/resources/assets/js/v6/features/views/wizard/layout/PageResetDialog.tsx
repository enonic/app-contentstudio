import {useEffect, useState, type ReactElement} from 'react';
import {ComponentPath} from '../../../../../app/page/region/ComponentPath';
import {PageEventsManager} from '../../../../../app/wizard/PageEventsManager';
import {useI18n} from '../../../hooks/useI18n';
import {ConfirmationDialog} from '../../../shared/dialogs/ConfirmationDialog';
import {$isFragment, executePageReset, requestComponentReset} from '../../../store/page-editor';

const PAGE_RESET_DIALOG_NAME = 'PageResetDialog';
const ROOT_PATH = '/';

export const PageResetDialog = (): ReactElement => {
    const [open, setOpen] = useState(false);
    const question = useI18n('dialog.page.reset.confirmation');

    useEffect(() => {
        const handler = () => {
            // ? Fragments delegate to a component reset on the root —
            // ? no page-level confirmation is needed in that case.
            if ($isFragment.get()) {
                requestComponentReset(ComponentPath.fromString(ROOT_PATH));
                return;
            }
            setOpen(true);
        };

        PageEventsManager.get().onPageResetRequested(handler);
        return () => PageEventsManager.get().unPageResetRequested(handler);
    }, []);

    const handleConfirm = () => {
        executePageReset();
        setOpen(false);
    };

    return (
        <ConfirmationDialog.Root open={open} onOpenChange={setOpen}>
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay />
                <ConfirmationDialog.Content data-component={PAGE_RESET_DIALOG_NAME}>
                    <ConfirmationDialog.Body>{question}</ConfirmationDialog.Body>
                    <ConfirmationDialog.Footer
                        intent="danger"
                        onConfirm={handleConfirm}
                        onCancel={() => setOpen(false)}
                    />
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};

PageResetDialog.displayName = PAGE_RESET_DIALOG_NAME;

import {Button, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../hooks/useI18n';
import {LanguageSelector} from '../selectors/LanguageSelector';
import {OwnerSelector} from '../selectors/OwnerSelector';
import {
    $editPropertiesDialog,
    $editPropertiesDialogOwnerOptions,
    applyEditPropertiesDialog,
    closeEditPropertiesDialog,
    searchEditPropertiesOwners,
    setEditPropertiesDialogLanguageSelection,
    setEditPropertiesDialogOwnerSelection,
} from '../../store/dialogs/editPropertiesDialog.store';

const EDIT_PROPERTIES_DIALOG_NAME = 'EditPropertiesDialog';

export const EditPropertiesDialog = (): ReactElement => {
    const {
        open,
        content,
        languageSelection,
        ownerSelection,
        localeOptions,
        saving,
    } = useStore($editPropertiesDialog, {
        keys: [
            'open',
            'content',
            'languageSelection',
            'ownerSelection',
            'localeOptions',
            'saving',
        ],
    });
    const ownerOptionsWithSelection = useStore($editPropertiesDialogOwnerOptions);

    const title = useI18n('widget.properties.edit.settings.text');
    const applyLabel = useI18n('action.apply');
    const cancelLabel = useI18n('action.cancel');
    const languageLabel = useI18n('field.lang');
    const ownerLabel = useI18n('field.owner');
    const searchPlaceholder = useI18n('field.search.placeholder');

    const contentSummary = content?.getContentSummary();
    const path = contentSummary?.getPath()?.toString();

    const handleOpenChange = (next: boolean): void => {
        if (!next && saving) {
            return;
        }
        if (!next) {
            closeEditPropertiesDialog();
        }
    };

    const handleCancel = (): void => {
        if (!saving) {
            closeEditPropertiesDialog();
        }
    };

    const handleApply = (): void => {
        void applyEditPropertiesDialog();
    };

    const initialLanguage = contentSummary?.getLanguage() ?? '';
    const initialOwner = contentSummary?.getOwner()?.toString() ?? '';
    const selectedLanguage = languageSelection[0] ?? '';
    const selectedOwner = ownerSelection[0] ?? '';
    const hasChanges = !!contentSummary && (selectedLanguage !== initialLanguage || selectedOwner !== initialOwner);
    const canApply = hasChanges && !saving;

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay/>
                <Dialog.Content
                    className='overflow-visible sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220 gap-7.5'
                    data-component={EDIT_PROPERTIES_DIALOG_NAME}
                >
                    <Dialog.DefaultHeader
                        title={title}
                        description={path}
                    />
                    <Dialog.Body className='flex flex-col gap-7.5 overflow-visible'>
                        <LanguageSelector
                            label={languageLabel}
                            options={localeOptions}
                            selection={languageSelection}
                            onSelectionChange={setEditPropertiesDialogLanguageSelection}
                            placeholder={searchPlaceholder}
                            searchPlaceholder={searchPlaceholder}
                            disabled={saving}
                        />
                        <OwnerSelector
                            label={ownerLabel}
                            options={ownerOptionsWithSelection}
                            selection={ownerSelection}
                            onSelectionChange={setEditPropertiesDialogOwnerSelection}
                            placeholder={searchPlaceholder}
                            searchPlaceholder={searchPlaceholder}
                            disabled={saving}
                            onSearchChange={(value) => {
                                void searchEditPropertiesOwners(value);
                            }}
                        />
                    </Dialog.Body>
                    <Dialog.Footer className='justify-between'>
                        <Button
                            variant='outline'
                            size='lg'
                            label={cancelLabel}
                            onClick={handleCancel}
                            disabled={saving}
                        />
                        <Button
                            variant='solid'
                            size='lg'
                            label={applyLabel}
                            onClick={handleApply}
                            disabled={!canApply}
                        />
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

EditPropertiesDialog.displayName = EDIT_PROPERTIES_DIALOG_NAME;

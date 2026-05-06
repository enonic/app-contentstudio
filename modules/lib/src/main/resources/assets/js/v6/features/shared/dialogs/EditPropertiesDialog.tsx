import {Button, Dialog, GridList, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useMemo, type ReactElement} from 'react';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {useI18n} from '../../hooks/useI18n';
import {PrincipalSelector} from '../selectors/PrincipalSelector';
import {
    $editPropertiesDialog,
    applyEditPropertiesDialog,
    closeEditPropertiesDialog,
    setEditPropertiesDialogLanguageSelection,
    setEditPropertiesDialogOwnerSelection,
} from '../../store/dialogs/editPropertiesDialog.store';
import {$languages, LanguageOption} from '../../store/languages.store';
import {$principals} from '../../store/principals.store';
import {FlagIcon} from '../icons/FlagIcon';
import {PrincipalLabel} from '../PrincipalLabel';
import {LanguageSelector} from '../selectors/LanguageSelector';
import {X} from 'lucide-react';

const EDIT_PROPERTIES_DIALOG_NAME = 'EditPropertiesDialog';

export const EditPropertiesDialog = (): ReactElement => {
    // Stores
    const {open, content, languageSelection, ownerSelection, saving} = useStore($editPropertiesDialog, {
        keys: ['open', 'content', 'languageSelection', 'ownerSelection', 'saving'],
    });
    const languages = useStore($languages);
    const {principals} = useStore($principals);

    // Constants
    const title = useI18n('field.contextPanel.details.sections.info.editSettings');
    const noLanguagesFoundLabel = useI18n('widget.properties.edit.settings.noLanguagesFound');
    const noOwnersFoundLabel = useI18n('widget.properties.edit.settings.noOwnersFound');
    const applyLabel = useI18n('action.apply');
    const cancelLabel = useI18n('action.cancel');
    const languageLabel = useI18n('field.lang');
    const ownerLabel = useI18n('field.owner');
    const searchPlaceholder = useI18n('field.option.placeholder');

    const path = content?.getPath()?.toString();
    const initialLanguage = content?.getLanguage() ?? '';
    const initialOwner = content?.getOwner()?.toString() ?? '';
    const selectedLanguage = languageSelection[0] ?? '';
    const selectedOwner = ownerSelection[0] ?? '';
    const hasChanges = !!content && (selectedLanguage !== initialLanguage || selectedOwner !== initialOwner);
    const canApply = hasChanges && !saving;

    // Memoized values
    const selectedLanguageOption = useMemo<LanguageOption | undefined>(
        () => (languageSelection.length > 0 ? languages.find((language) => language.id === languageSelection[0]) : undefined),
        [languageSelection, languages]
    );

    const selectedOwnerPrincipal = useMemo(
        () => (ownerSelection.length > 0 ? principals.find((p) => p.getKey().toString() === ownerSelection[0]) : undefined),
        [ownerSelection, principals]
    );

    // Handlers
    const handleOpenChange = (next: boolean): void => {
        if (!next && saving) {
            return;
        }
        if (!next) {
            closeEditPropertiesDialog();
        }
    };
    const handleApply = (): void => {
        void applyEditPropertiesDialog();
    };
    const handleUnselectLanguage = () => {
        setEditPropertiesDialogLanguageSelection([]);
    };
    const handleUnselectOwner = () => {
        setEditPropertiesDialogOwnerSelection([]);
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    className="sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220 w-full h-full gap-7.5"
                    data-component={EDIT_PROPERTIES_DIALOG_NAME}
                >
                    <Dialog.DefaultHeader title={title} description={path} withClose />
                    <Dialog.Body className="flex flex-col gap-7.5 p-2 -m-2">
                        {/* Language selector */}
                        <div>
                            <LanguageSelector
                                label={languageLabel}
                                options={languages}
                                selection={languageSelection}
                                onSelectionChange={setEditPropertiesDialogLanguageSelection}
                                placeholder={searchPlaceholder}
                                searchPlaceholder={searchPlaceholder}
                                emptyLabel={noLanguagesFoundLabel}
                                disabled={saving}
                                closeOnBlur
                            />
                            {selectedLanguageOption && (
                                <GridList className="rounded-md py-2.5 pl-4 pr-1">
                                    <GridList.Row key={selectedLanguageOption.id} id={selectedLanguageOption.id} className="p-1 gap-1.5">
                                        <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                            <div className="flex gap-2">
                                                <FlagIcon language={selectedLanguageOption.id} />
                                                <span>{selectedLanguageOption.label}</span>
                                            </div>
                                        </GridList.Cell>
                                        <GridList.Cell>
                                            <GridList.Action>
                                                <IconButton variant="text" icon={X} onClick={handleUnselectLanguage} />
                                            </GridList.Action>
                                        </GridList.Cell>
                                    </GridList.Row>
                                </GridList>
                            )}
                        </div>

                        {/* Owner selector */}
                        <div>
                            <PrincipalSelector
                                label={ownerLabel}
                                allowedTypes={[PrincipalType.USER]}
                                selectionMode="single"
                                selection={ownerSelection}
                                onSelectionChange={setEditPropertiesDialogOwnerSelection}
                                placeholder={searchPlaceholder}
                                emptyLabel={noOwnersFoundLabel}
                                disabled={saving}
                                closeOnBlur
                            />
                            {selectedOwnerPrincipal && (
                                <GridList className="rounded-md py-2.5 pl-4 pr-1">
                                    <GridList.Row
                                        key={selectedOwnerPrincipal.getKey().toString()}
                                        id={selectedOwnerPrincipal.getKey().toString()}
                                        className="p-1 gap-1.5"
                                    >
                                        <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                            <PrincipalLabel principal={selectedOwnerPrincipal} />
                                        </GridList.Cell>
                                        <GridList.Cell>
                                            <GridList.Action>
                                                <IconButton variant="text" icon={X} onClick={handleUnselectOwner} />
                                            </GridList.Action>
                                        </GridList.Cell>
                                    </GridList.Row>
                                </GridList>
                            )}
                        </div>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button
                            className="self-end"
                            variant="solid"
                            size="lg"
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

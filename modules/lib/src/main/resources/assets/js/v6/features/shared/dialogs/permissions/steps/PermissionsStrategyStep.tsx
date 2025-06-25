import {Checkbox, Dialog, RadioGroup} from '@enonic/ui';
import {ReactElement} from 'react';
import {useStore} from '@nanostores/preact';
import {useI18n} from '../../../../hooks/useI18n';
import {
    $permissionsDialog,
    setPermissionsDialogApplyTo,
    setPermissionsDialogReplaceAllChildPermissions,
    setPermissionsDialogView,
} from '../../../../store/dialogs/permissionsDialog.store';

export const PermissionsDialogStrategyStepHeader = (): ReactElement => {
    const {contentDisplayName} = useStore($permissionsDialog, {keys: ['contentDisplayName']});

    const helperLabel = useI18n('dialog.permissions.title', contentDisplayName);
    const titleLabel = useI18n('dialog.permissions.strategy.title');

    return <Dialog.StepHeader step="step-strategy" helper={helperLabel} title={titleLabel} withClose />;
};

PermissionsDialogStrategyStepHeader.displayName = 'PermissionsDialogStrategyStepHeader';

export const PermissionsDialogStrategyStepContent = ({locked}: {locked: boolean}): ReactElement => {
    // Stores
    const {applyTo, contentDescendantsCount, replaceAllChildPermissions} = useStore($permissionsDialog, {
        keys: ['applyTo', 'contentDescendantsCount', 'replaceAllChildPermissions'],
    });

    // Constants
    const applyToLabel = useI18n('dialog.permissions.strategy.applyTo');
    const applyToItemLabel = useI18n('dialog.permissions.strategy.applyTo.item', 1);
    const applyToChildrenLabel = useI18n('dialog.permissions.strategy.applyTo.children', contentDescendantsCount);
    const applyToAllLabel = useI18n('dialog.permissions.strategy.applyTo.all', contentDescendantsCount + 1);
    const replaceTitle = useI18n('dialog.permissions.strategy.replace.title');
    const replaceDescription = useI18n('dialog.permissions.strategy.replace.description');

    return (
        <Dialog.StepContent step="step-strategy" locked={locked}>
            <div className="space-y-2">
                <label className="block font-semibold">{applyToLabel}</label>

                <RadioGroup.Root name="applyTo" value={applyTo} onValueChange={setPermissionsDialogApplyTo} className="rounded-md -mx-2">
                    <RadioGroup.Item value="single">
                        <RadioGroup.Indicator />
                        <span className="ml-2">{applyToItemLabel}</span>
                    </RadioGroup.Item>

                    <RadioGroup.Item value="subtree">
                        <RadioGroup.Indicator />
                        <span className="ml-2">{applyToChildrenLabel}</span>
                    </RadioGroup.Item>

                    <RadioGroup.Item value="tree">
                        <RadioGroup.Indicator />
                        <span className="ml-2">{applyToAllLabel}</span>
                    </RadioGroup.Item>
                </RadioGroup.Root>
            </div>

            {applyTo !== 'single' && (
                <div className="my-7.5">
                    <Checkbox
                        label={replaceTitle}
                        checked={replaceAllChildPermissions}
                        onCheckedChange={(checked) => {
                            if (checked) {
                                setPermissionsDialogView('replaceAllConfirmation');
                                return;
                            }

                            setPermissionsDialogReplaceAllChildPermissions(false);
                        }}
                        className="font-semibold"
                    />
                    <span className="ml-6 text-subtle text-sm">{replaceDescription}</span>
                </div>
            )}
        </Dialog.StepContent>
    );
};

PermissionsDialogStrategyStepContent.displayName = 'PermissionsDialogStrategyStepContent';

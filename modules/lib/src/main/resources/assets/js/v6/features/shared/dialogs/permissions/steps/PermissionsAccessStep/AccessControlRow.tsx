import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ReactElement} from 'react';
import {GridList, IconButton, Selector} from '@enonic/ui';
import {X} from 'lucide-react';
import {Access} from '../../../../../../../app/security/Access';
import {useI18n} from '../../../../../hooks/useI18n';
import {getPrincipalAllowedPermissions} from '../../../../../utils/cms/permissions/accessControl';
import {AccessHelper} from '../../../../../../../app/security/AccessHelper';
import {$permissionsDialog} from '../../../../../store/dialogs/permissionsDialog.store';
import {useStore} from '@nanostores/preact';
import {PrincipalLabel} from '../../../../PrincipalLabel';

type AccessControlRowProps = {
    principal: Principal;
    principalsInCustomAccess: string[];
    onSelect: (value: Access) => void;
    onUnselect: () => void;
};

export const AccessControlRow = ({principal, principalsInCustomAccess, onSelect, onUnselect}: AccessControlRowProps): ReactElement => {
    const {accessControlEntries} = useStore($permissionsDialog, {keys: ['accessControlEntries']});

    const accessFullLabel = useI18n('security.access.full');
    const accessPublishLabel = useI18n('security.access.publish');
    const accessWriteLabel = useI18n('security.access.write');
    const accessReadLabel = useI18n('security.access.read');
    const accessCustomLabel = useI18n('security.access.custom');
    const accessLabelMap = new Map([
        [Access.FULL, accessFullLabel],
        [Access.PUBLISH, accessPublishLabel],
        [Access.WRITE, accessWriteLabel],
        [Access.READ, accessReadLabel],
        [Access.CUSTOM, accessCustomLabel],
    ]);

    const key = principal.getKey().toString();

    const allowedPermissions = getPrincipalAllowedPermissions(accessControlEntries, key);
    const accessValue = AccessHelper.getAccessValueFromPermissions(allowedPermissions);
    const accessControlEntryLabel = principalsInCustomAccess.includes(key)
        ? accessLabelMap.get(Access.CUSTOM)
        : accessLabelMap.get(accessValue);

    return (
        <GridList.Row id={`${key}-access`} className="p-1 gap-2.5">
            <GridList.Cell interactive={false} className="flex-1 self-stretch">
                <div className="flex items-center gap-2.5 flex-1">
                    <PrincipalLabel principal={principal} />
                </div>
            </GridList.Cell>

            <GridList.Cell>
                <Selector.Root value={accessValue} onValueChange={onSelect}>
                    <GridList.Action>
                        <Selector.Trigger className="border-none text-sm h-10">
                            <Selector.Value>{accessControlEntryLabel}</Selector.Value>
                            <Selector.Icon />
                        </Selector.Trigger>
                    </GridList.Action>
                    <Selector.Content portal={false}>
                        <Selector.Viewport>
                            {Array.from(accessLabelMap.entries()).map(([id, displayName]) => (
                                <Selector.Item key={id} value={id} textValue={displayName}>
                                    <Selector.ItemText>{displayName}</Selector.ItemText>
                                </Selector.Item>
                            ))}
                        </Selector.Viewport>
                    </Selector.Content>
                </Selector.Root>
            </GridList.Cell>

            <GridList.Cell>
                <GridList.Action>
                    <IconButton variant="text" icon={X} onClick={onUnselect} />
                </GridList.Action>
            </GridList.Cell>
        </GridList.Row>
    );
};

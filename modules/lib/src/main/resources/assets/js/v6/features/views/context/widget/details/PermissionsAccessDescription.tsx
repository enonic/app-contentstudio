import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {LockKeyhole, LockKeyholeOpen} from 'lucide-react';
import {ReactElement} from 'react';
import {Content} from '../../../../../../app/content/Content';
import {useI18n} from '../../../../hooks/useI18n';
import {getEveryoneAccess} from '../../../../store/context/detailsWidgets.store';
import {Access} from '../../../../../../app/security/Access';

type PermissionsAccessDescriptionProps = {
    content: Content;
};

const PERMISSIONS_ACCESS_DESCRIPTION_NAME = 'PermissionsAccessDescription';

export const PermissionsAccessDescription = ({content}: PermissionsAccessDescriptionProps): ReactElement => {
    const restrictedText = useI18n('widget.useraccess.restricted');
    const fullAccessText = useI18n('field.access.full.everyone');
    const publishText = useI18n('field.access.publish.everyone');
    const writeText = useI18n('field.access.write.everyone');
    const readText = useI18n('field.access.read.everyone');
    const customText = useI18n('field.access.custom.everyone');
    const accessTextMap = new Map<Access, string>([
        [Access.FULL, fullAccessText],
        [Access.PUBLISH, publishText],
        [Access.WRITE, writeText],
        [Access.READ, readText],
        [Access.CUSTOM, customText],
    ]);

    const hasEveryoneEntry = content
        .getPermissions()
        .getEntries()
        .some((entry) => entry.getPrincipalKey().equals(RoleKeys.EVERYONE));

    const Icon = hasEveryoneEntry ? LockKeyholeOpen : LockKeyhole;
    const text = hasEveryoneEntry ? accessTextMap.get(getEveryoneAccess(content)) : restrictedText;

    return (
        <div data-component={PERMISSIONS_ACCESS_DESCRIPTION_NAME} className="flex items-center gap-3.5 text-xs text-subtle overflow-hidden">
            <Icon size={14} className="shrink-0" />
            <span className="truncate">{text}</span>
        </div>
    );
};

PermissionsAccessDescription.displayName = PERMISSIONS_ACCESS_DESCRIPTION_NAME;

import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {LockKeyhole, LockKeyholeOpen} from 'lucide-react';
import {ReactElement} from 'react';
import {Content} from '../../../../../../app/content/Content';
import {useI18n} from '../../../../hooks/useI18n';
import {getEveryoneAccess} from '../../../../store/context/detailsWidgets.store';

type PermissionsAccessDescriptionProps = {
    content: Content;
};

const PERMISSIONS_ACCESS_DESCRIPTION_NAME = 'PermissionsAccessDescription';

export const PermissionsAccessDescription = ({content}: PermissionsAccessDescriptionProps): ReactElement => {
    const restrictedText = useI18n('widget.useraccess.restricted');
    const fullAccessText = useI18n('field.access.full.everyone');
    const canPublishText = useI18n('field.access.can_publish.everyone');
    const canWriteText = useI18n('field.access.can_write.everyone');
    const canReadText = useI18n('field.access.can_read.everyone');

    const everyoneAccess = getEveryoneAccess(content);
    const hasEveryoneEntry = !!content.getPermissions().getEntry(RoleKeys.EVERYONE);
    const Icon = hasEveryoneEntry ? LockKeyholeOpen : LockKeyhole;

    const accessTextMap: Record<string, string> = {
        full: fullAccessText,
        can_publish: canPublishText,
        can_write: canWriteText,
        can_read: canReadText,
    };
    const text = everyoneAccess ? accessTextMap[everyoneAccess.toLowerCase()] ?? restrictedText : restrictedText;

    return (
        <div data-component={PERMISSIONS_ACCESS_DESCRIPTION_NAME} className="flex items-center gap-3.5 text-xs text-subtle overflow-hidden">
            <Icon size={14} className="shrink-0" />
            <span className="truncate">{text}</span>
        </div>
    );
};

PermissionsAccessDescription.displayName = PERMISSIONS_ACCESS_DESCRIPTION_NAME;

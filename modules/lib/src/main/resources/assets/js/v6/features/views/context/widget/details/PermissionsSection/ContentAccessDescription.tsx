import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {LockKeyhole, LockKeyholeOpen} from 'lucide-react';
import {useI18n} from '../../../../../hooks/useI18n';
import {Content} from 'src/main/resources/assets/js/app/content/Content';
import {ReactElement} from 'react';
import {getEveryoneAccess} from '../utils';

export const ContentAccessDescription = ({content}: {content: Content}): ReactElement => {
    const everyoneAccess = getEveryoneAccess(content);

    const text = everyoneAccess
        ? useI18n(`field.access.${everyoneAccess.toLowerCase()}.everyone`)
        : useI18n('widget.useraccess.restricted');

    const Icon = !!content.getPermissions().getEntry(RoleKeys.EVERYONE) ? LockKeyholeOpen : LockKeyhole;

    return (
        <span class="flex items-center gap-3.5 text-xs text-subtle">
            <Icon size={14} />
            {text}
        </span>
    );
};

ContentAccessDescription.displayName = 'ContentAccessDescription';

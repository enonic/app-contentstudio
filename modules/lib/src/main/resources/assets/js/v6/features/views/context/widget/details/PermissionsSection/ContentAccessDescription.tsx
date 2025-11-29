import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {LockKeyhole, LockKeyholeOpen} from 'lucide-react';
import {useI18n} from '../../../../../hooks/useI18n';
import {Content} from 'src/main/resources/assets/js/app/content/Content';
import {ReactElement} from 'react';
import {getEveryoneAccess} from '../../../../../store/context/detailsWidgets.store';

export const ContentAccessDescription = ({content}: {content: Content}): ReactElement => {
    const everyoneAccess = getEveryoneAccess(content);

    const text = everyoneAccess
        ? useI18n(`field.access.${everyoneAccess.toLowerCase()}.everyone`)
        : useI18n('widget.useraccess.restricted');

    const Icon = !!content.getPermissions().getEntry(RoleKeys.EVERYONE) ? LockKeyholeOpen : LockKeyhole;

    return (
        <div className="flex items-center gap-3.5 text-xs text-subtle overflow-hidden">
            <Icon size={14} className="shrink-0" />
            <span className="truncate">{text}</span>
        </div>
    );
};

ContentAccessDescription.displayName = 'ContentAccessDescription';

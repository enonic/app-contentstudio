import {Link} from '@enonic/ui';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {useMemo} from 'react';

import {ProjectContext} from '../../project/ProjectContext';
import {Branch} from '../../versioning/Branch';
import {DependencyType} from '../../browse/DependencyType';
import type {ContentId} from '../../content/ContentId';
import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {UrlHelper} from '../../util/UrlHelper';

export type ContentReferencesLinkProps = {
    contentId: string;
    target?: Branch;
    contentTypeName?: ContentTypeName;
};

export function ContentReferencesLink({
    contentId,
    target,
    contentTypeName,
}: ContentReferencesLinkProps) {
    const project = ProjectContext.get().getProject().getName();
    const branch = target ?? Branch.DRAFT;
    const contentType = contentTypeName?.toString();

    const href = useMemo(() => {
        const relative = `${project}/${DependencyType.INBOUND}/${branch}/${contentId}${contentType ? `/${contentType}` : ''}`;
        return UrlHelper.getPrefixedUrl(relative);
    }, [project, branch, contentType, contentId]);

    return (
        <Link href={href} newTab className='hover:bg-btn-primary-hover box-border rounded-sm transition-highlight h-8 -my-1 px-1.25 py-1'>
            {i18n('action.showReferences')}
        </Link>
    );
}

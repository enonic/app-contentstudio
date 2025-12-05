import {Link, cn} from '@enonic/ui';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {useMemo} from 'react';

import {ProjectContext} from '../../../app/project/ProjectContext';
import {Branch} from '../../../app/versioning/Branch';
import {DependencyType} from '../../../app/browse/DependencyType';
import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {UrlHelper} from '../../../app/util/UrlHelper';

export type ContentReferencesLinkProps = {
    contentId: string;
    target?: Branch;
    contentTypeName?: ContentTypeName;
    mainItem?: boolean;
};

export function ContentReferencesLink({
    contentId,
    target,
    contentTypeName,
    mainItem,
}: ContentReferencesLinkProps) {
    const project = ProjectContext.get().getProject().getName();
    const branch = target ?? Branch.DRAFT;
    const contentType = contentTypeName?.toString();

    const href = useMemo(() => {
        const relative = `${project}/${DependencyType.INBOUND}/${branch}/${contentId}${contentType ? `/${contentType}` : ''}`;
        return UrlHelper.getPrefixedUrl(relative);
    }, [project, branch, contentType, contentId]);

    return (
        <Link
            href={href}
            newTab
            className={cn(
                'hover:bg-btn-primary-hover visited:text-current box-border rounded-sm transition-highlight',
                mainItem
                ? 'h-13 -my-2.5 px-[10px] py-2.5'
                : 'h-8 -my-1 px-1.25 py-1'
            )}
        >
            {i18n('action.showReferences')}
        </Link>
    );
}

ContentReferencesLink.displayName = 'ContentReferencesLink';

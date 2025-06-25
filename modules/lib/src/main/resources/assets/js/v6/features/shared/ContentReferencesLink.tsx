import {cn, Link, LinkProps} from '@enonic/ui';
import {useMemo} from 'react';

import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {useStore} from '@nanostores/preact';
import {DependencyType} from '../../../app/browse/DependencyType';
import {UrlHelper} from '../../../app/util/UrlHelper';
import {Branch} from '../../../app/versioning/Branch';
import {useI18n} from '../hooks/useI18n';
import {$activeProject} from '../store/projects.store';

export type ContentReferencesLinkProps = {
    contentId: string;
    branch: Branch;
    contentTypeName?: ContentTypeName;
    'data-component'?: string;
} & Omit<LinkProps, 'href' | 'newTab'>;

const CONTENT_REFERENCES_LINK_NAME = 'ContentReferencesLink';
export function ContentReferencesLink({
    contentId,
    branch,
    contentTypeName,
    className,
    'data-component': componentName = CONTENT_REFERENCES_LINK_NAME,
    ...props
}: ContentReferencesLinkProps) {
    const label = useI18n('action.showReferences');
    const projectName = useStore($activeProject)?.getName();
    const contentType = contentTypeName?.toString();

    const href = useMemo(() => {
        const relative = `${projectName}/${DependencyType.INBOUND}/${branch}/${contentId}${contentType ? `/${contentType}` : ''}`;
        return UrlHelper.getPrefixedUrl(relative);
    }, [projectName, branch, contentType, contentId]);

    return (
        <Link
            className={cn('visited:text-main', className)}
            href={href}
            newTab
            data-component={componentName}
            {...props}
        >
            {label}
        </Link>
    );
}

ContentReferencesLink.displayName = CONTENT_REFERENCES_LINK_NAME;

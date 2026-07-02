import { cn, Link, type LinkProps } from '@enonic/ui';
import { forwardRef, useMemo } from 'react';

import type { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { useStore } from '@nanostores/preact';
import { DependencyType } from '../../../app/browse/DependencyType';
import { UrlHelper } from '../../../app/util/UrlHelper';
import { type Branch } from '../../../app/versioning/Branch';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { $activeProject } from '../store/activeProject.store';

export type ContentReferencesLinkProps = {
    contentId: string;
    branch: Branch;
    contentTypeName?: ContentTypeName;
    'data-active'?: boolean;
    'data-component'?: string;
} & Omit<LinkProps, 'href' | 'newTab'>;

const CONTENT_REFERENCES_LINK_NAME = 'ContentReferencesLink';
export const ContentReferencesLink = forwardRef<HTMLAnchorElement, ContentReferencesLinkProps>(
    (
        {
            contentId,
            branch,
            contentTypeName,
            className,
            'data-component': componentName = CONTENT_REFERENCES_LINK_NAME,
            ...props
        }: ContentReferencesLinkProps,
        ref,
    ) => {
        const label = useI18n('action.showReferences');
        const projectName = useStore($activeProject)?.getName();
        const contentType = contentTypeName?.toString();

        const href = useMemo(() => {
            const relative = `${projectName}/${DependencyType.INBOUND}/${branch}/${contentId}${contentType ? `/${contentType}` : ''}`;
            return UrlHelper.getPrefixedUrl(relative);
        }, [projectName, branch, contentType, contentId]);

        return (
            <Link
                ref={ref}
                className={cn(
                    className,
                    'self-stretch px-2 visited:text-main active:bg-transparent data-[active=true]:bg-transparent',
                )}
                href={href}
                newTab
                data-component={componentName}
                {...props}
            >
                {label}
            </Link>
        );
    },
);

ContentReferencesLink.displayName = CONTENT_REFERENCES_LINK_NAME;

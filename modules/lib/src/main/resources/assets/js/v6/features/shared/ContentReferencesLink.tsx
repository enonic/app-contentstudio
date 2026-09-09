import { cn, Link, type LinkProps } from '@enonic/ui';
import { forwardRef, useMemo } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import type { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { useStore } from '@nanostores/preact';
import { type Branch } from '../../../app/versioning/Branch';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { getInboundReferencesUrl } from '../../shared/lib/url/navigation';
import { $activeProject } from '../../entities/project';

export type ContentReferencesLinkProps = {
    contentId: string;
    branch: Branch;
    contentTypeName?: ContentTypeName;
    compactIconBelowSm?: boolean;
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
            compactIconBelowSm = false,
            className,
            'data-component': componentName = CONTENT_REFERENCES_LINK_NAME,
            ...props
        }: ContentReferencesLinkProps,
        ref,
    ) => {
        const label = useI18n('action.showReferences');
        const projectName = useStore($activeProject)?.getName();
        const contentType = contentTypeName?.toString();
        const href = useMemo(
            () => getInboundReferencesUrl({ contentId, branch, project: projectName, contentType }),
            [projectName, branch, contentType, contentId],
        );

        return (
            <Link
                ref={ref}
                className={cn(
                    className,
                    'self-stretch px-2 text-alt [--color-link-visited:var(--color-blue)] active:bg-transparent data-[active=true]:bg-transparent',
                    compactIconBelowSm && 'max-sm:size-6 max-sm:self-start max-sm:p-0',
                )}
                href={href}
                aria-label={label}
                newTab
                data-component={componentName}
                {...props}
            >
                <span className="hidden md:inline">{label}</span>
                <LinkIcon className={cn('size-3.5 md:hidden', compactIconBelowSm && 'max-sm:size-4')} aria-hidden />
            </Link>
        );
    },
);

ContentReferencesLink.displayName = CONTENT_REFERENCES_LINK_NAME;

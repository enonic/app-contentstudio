import { cn } from '@enonic/ui';
import type { LucideIcon } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';
import { isColorableIconUrl } from './colorableIcon';

export type DescriptorIconProps = {
    iconUrl?: string;
    fallback: LucideIcon;
    strokeWidth?: number;
    retainPreviousIcon?: boolean;
    refreshVersion?: number;
    className?: string;
};

export const DescriptorIcon = ({
    iconUrl,
    fallback: Fallback,
    strokeWidth,
    retainPreviousIcon = false,
    refreshVersion,
    className,
}: DescriptorIconProps): ReactElement => {
    const [failedIcon, setFailedIcon] = useState<{ url: string; refreshVersion?: number }>();
    const [loadedIconUrl, setLoadedIconUrl] = useState<string>();
    const hasFailed = (url: string | undefined): boolean =>
        failedIcon != null && failedIcon.url === url && failedIcon.refreshVersion === refreshVersion;

    const visibleIconUrl = retainPreviousIcon && loadedIconUrl && iconUrl ? loadedIconUrl : iconUrl;
    const visibleIconFailed = hasFailed(visibleIconUrl);
    const showIcon = !visibleIconFailed || (retainPreviousIcon && !!loadedIconUrl);
    const isColorable = !!visibleIconUrl && isColorableIconUrl(visibleIconUrl);

    // A CSS mask never reports a failed load, so colorable icons are probed the same way as pending ones.
    const pendingIconUrl = retainPreviousIcon && loadedIconUrl && iconUrl !== loadedIconUrl ? iconUrl : undefined;
    const probedIconUrl = pendingIconUrl ?? (isColorable ? visibleIconUrl : undefined);
    const probedIconFailed = hasFailed(probedIconUrl);

    useEffect(() => {
        if (!probedIconUrl || probedIconFailed) {
            return;
        }

        const image = new Image();
        image.onload = () => {
            if (retainPreviousIcon) {
                setLoadedIconUrl(probedIconUrl);
            }
        };
        image.onerror = () => setFailedIcon({ url: probedIconUrl, refreshVersion });
        image.src = probedIconUrl;

        return () => {
            image.onload = null;
            image.onerror = null;
        };
    }, [probedIconUrl, probedIconFailed, retainPreviousIcon, refreshVersion]);

    if (visibleIconUrl && showIcon && isColorable) {
        return (
            <span
                aria-hidden="true"
                className={cn('inline-block bg-current mask-contain mask-center mask-no-repeat', className)}
                style={{ maskImage: `url("${visibleIconUrl}")` }}
            />
        );
    }

    if (visibleIconUrl && showIcon) {
        return (
            <img
                src={visibleIconUrl}
                alt=""
                draggable={false}
                className={cn('object-contain', className)}
                onLoad={() => {
                    if (retainPreviousIcon) {
                        setLoadedIconUrl(visibleIconUrl);
                    }
                }}
                onError={() => setFailedIcon({ url: visibleIconUrl, refreshVersion })}
            />
        );
    }

    return <Fallback aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
};

DescriptorIcon.displayName = 'DescriptorIcon';

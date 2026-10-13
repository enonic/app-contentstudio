import { cn } from '@enonic/ui';
import type { LucideIcon } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';

export type DescriptorIconProps = {
    iconUrl?: string;
    fallback: LucideIcon;
    className?: string;
    strokeWidth?: number;
    retainPreviousIcon?: boolean;
    refreshVersion?: number;
};

export const DescriptorIcon = ({
    iconUrl,
    fallback: Fallback,
    className,
    strokeWidth,
    retainPreviousIcon = false,
    refreshVersion,
}: DescriptorIconProps): ReactElement => {
    const [failedIcon, setFailedIcon] = useState<{ url: string; refreshVersion?: number }>();
    const [loadedIconUrl, setLoadedIconUrl] = useState<string>();
    const currentIconFailed =
        failedIcon != null && failedIcon.url === iconUrl && failedIcon.refreshVersion === refreshVersion;

    useEffect(() => {
        if (!retainPreviousIcon || !loadedIconUrl || !iconUrl || iconUrl === loadedIconUrl || currentIconFailed) {
            return;
        }

        const image = new Image();
        image.onload = () => setLoadedIconUrl(iconUrl);
        image.onerror = () => setFailedIcon({ url: iconUrl, refreshVersion });
        image.src = iconUrl;

        return () => {
            image.onload = null;
            image.onerror = null;
        };
    }, [retainPreviousIcon, loadedIconUrl, iconUrl, currentIconFailed, refreshVersion]);

    const visibleIconUrl = retainPreviousIcon && loadedIconUrl && iconUrl ? loadedIconUrl : iconUrl;
    const visibleIconFailed =
        failedIcon != null && failedIcon.url === visibleIconUrl && failedIcon.refreshVersion === refreshVersion;
    const showIcon = !visibleIconFailed || (retainPreviousIcon && !!loadedIconUrl);

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

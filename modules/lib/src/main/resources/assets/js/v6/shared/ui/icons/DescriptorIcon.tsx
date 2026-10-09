import { cn } from '@enonic/ui';
import type { LucideIcon } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';

export type DescriptorIconProps = {
    iconUrl?: string;
    fallback: LucideIcon;
    className?: string;
    strokeWidth?: number;
    retainPreviousIcon?: boolean;
    refreshToken?: object;
};

export const DescriptorIcon = ({
    iconUrl,
    fallback: Fallback,
    className,
    strokeWidth,
    retainPreviousIcon = false,
    refreshToken,
}: DescriptorIconProps): ReactElement => {
    const [failedIcon, setFailedIcon] = useState<{ url: string; refreshToken?: object }>();
    const [loadedIconUrl, setLoadedIconUrl] = useState<string>();
    const currentIconFailed =
        failedIcon != null && failedIcon.url === iconUrl && failedIcon.refreshToken === refreshToken;

    useEffect(() => {
        if (!retainPreviousIcon || !loadedIconUrl || !iconUrl || iconUrl === loadedIconUrl || currentIconFailed) {
            return;
        }

        const image = new Image();
        image.onload = () => setLoadedIconUrl(iconUrl);
        image.onerror = () => setFailedIcon({ url: iconUrl, refreshToken });
        image.src = iconUrl;

        return () => {
            image.onload = null;
            image.onerror = null;
        };
    }, [retainPreviousIcon, loadedIconUrl, iconUrl, currentIconFailed, refreshToken]);

    const visibleIconUrl = retainPreviousIcon && loadedIconUrl && iconUrl ? loadedIconUrl : iconUrl;
    const visibleIconFailed =
        failedIcon != null && failedIcon.url === visibleIconUrl && failedIcon.refreshToken === refreshToken;

    if (visibleIconUrl && (retainPreviousIcon && loadedIconUrl ? true : !visibleIconFailed)) {
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
                onError={() => setFailedIcon({ url: visibleIconUrl, refreshToken })}
            />
        );
    }

    return <Fallback aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
};

DescriptorIcon.displayName = 'DescriptorIcon';

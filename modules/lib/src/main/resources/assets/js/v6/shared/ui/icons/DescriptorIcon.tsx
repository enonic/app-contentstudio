import { cn } from '@enonic/ui';
import type { LucideIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

export type DescriptorIconProps = {
    iconUrl?: string;
    fallback: LucideIcon;
    className?: string;
    strokeWidth?: number;
};

export const DescriptorIcon = ({
    iconUrl,
    fallback: Fallback,
    className,
    strokeWidth,
}: DescriptorIconProps): ReactElement => {
    const [failedIconUrl, setFailedIconUrl] = useState<string>();

    if (iconUrl && iconUrl !== failedIconUrl) {
        return (
            <img
                src={iconUrl}
                alt=""
                draggable={false}
                className={cn('object-contain', className)}
                onError={() => setFailedIconUrl(iconUrl)}
            />
        );
    }

    return <Fallback aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
};

DescriptorIcon.displayName = 'DescriptorIcon';

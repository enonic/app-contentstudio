import type { HTMLAttributeReferrerPolicy, TargetedEvent } from 'react';

type ImageProps = {
    className?: string;
    src: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    loading?: 'eager' | 'lazy';
    decoding?: 'async' | 'auto' | 'sync';
    referrerPolicy?: HTMLAttributeReferrerPolicy;
    onError?: (event: TargetedEvent<HTMLImageElement>) => void;
};

export const Image = ({
    src,
    alt,
    className,
    width,
    height,
    loading = 'eager',
    decoding = 'async',
    referrerPolicy = 'no-referrer',
    onError,
}: ImageProps): React.ReactElement => (
    <img
        className={className}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        referrerPolicy={referrerPolicy}
        src={src}
        onError={onError}
    />
);

Image.displayName = 'Image';

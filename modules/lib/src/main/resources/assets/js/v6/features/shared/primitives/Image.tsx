type ImageProps = {
    className?: string;
    src: string;
} & Pick<React.ImgHTMLAttributes, 'alt' | 'width' | 'height' | 'loading' | 'decoding' | 'referrerPolicy' | 'onError'>;

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

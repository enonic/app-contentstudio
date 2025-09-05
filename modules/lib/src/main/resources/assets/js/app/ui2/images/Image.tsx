import type {JSX} from 'react';

type ImgProps = JSX.IntrinsicElements['img'];

type ImageProps = {
    src: string;
    alt?: string;
    className?: string;
    width?: number;
    height?: number;
    loading?: ImgProps['loading'];
    decoding?: ImgProps['decoding'];
    referrerPolicy?: ImgProps['referrerPolicy'];
    onError?: ImgProps['onError'];      // ✅ cross-compatible
};

export const Image = ({
                          src,
                          alt = '',
                          className,
                          width,
                          height,
                          loading = 'eager',
                          decoding = 'async',
                          referrerPolicy = 'no-referrer',
                          onError,
                      }: ImageProps): JSX.Element => (
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

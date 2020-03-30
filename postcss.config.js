const isProd = process.env.NODE_ENV === 'production';

const plugins = Object.assign(
    {
        'postcss-normalize': {},
        autoprefixer: {},
        'postcss-sort-media-queries': {sort: 'desktop-first'}
    },
    isProd ? {cssnano: {}} : {}
);

module.exports = {plugins};

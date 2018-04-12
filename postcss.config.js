const isProd = process.env.NODE_ENV === 'production';

const plugins = Object.assign(
    {
        "postcss-normalize": {},
        autoprefixer: {},
        "css-mqpacker": {}
    },
    isProd ? {cssnano: {}} : {}
);

module.exports = {plugins};

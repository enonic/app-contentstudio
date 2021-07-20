class MiniCssExtractPluginCleanup {
    constructor(patterns) {
        this.patterns = patterns;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('MiniCssExtractPluginCleanup', (compilation, callback) => {
            Object.keys(compilation.assets).filter((asset) => {
                let i = this.patterns.length;
                while (i--) {
                    if (this.patterns[i].test(asset)) {
                        return true;
                    }
                }
                return false;
            }).forEach(asset => {
                delete compilation.assets[asset];
            });

            callback();
        });
    }
}

module.exports = MiniCssExtractPluginCleanup;

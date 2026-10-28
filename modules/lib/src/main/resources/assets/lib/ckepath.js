(() => {
    const script = document.currentScript;

    if (!script) {
        throw 'Legacy browsers are not supported';
    }

    const src = script.src;

    if (!/\/ckeditor\.js(\?.*)?$/.test(src)) {
        throw 'Unable to init cke basepath';
    }

    window.CKEDITOR_BASEPATH = src.replace(/\/ckeditor\.js(\?.*)?$/, '/ckeditor/');
})();

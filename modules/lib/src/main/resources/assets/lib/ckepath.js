(() => {
    if (!document.currentScript) {
        throw 'Legacy browsers are not supported';
    }

    const assetsPath = document.currentScript.getAttribute('data-asset-url');
    const ckeBasePath =`${assetsPath}/lib/ckeditor`;

    if (!ckeBasePath) {
        throw 'Unable to init cke basepath';
    }

    window.CKEDITOR_BASEPATH = `${ckeBasePath}/`;
})();

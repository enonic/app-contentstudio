import {initPreview} from '@enonic/page-editor';

initPreview(window.parent, {
    hostDomain: `${window.location.protocol}//${window.location.host}`,
});

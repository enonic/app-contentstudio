import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SagaHtmlEditorEventData} from '../../../../js/app/inputtype/ui/text/HtmlEditor';

let stylesLoaded = false;
const getStylesUrl = (path: string) => CKEDITOR.getUrl(CKEDITOR.plugins.get('saga').path + `styles/${path}`);

CKEDITOR.plugins.add('saga', {
    requires: 'button',
    beforeInit: function () {
        if (!stylesLoaded) {
            CKEDITOR.document.appendStyleSheet(getStylesUrl('plugin.css'));
            stylesLoaded = true;
        }
    },
    init: function (editor) {
        // Define the content of the panel

        // Panel toggle command
        editor.addCommand('openSaga', new CKEDITOR.command(editor, {
            exec: (editor): boolean => {
                editor.fire('openSaga', null, editor);
                return true;
            },
        }));

        // Create the panel button.
        editor.ui.add('Saga', new String(CKEDITOR.UI_BUTTON), {
            className: 'cke_button__openSaga icomoon icon-sparkling',
            label: i18n('action.saga'),
            command: 'openSaga',
        });
    }
});

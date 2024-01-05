import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {SagaHtmlEditorEventData} from '../../../../js/app/inputtype/ui/text/HtmlEditor';

let stylesLoaded = false;
const getStylesUrl = (path: string) => CKEDITOR.getUrl(CKEDITOR.plugins.get('saga').path + `styles/${path}`);

const getData = (editor: CKEDITOR.editor): SagaHtmlEditorEventData => {
    const text = editor.document.getBody().getText();
    const html = editor.getData();

    const selection = editor.getSelection();
    const ranges = selection?.getRanges();
    const hasSelection = ranges?.length > 0;
    if (!hasSelection) {
        return {text, html};
    }

    const range = ranges[0];

    const clonedSelection = range.cloneContents();
    const div = new CKEDITOR.dom.element('div');
    div.append(clonedSelection);

    return {
        text,
        html,
        selection: {
            startOffset: range.startOffset,
            endOffset: range.endOffset,
            text: selection.getSelectedText(),
            html: div.getHtml(),
        }
    };
};

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
                editor.fire('openSaga', getData(editor), editor);
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

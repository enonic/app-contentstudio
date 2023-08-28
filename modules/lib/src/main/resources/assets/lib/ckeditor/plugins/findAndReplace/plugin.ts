import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Instance, Mode} from './data/instance';
import markup from './view/markup';
import {getStylesUrl} from './view/resources';

const INSTANCES: Record<string, Instance> = {};

let stylesLoaded = false;

CKEDITOR.plugins.add('findAndReplace', {
    requires: 'panelbutton',
    // icons: 'find,replace', // Icons must match command names
    beforeInit: function () {
        if (!stylesLoaded) {
            CKEDITOR.document.appendStyleSheet(getStylesUrl('plugin.css'));
            stylesLoaded = true;
        }
    },
    init: function (editor) {
        // Define the content of the panel

        // Panel toggle command
        editor.addCommand('toggleFind', new CKEDITOR.command(editor, {
            exec: (editor) => {
                const plugin = editor.ui.get('FindAndReplace');
                INSTANCES[plugin._.id]?.updateMode(Mode.FIND);
                plugin.click(editor);
                return true;
            },
        }));
        editor.addCommand('toggleFindAndReplace', new CKEDITOR.command(editor, {
            exec: (editor) => {
                const plugin = editor.ui.get('FindAndReplace');
                INSTANCES[plugin._.id]?.updateMode(Mode.REPLACE);
                plugin.click(editor);
                return true;
            },
        }));

        const parent = editor.element.getParent().findOne('.sticky-dock') ||
                       editor.element.getDocument().findOne('body.xp-page-editor-page-view');

        // Create the panel button.
        editor.ui.add('FindAndReplace', new String(CKEDITOR.UI_PANELBUTTON), {
            label: i18n('dialog.search.title'),
            command: 'toggleFind',
            icon: 'find',
            editorFocus: 1,
            panel: {
                attributes: {
                    'aria-label': i18n('dialog.search.title'),
                    title: '',
                },
                css: [
                    CKEDITOR.skin.getPath('editor'),
                    getStylesUrl('panel.css'),
                ],
                className: 'fnr-panel',
                block: {
                    attributes: {
                        'aria-label': i18n('dialog.search.title'),
                        title: '',
                    },
                    buttons: [],
                    markup,
                },
                parent,
            },
            onBlock: function (panel, block) {
                block.element.setHtml(markup);
                const id = this._.id;

                INSTANCES[id] = new Instance({
                    id,
                    editor,
                    panel: panel.element,
                    block: block.element,
                });

                INSTANCES[this._.id]?.prepare();
            },
            onOpen: function () {
                INSTANCES[this._.id]?.selectHighlightAndRender(0);
                INSTANCES[this._.id]?.prepare();

                INSTANCES[this._.id]?.removeHighlights();
                INSTANCES[this._.id]?.search();
            },
            onClose: function () {
                INSTANCES[this._.id]?.reset();
            },
            toolbar: 'find,1',
            allowedContent: 'input[type]; button; div',
            requiredContent: 'input[type]; button; div'
        });
    }
});

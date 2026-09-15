import { i18n } from '@enonic/lib-admin-ui/util/Messages';

CKEDITOR.plugins.add('pasteModeSwitcher', {
    init: function (editor) {
        var pasteTextOnly = false;
        var skipNextBeforePasteEvent = false;

        editor.addCommand('switchPasteMode', {
            exec: function (editor) {
                pasteTextOnly = !pasteTextOnly;
                editor
                    .getCommand('switchPasteMode')
                    .setState(pasteTextOnly ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
                var tooltipText = pasteTextOnly
                    ? i18n('tooltip.editor.pastemode.plain')
                    : i18n('tooltip.editor.pastemode.formatted');
                replaceTooltip(tooltipText);

                return true;
            },
            contextSensitive: false,
        });

        function replaceTooltip(tooltipText) {
            var uiItem = editor.getCommand('switchPasteMode').uiItems[0];
            var toolbarButton = uiItem ? document.getElementById(uiItem._.id) : null;

            if (toolbarButton && toolbarButton.title) {
                toolbarButton.title = tooltipText;
            }
        }

        editor.ui.addButton('PasteModeSwitcher', {
            label: i18n('tooltip.editor.pastemode.formatted'),
            toolbar: 'tools,10',
            command: 'switchPasteMode',
            icon: 'pastetext',
        });

        function isFilePasted(evt) {
            return !!evt.data.dataTransfer && evt.data.dataTransfer.getFilesCount() > 0;
        }

        editor.on('beforePaste', function (evt) {
            if (pasteTextOnly && !isFilePasted(evt)) {
                if (!skipNextBeforePasteEvent) {
                    skipNextBeforePasteEvent = true;
                    evt.editor.disableNotification = true;
                    evt.editor.execCommand('pastetext', evt.data);
                    evt.editor.disableNotification = false;
                } else {
                    skipNextBeforePasteEvent = false;
                }
            }
        });
    },
});

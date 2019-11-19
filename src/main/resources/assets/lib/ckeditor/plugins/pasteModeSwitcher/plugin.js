CKEDITOR.plugins.add('pasteModeSwitcher', {
    init: function (editor) {

        var pasteTextOnly = false;
        var skipNextBeforePasteEvent = false;

        editor.addCommand('switchPasteMode', {
            exec: function (editor) {
                pasteTextOnly = !pasteTextOnly;
                editor.getCommand('switchPasteMode').setState(pasteTextOnly ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
                var tooltipText = pasteTextOnly ? api.util.i18n('tooltip.editor.pastemode.plain') :
                                                    api.util.i18n('tooltip.editor.pastemode.formatted');
                replaceTooltip(tooltipText);

                return true;
            },

            contextSensitive: false
        });

        function replaceTooltip(tooltipText) {
            var toolbarButton = document.getElementById(editor.getCommand('switchPasteMode').uiItems[0]._.id);

            if (toolbarButton.title) {
                toolbarButton.title = tooltipText;
            }

            var tooltipId = '#' + api.StyleHelper.getCls('tooltip', api.StyleHelper.COMMON_PREFIX);
            if (!wemjq(tooltipId).length) {
                return;
            }
            wemjq(toolbarButton).data('_tooltip', tooltipText);
            wemjq(tooltipId).text(tooltipText);
        }

        editor.ui.addButton('PasteModeSwitcher', {
            label: api.util.i18n('tooltip.editor.pastemode.formatted'),
            toolbar: 'tools,10',
            command: 'switchPasteMode',
            icon: 'pastetext'
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
                    return;
                } else {
                    skipNextBeforePasteEvent = false;
                }
            }

        });
    }
});

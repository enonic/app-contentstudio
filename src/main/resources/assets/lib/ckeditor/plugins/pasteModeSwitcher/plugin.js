CKEDITOR.plugins.add('pasteModeSwitcher', {
    init: function (editor) {

        var pasteTextOnly = false;
        var skipNextBeforePasteEvent = false;

        editor.addCommand('switchPasteMode', {
            exec: function (editor) {
                pasteTextOnly = !pasteTextOnly;
                editor.getCommand('switchPasteMode').setState(pasteTextOnly ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
                return true;
            },

            contextSensitive: false
        });


        editor.ui.addButton('PasteModeSwitcher', {
            label: 'Switch paste mode',
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

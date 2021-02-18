CKEDITOR.plugins.add('macro', {
    init: function (editor) {

        var selectedMacro = null;
        var selectedElement = null;
        var selectionRange = null;

        var refresh = function (editor, path) {
            selectedMacro = null;
            selectedElement = path.lastElement;
            selectionRange = editor.getSelection().getRanges()[0];

            doRefresh();

            editor.getCommand('openMacroDialogNative').setState(!!selectedMacro ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
        };

        editor.addCommand('openMacroDialogNative', {
            exec: function (editor) {
                editor.execCommand('openMacroDialog', selectedMacro);
                return true;
            },

            refresh: refresh,

            contextSensitive: 1
        });

        editor.on('doubleclick', function () {
            if (selectedMacro != null) {
                editor.execCommand('openMacroDialog', selectedMacro);
            }
        });

        editor.ui.addButton('Macro', {
            icon: CKEDITOR.plugins.getPath('macro') + '/icons/macro.png',
            label: 'Insert macro',
            toolbar: 'tools,10',
            command: 'openMacroDialogNative'
        });

        /**
         *  selectionChange() event is triggered by CKE only when selected element changes (for performance purposes)
         *  thus selection change within same element doesn't trigger our refresh() method;
         *  Handling clicks/navigation keys within same element ourselves and triggering selectionChange()
         */
        editor.on('instanceReady', function () {
            editor.editable().on('click', function () {
                if (isSameElementSelected()) {
                    triggerRefresh();
                }
            });

            editor.on('key', function (e) {
                var key = e.data.keyCode;
                var isNavigationKeyPressed = key === 37 || key === 38 || key === 39 || key === 40; // navigation keys: left, top, right, bottom

                if (!isNavigationKeyPressed) {
                    return;
                }

                if (isSameElementSelected()) {
                    triggerRefresh();
                }
            });
        });

        function doRefresh() {
            if (!selectedElement || !selectionRange.startContainer.equals(selectionRange.endContainer)) {
                return;
            }

            checkMacroWithBodySelected();

            if (!!selectedMacro) {
                return;
            }

            checkMacroNoBodySelected();
        }

        function makeMakroObject(regexResult) {
            var regexMacroAttributes = /([\w]+)(?:\s*=\s*")([^"]+)(?:")/g;
            var attributes = [];
            var attributesString = regexResult[0].match(/\[(.*?)\]/)[1];

            var attrs;
            while (attrs = regexMacroAttributes.exec(attributesString)) {
                attributes.push([attrs[1], attrs[2]]);
            }

            var result = {
                macroText: regexResult[0],
                name: regexResult[1],
                attributes: attributes,
                element: selectedElement
            };

            return result;
        }

        function checkMacroWithBodySelected() {
            var regexMacroWithBody = /\[(\w+)\s?.*?\](.+?)\[\/(\w+)\]/g;

            var result;
            while (result = regexMacroWithBody.exec(selectedElement.getText())) {
                if (result[1] === result[3] && isSelectionWithinMacro(result)) {
                    selectedMacro = makeMakroObject(result);
                    selectedMacro.body = result[2];
                    break;
                }
            }
        }

        function checkMacroNoBodySelected() {
            var regexMacroNoBody = /\[(\w+)\s.+?\/\]/g;

            var result;
            while (result = regexMacroNoBody.exec(selectedElement.getText())) {
                if (isSelectionWithinMacro(result)) {
                    selectedMacro = makeMakroObject(result);
                    break;
                }
            }
        }

        function isSelectionWithinMacro(macroRegexResult) {
            return selectionRange.startOffset > macroRegexResult.index && selectionRange.endOffset <
                   (macroRegexResult.index + macroRegexResult[0].length);
        }

        function isSameElementSelected() {
            return editor.elementPath().lastElement.equals(selectedElement);
        }

        function triggerRefresh() {
            refresh(editor, editor.elementPath());
        }
    }
});
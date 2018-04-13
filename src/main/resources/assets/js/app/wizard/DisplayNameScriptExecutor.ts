import '../../api.ts';

export class DisplayNameScriptExecutor implements api.app.wizard.DisplayNameGenerator {

    private formView: api.form.FormView;

    private script: string;

    setFormView(value: api.form.FormView): DisplayNameScriptExecutor {
        this.formView = value;
        return this;
    }

    setScript(value: string): DisplayNameScriptExecutor {
        this.script = value;
        return this;
    }

    hasScript(): boolean {
        return !api.util.StringHelper.isBlank(this.script);
    }

    execute(): string {
        api.util.assertNotNull(this.formView, 'formView not set');
        api.util.assertNotNull(this.script, 'script not set');

        return this.safeEval(this.script, this.formView);
    }

    private safeEval(script: string, formView: api.form.FormView): string {
        let result = '';
        function $() {
            let strValue = '';
            for (let i = 0; i < arguments.length; i++) {
                const fieldValue = formView.getData().getString(arguments[i]);
                if (!api.util.StringHelper.isBlank(fieldValue)) {
                    if (strValue.length > 0) {
                        strValue += ' ';
                    }
                    strValue += fieldValue;
                }
            }
            return strValue;
        }
        try {
            // hide eval, Function, document, window and other things from the script.
            result = eval('"strict mode"; var Function; var document; var location; ' +
                          'var window; var parent; var self; var top; ' +
                          script);
        } catch (e) {
            console.error('Cannot evaluate script [' + script + '].', e);
        }

        return result;
    }
}

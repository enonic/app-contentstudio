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

    private getFormValues(formView: api.form.FormView): string {
        return formView.getData().getStringValues().map(formValue => `var ${formValue.name} = '${formValue.value}'; `).join('');
    }

    private safeEval(script: string, formView: api.form.FormView): string {
        let result = '';

        try {
            // hide eval, Function, document, window and other things from the script.
            result = eval('"strict mode"; var Function; var document; var location; ' +
                          'var window; var parent; var self; var top; ' +
                          this.getFormValues(formView) +
                          '`' + script + '`');
        } catch (e) {
            console.error('Cannot evaluate script [' + script + '].', e);
        }

        return result;
    }
}

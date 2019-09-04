import '../../api.ts';

export class DisplayNameResolver implements api.app.wizard.DisplayNameGenerator {

    private formView: api.form.FormView;

    private expression: string;

    setFormView(value: api.form.FormView): DisplayNameResolver {
        this.formView = value;
        return this;
    }

    setExpression(value: string): DisplayNameResolver {
        this.expression = value;
        return this;
    }

    hasExpression(): boolean {
        return !api.util.StringHelper.isBlank(this.expression);
    }

    execute(): string {
        api.util.assertNotNull(this.formView, 'formView not set');
        api.util.assertNotNull(this.expression, 'expression not set');

        return this.safeEval(this.expression, this.formView);
    }

    private sanitizeFieldValue(value: string) {
        let result = value;
        result = result.replace(/(<([^>]+)>)/ig,"");    // Strip HTML tags
        result = result.replace(/(\r\n|\n|\r)/gm,"");   // Strip linebreaks

        return result;
    }

    private getFormValues(formView: api.form.FormView): string {
        return formView.getData().getStringValues().map(formValue => `var ${formValue.name} = '${this.sanitizeFieldValue(formValue.value)}'; `).join('');
    }

    private safeEval(expression: string, formView: api.form.FormView): string {
        const script = '"use strict";' +
                       this.getFormValues(formView) +
                       '`' + expression + '`.replace(/\\s+/g, \' \')';

        let result = '';

        try {
            result = eval(script);
        } catch (e) {
            console.error('Cannot evaluate script [' + script + '].', e);
        }

        return result;
    }
}

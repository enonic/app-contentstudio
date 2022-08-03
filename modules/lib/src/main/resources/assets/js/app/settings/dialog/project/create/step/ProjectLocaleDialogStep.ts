import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LocaleComboBox} from '../../../../../locale/LocaleComboBox';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {LocaleFormItem} from '../../../../wizard/panel/form/element/LocaleFormItem';

export class ProjectLocaleDialogStep
    extends ProjectDialogStep {

    protected createFormItems(): FormItem[] {
        return [new LocaleFormItem()];
    }

    isOptional(): boolean {
        return true;
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getLocaleCombobox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    getData(): Object {
        return {
            locale: this.getLocaleCombobox().getValue()
        };
    }

    hasData(): boolean {
        return !!this.getLocaleCombobox().getValue();
    }

    getSelectedLocale(): Locale {
        return this.getLocaleCombobox().getSelectedDisplayValues()[0];
    }

    protected getFormClass(): string {
        return 'project-language-step';
    }

    getName(): string {
        return 'projectLanguage';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.language.description');
    }

    private getLocaleCombobox(): LocaleComboBox {
        return (<LocaleFormItem>this.formItems[0]).getLocaleCombobox();
    }
}

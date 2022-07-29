import {ProjectsComboBox} from '../wizard/panel/form/element/ProjectsComboBox';
import {ProjectFormItem, ProjectFormItemBuilder} from '../wizard/panel/form/element/ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectDialogStep} from './ProjectDialogStep';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';

export class ProjectSummaryStep
    extends ProjectDialogStep {


    protected createFormItems(): FormItem[] {
        return [];
    }



    isOptional(): boolean {
        return true;
    }

    getData(): Object {
        return {

        };
    }

    hasData(): boolean {
        return true;
    }

}

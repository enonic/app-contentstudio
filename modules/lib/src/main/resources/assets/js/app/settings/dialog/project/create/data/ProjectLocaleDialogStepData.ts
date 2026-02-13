import {ProjectDialogStepData} from './ProjectDialogStepData';
import {type Locale} from '@enonic/lib-admin-ui/locale/Locale';

export class ProjectLocaleDialogStepData
    extends ProjectDialogStepData {

    private locale: Locale;

    setLocale(value: Locale): ProjectLocaleDialogStepData {
        this.locale = value;
        return this;
    }

    getLocale(): Locale {
        return this.locale;
    }
}

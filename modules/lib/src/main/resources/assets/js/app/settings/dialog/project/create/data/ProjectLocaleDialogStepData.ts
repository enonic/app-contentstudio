import {ProjectDialogStepData} from './ProjectDialogStepData';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';

export class ProjectLocaleDialogStepData
    extends ProjectDialogStepData {

    private locale: Locale;

    private timeZone: string;

    setLocale(value: Locale): ProjectLocaleDialogStepData {
        this.locale = value;
        return this;
    }

    setTimeZone(value: string): ProjectLocaleDialogStepData {
        this.timeZone = value;
        return this;
    }

    getLocale(): Locale {
        return this.locale;
    }

    getTimeZone(): string {
        return this.timeZone;
    }
}

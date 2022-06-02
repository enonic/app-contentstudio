import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {NamesView} from '@enonic/lib-admin-ui/app/NamesView';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class LocaleViewer
    extends Viewer<Locale> {

    private readonly namesView: NamesView;

    private displayNamePattern: string = '{0} ({1})';

    constructor(className?: string) {
        super(className);
        this.namesView = new NamesView();
        this.appendChild(this.namesView);
    }

    setObject(locale: Locale) {
        this.namesView.setMainName(
            StringHelper.format(this.displayNamePattern, locale.getDisplayName(), locale.getProcessedTag()));

        return super.setObject(locale);
    }

}

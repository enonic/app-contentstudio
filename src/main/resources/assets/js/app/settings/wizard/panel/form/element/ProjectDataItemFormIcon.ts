import {SettingsDataItemFormIcon} from './SettingsDataItemFormIcon';
import {Flag} from 'lib-admin-ui/locale/Flag';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';

export class ProjectDataItemFormIcon extends SettingsDataItemFormIcon {

    private flag: Flag;

    constructor(item?: ProjectViewItem) {
        super(!!item ? item.getIconUrl() : null);

        this.flag = new Flag(!!item ? item.getLanguage() : null);
        this.toggleClass('has-lang', !!item && !!item.getLanguage());
    }

    updateLanguage(language: string) {
        this.flag.updateCountryCode(language);
        this.toggleClass('has-lang', !!language);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.flag);

            return rendered;
        });
    }

}

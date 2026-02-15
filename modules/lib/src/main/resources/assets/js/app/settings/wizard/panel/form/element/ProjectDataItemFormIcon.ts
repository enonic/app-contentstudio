import {SettingsDataItemFormIcon} from './SettingsDataItemFormIcon';
import {type ProjectViewItem} from '../../../../view/ProjectViewItem';
import {Flag} from '../../../../../locale/Flag';

export class ProjectDataItemFormIcon extends SettingsDataItemFormIcon {

    private readonly flag: Flag;

    constructor(item?: ProjectViewItem) {
        super(item ? item.getIconUrl() : null);

        this.flag = new Flag(item ? item.getLanguage() : null);
        this.toggleClass('has-lang', !!item && !!item.getLanguage());
    }

    updateLanguage(language: string): void {
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

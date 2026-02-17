import {StatisticsBlock} from '../StatisticsBlock';
import {StatisticsBlockColumn} from '../StatisticsBlockColumn';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TextListBox} from '../TextListBox';
import {type ProjectViewItem} from '../../../../view/ProjectViewItem';
import {PrincipalsListBox} from '../PrincipalsListBox';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {GetPrincipalsByKeysRequest} from '../../../../../security/GetPrincipalsByKeysRequest';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {type Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ProjectHelper} from '../../../../data/project/ProjectHelper';
import {GetLocalesRequest} from '../../../../../resource/GetLocalesRequest';

export class ProjectMetaStatisticsBlock extends StatisticsBlock {

    private langColumn: StatisticsBlockColumn;

    private accessModeColumn: StatisticsBlockColumn;

    private canReadColumn: StatisticsBlockColumn;

    private locales: Locale[];

    declare protected item: ProjectViewItem;

    constructor() {
        super();

        new GetLocalesRequest().sendAndParse().then((locales: Locale[]) => {
            this.locales = locales;

            if (this.item) {
                this.langColumn.setItems(this.getLanguage());
            }
        }).catch(DefaultErrorHandler.handle);
    }

    protected createColumns(): StatisticsBlockColumn[] {
        this.langColumn = new StatisticsBlockColumn(i18n('field.lang'), new TextListBox());
        this.accessModeColumn = new StatisticsBlockColumn(i18n('dialog.projectAccess'), new TextListBox());
        this.canReadColumn = new StatisticsBlockColumn(i18n('settings.statistics.canread'), new PrincipalsListBox());

        return [this.langColumn, this.accessModeColumn, this.canReadColumn];
    }

    protected getHeaderText(): string {
        return i18n('field.content');
    }

    setItem(item: ProjectViewItem) {
        super.setItem(item);

        this.langColumn.setItems(this.getLanguage());
        this.accessModeColumn.setItems(this.getAccessMode());
        this.canReadColumn.setItems([]);

        if (!ProjectHelper.isAvailable(item.getData())) {
            this.hide();
        } else {
            this.show();
            this.fetchAndSetCanReadPrincipals();
        }
    }

    private getLanguage(): string[] {
        const itemLang: string = this.item.getLanguage();

        if (!itemLang) {
            return [];
        }

        if (this.locales) {
            const locale: Locale = this.locales.find((l: Locale) => l.getProcessedTag() === itemLang);

            if (locale) {
                return [`${locale.getDisplayName()} (${locale.getProcessedTag()})`];
            }
        }

        return [this.item.getLanguage()];
    }

    private getAccessMode(): string[] {
        if (!ProjectHelper.isAvailable(this.item.getData())) {
            return [];
        }

        return [i18n(`settings.items.wizard.readaccess.${this.item.getReadAccess().getType()}`)];
    }

    private fetchAndSetCanReadPrincipals() {
        if (!ProjectHelper.isAvailable(this.item.getData())) {
            return;
        }

        const canReadPrincipalsKeys: PrincipalKey[] = this.item.getReadAccess().getPrincipalsKeys();

        if (canReadPrincipalsKeys.length === 0) {
            return;
        }

        new GetPrincipalsByKeysRequest(canReadPrincipalsKeys).sendAndParse().then((principals: Principal[]) => {
            this.canReadColumn.setItems(principals);
        }).catch(DefaultErrorHandler.handle);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('meta-stats-block');
            return rendered;
        });
    }
}

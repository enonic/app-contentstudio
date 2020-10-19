import {StatisticsBlock} from '../StatisticsBlock';
import {StatisticsBlockColumn} from '../StatisticsBlockColumn';
import {i18n} from 'lib-admin-ui/util/Messages';
import {TextListBox} from '../TextListBox';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import {PrincipalsListBox} from '../PrincipalsListBox';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {GetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';
import {Principal} from 'lib-admin-ui/security/Principal';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Locale} from 'lib-admin-ui/locale/Locale';
import {GetLocalesRequest} from 'lib-admin-ui/locale/GetLocalesRequest';

export class ProjectMetaStatisticsBlock extends StatisticsBlock {

    private langColumn: StatisticsBlockColumn;

    private accessModeColumn: StatisticsBlockColumn;

    private canReadColumn: StatisticsBlockColumn;

    private locales: Locale[];

    protected item: ProjectViewItem;

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
        this.accessModeColumn.setItems([i18n(`settings.items.wizard.readaccess.${item.getReadAccess().getType()}`)]);
        this.canReadColumn.setItems([]);

        this.fetchAndSetCanReadPrincipals();
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

    private fetchAndSetCanReadPrincipals() {
        const canReadPrincipalsKeys: PrincipalKey[] = this.item.getReadAccess().getPrincipals();

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

import {StatisticsBlock} from '../StatisticsBlock';
import {StatisticsBlockColumn} from '../StatisticsBlockColumn';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import {PrincipalsListBox} from '../PrincipalsListBox';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {GetPrincipalsByKeysRequest} from '../../../../../security/GetPrincipalsByKeysRequest';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ProjectHelper} from '../../../../data/project/ProjectHelper';

export class ProjectRolesStatisticsBlock extends StatisticsBlock {

    private ownersColumn: StatisticsBlockColumn;

    private editorsColumn: StatisticsBlockColumn;

    private authorsColumn: StatisticsBlockColumn;

    private contributorsColumn: StatisticsBlockColumn;

    protected item: ProjectViewItem;

    protected createColumns(): StatisticsBlockColumn[] {
        this.ownersColumn = new StatisticsBlockColumn(i18n('settings.statistics.owners'), new PrincipalsListBox());
        this.editorsColumn = new StatisticsBlockColumn(i18n('settings.statistics.editors'), new PrincipalsListBox());
        this.authorsColumn = new StatisticsBlockColumn(i18n('settings.statistics.authors'), new PrincipalsListBox());
        this.contributorsColumn = new StatisticsBlockColumn(i18n('settings.statistics.contributors'), new PrincipalsListBox());

        return [this.ownersColumn, this.editorsColumn, this.authorsColumn, this.contributorsColumn];
    }

    protected getHeaderText(): string {
        return i18n('settings.items.wizard.step.roles');
    }

    setItem(item: ProjectViewItem) {
        super.setItem(item);

        this.ownersColumn.setItems([]);
        this.editorsColumn.setItems([]);
        this.authorsColumn.setItems([]);
        this.contributorsColumn.setItems([]);

        if (item.isDefaultProject() || !ProjectHelper.isAvailable(item.getData())) {
            this.hide();
        } else {
            this.show();
            this.fetchAndSetPrincipals();
        }
    }

    private fetchAndSetPrincipals() {
        const ownersKeys: PrincipalKey[] = this.item.getPermissions().getOwners();
        const editorsKeys: PrincipalKey[] = this.item.getPermissions().getEditors();
        const authorsKeys: PrincipalKey[] = this.item.getPermissions().getAuthors();
        const contributorKeys: PrincipalKey[] = this.item.getPermissions().getContributors();

        const keysToFetch: PrincipalKey[] = [...ownersKeys, ...editorsKeys, ...authorsKeys, ...contributorKeys];

        if (keysToFetch.length === 0) {
            return;
        }

        new GetPrincipalsByKeysRequest(keysToFetch).sendAndParse().then((principals: Principal[]) => {
            if (ownersKeys.length > 0) {
                this.ownersColumn.setItems(this.filterPrincipals(principals, ownersKeys));
            }

            if (editorsKeys.length > 0) {
                this.editorsColumn.setItems(this.filterPrincipals(principals, editorsKeys));
            }

            if (authorsKeys.length > 0) {
                this.authorsColumn.setItems(this.filterPrincipals(principals, authorsKeys));
            }

            if (contributorKeys.length > 0) {
                this.contributorsColumn.setItems(this.filterPrincipals(principals, contributorKeys));
            }
        }).catch(DefaultErrorHandler.handle);
    }

    private filterPrincipals(principals: Principal[], keys: PrincipalKey[]): Principal[] {
        return principals.filter((p: Principal) => keys.some((key: PrincipalKey) => key.equals(p.getKey())));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('roles-stats-block');
            return rendered;
        });
    }

}

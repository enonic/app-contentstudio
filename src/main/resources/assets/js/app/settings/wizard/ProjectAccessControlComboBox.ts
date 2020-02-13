import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {ProjectAccessControlEntry} from '../access/ProjectAccessControlEntry';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalListJson} from 'lib-admin-ui/security/PrincipalListJson';
import {PrincipalJson} from 'lib-admin-ui/security/PrincipalJson';
import {SecurityResourceRequest} from 'lib-admin-ui/security/SecurityResourceRequest';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {ProjectACESelectedOptionsView} from './ProjectACESelectedOptionsView';

export class ProjectAccessControlComboBox
    extends RichComboBox<ProjectAccessControlEntry> {

    constructor() {
        const builder: RichComboBoxBuilder<ProjectAccessControlEntry> = new RichComboBoxBuilder<ProjectAccessControlEntry>()
            .setMaximumOccurrences(0)
            .setComboBoxName('principalSelector')
            .setLoader(new ProjectAccessControlEntryLoader())
            .setSelectedOptionsView(new ProjectACESelectedOptionsView())
            .setOptionDisplayValueViewer(new ProjectAccessControlEntryViewer())
            .setDelayedInputValueChangedHandling(500);

        super(builder);
    }

    onSelectedItemValueChanged(handler: () => void) {
        (<ProjectACESelectedOptionsView>this.getSelectedOptionView()).onItemValueChanged(handler);
    }
}

class ProjectAccessControlEntryViewer
    extends NamesAndIconViewer<ProjectAccessControlEntry> {

    resolveDisplayName(object: ProjectAccessControlEntry): string {
        return object.getPrincipalDisplayName();
    }

    resolveUnnamedDisplayName(object: ProjectAccessControlEntry): string {
        return object.getPrincipalTypeName();
    }

    resolveSubName(object: ProjectAccessControlEntry): string {
        return object.getPrincipalKey().toPath();
    }

    resolveIconClass(object: ProjectAccessControlEntry): string {
        switch (object.getPrincipal().getKey().getType()) {
        case PrincipalType.USER:
            return 'icon-user';
        case PrincipalType.GROUP:
            return 'icon-users';
        case PrincipalType.ROLE:
            return 'icon-masks';
        }

        return '';
    }
}

class FindPrincipalsRequest
    extends SecurityResourceRequest<PrincipalListJson, ProjectAccessControlEntry[]> {

    private searchQuery: string;

    getParams(): Object {
        return {
            query: this.searchQuery
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'principals');
    }

    sendAndParse(): Q.Promise<ProjectAccessControlEntry[]> {
        return this.send().then((response: JsonResponse<PrincipalListJson>) => {
            return response.getResult().principals.map((principalJson: PrincipalJson) => {
                return new ProjectAccessControlEntry(Principal.fromJson(principalJson));
            });
        });
    }

    setSearchQuery(query: string): FindPrincipalsRequest {
        this.searchQuery = query;
        return this;
    }
}

class ProjectAccessControlEntryLoader
    extends BaseLoader<PrincipalListJson, ProjectAccessControlEntry> {

    protected request: FindPrincipalsRequest;

    search(searchString: string): Q.Promise<ProjectAccessControlEntry[]> {
        this.request.setSearchQuery(searchString);
        return this.load();
    }

    protected createRequest(): FindPrincipalsRequest {
        return new FindPrincipalsRequest();
    }

    setSearchString(value: string) {
        super.setSearchString(value);
        this.request.setSearchQuery(value);
    }

}

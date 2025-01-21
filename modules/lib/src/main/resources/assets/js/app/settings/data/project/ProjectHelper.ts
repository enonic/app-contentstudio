import {Project} from './Project';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ProjectGetRequest} from '../../resource/ProjectGetRequest';
import {ProjectContext} from '../../../project/ProjectContext';
import * as Q from 'q';
import {ProjectPermissions} from './ProjectPermissions';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';

export class ProjectHelper {

    public static isUserProjectOwnerOrEditor(): Q.Promise<boolean> {
        return new ProjectGetRequest(ProjectContext.get().getProject().getName()).sendAndParse().then((project: Project) => {
            return Q(ProjectHelper.isProjectOwnerOrEditor(project));
        });
    }

    public static isUserProjectOwner(project?: Project): Q.Promise<boolean> {
        return new ProjectGetRequest(project?.getName() || ProjectContext.get().getProject().getName())
            .sendAndParse()
            .then((project: Project) => {
                return Q(ProjectHelper.isProjectOwner(project));
            });
    }

    private static isProjectOwnerOrEditor(project: Project): boolean {
        const userPrincipals: PrincipalKey[] = AuthContext.get().getPrincipals().map((principal) => principal.getKey());
        const permissions: ProjectPermissions = project.getPermissions();
        const owners: PrincipalKey[] = permissions.getOwners();
        const editors: PrincipalKey[] = permissions.getEditors();

        return userPrincipals.some((userPrincipal: PrincipalKey) =>
            owners.some((owner: PrincipalKey) => owner.equals(userPrincipal)) ||
            editors.some((editor: PrincipalKey) => editor.equals(userPrincipal)));
    }

    static isProjectOwner(project: Project): boolean {
        const permissions: ProjectPermissions = project.getPermissions();
        const owners: PrincipalKey[] = permissions.getOwners();
        const thisUser: PrincipalKey = AuthContext.get().getUser().getKey();
        return owners.some((owner: PrincipalKey) => owner.equals(thisUser));
    }

    public static fetchProject(name: string): Q.Promise<Project> {
        return new ProjectGetRequest(name).sendAndParse().then((project: Project) => project);
    }

    public static sortProjects(item1: Project, item2: Project): number {
        return item1.getName().localeCompare(item2.getName());
    }

    public static isAvailable(project: Project): boolean {
        return !!project && !!project.getDisplayName();
    }
}

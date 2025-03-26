import {Project} from './Project';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ProjectGetRequest} from '../../resource/ProjectGetRequest';
import {ProjectContext} from '../../../project/ProjectContext';
import * as Q from 'q';
import {ProjectPermissions} from './ProjectPermissions';

export class ProjectHelper {

    public static readonly HIDE_DEFAULT_PROJ_PROP: string = 'hideDefaultProject';

    public static isUserProjectOwnerOrEditor(loginResult: LoginResult): Q.Promise<boolean> {
        return new ProjectGetRequest(ProjectContext.get().getProject().getName()).sendAndParse().then((project: Project) => {
            return Q(ProjectHelper.isProjectOwnerOrEditor(loginResult, project));
        });
    }

    public static isUserProjectOwner(loginResult: LoginResult, project?: Project): Q.Promise<boolean> {
        return new ProjectGetRequest(project?.getName() || ProjectContext.get().getProject().getName())
            .sendAndParse()
            .then((project: Project) => {
                return Q(ProjectHelper.isProjectOwner(loginResult, project));
            });
    }

    private static isProjectOwnerOrEditor(loginResult: LoginResult, project: Project): boolean {
        const userPrincipals: PrincipalKey[] = loginResult.getPrincipals();
        const permissions: ProjectPermissions = project.getPermissions();
        const owners: PrincipalKey[] = permissions.getOwners();
        const editors: PrincipalKey[] = permissions.getEditors();

        return userPrincipals.some((userPrincipal: PrincipalKey) =>
            owners.some((owner: PrincipalKey) => owner.equals(userPrincipal)) ||
            editors.some((editor: PrincipalKey) => editor.equals(userPrincipal)));
    }

    static isProjectOwner(loginResult: LoginResult, project: Project): boolean {
        const userPrincipals: PrincipalKey[] = loginResult.getPrincipals();
        const permissions: ProjectPermissions = project.getPermissions();
        const owners: PrincipalKey[] = permissions.getOwners();

        return userPrincipals.some((userPrincipal: PrincipalKey) => owners.some((owner: PrincipalKey) => owner.equals(userPrincipal)));
    }

    public static isDefault(project: Project): boolean {
        return project.getName() === Project.DEFAULT_PROJECT_NAME;
    }

    public static fetchProject(name: string): Q.Promise<Project> {
        return new ProjectGetRequest(name).sendAndParse().then((project: Project) => project);
    }

    public static sortProjects(item1: Project, item2: Project): number {
        if (ProjectHelper.isDefault(item1)) {
            return -1;
        }

        if (ProjectHelper.isDefault(item2)) {
            return 1;
        }

        return item1.getName().localeCompare(item2.getName());
    }

    public static isAvailable(project: Project): boolean {
        return !!project && !!project.getDisplayName();
    }
}

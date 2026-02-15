import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {type ProjectReadAccessType} from '../../../../data/project/ProjectReadAccessType';
import {ProjectDialogStepData} from './ProjectDialogStepData';

export class ProjectAccessDialogStepData
    extends ProjectDialogStepData {

    private access: ProjectReadAccessType;

    private principals: Principal[] = [];

    setAccess(value: ProjectReadAccessType): ProjectAccessDialogStepData {
        this.access = value;
        return this;
    }

    setPrincipals(principals: Principal[]): ProjectAccessDialogStepData {
        this.principals = principals || [];
        return this;
    }

    getAccess(): ProjectReadAccessType {
        return this.access;
    }

    getPrincipals(): Principal[] {
        return this.principals.slice(0);
    }
}

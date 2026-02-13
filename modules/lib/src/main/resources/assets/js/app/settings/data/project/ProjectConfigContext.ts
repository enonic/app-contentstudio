import {type ProjectConfig} from './ProjectConfig';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ProjectConfigRequest} from '../../resource/ProjectConfigRequest';
import type Q from 'q';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ProjectConfigContext {

    private static INSTANCE: ProjectConfigContext;

    private projectConfig: ProjectConfig;

    private constructor() {
    //
    }

    static get(): ProjectConfigContext {
        if (!ProjectConfigContext.INSTANCE) {
            ProjectConfigContext.INSTANCE = new ProjectConfigContext();
        }

        return ProjectConfigContext.INSTANCE;
    }

    getProjectConfig(): ProjectConfig | undefined {
        return this.projectConfig;
    }

    isInitialized(): boolean {
        return ObjectHelper.isDefined(this.projectConfig);
    }

    init(): Q.Promise<void> {
        return new ProjectConfigRequest().sendAndParse().then((projectConfig: ProjectConfig) => {
            this.projectConfig = projectConfig;
        }).catch(DefaultErrorHandler.handle);
    }
}

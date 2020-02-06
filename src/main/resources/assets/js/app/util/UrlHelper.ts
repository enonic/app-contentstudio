import {ProjectContext} from '../project/ProjectContext';

export class UrlHelper {

    static getCMSPath(): string {
        return `cms/${ProjectContext.get().getProject()}/base`;
    }

}

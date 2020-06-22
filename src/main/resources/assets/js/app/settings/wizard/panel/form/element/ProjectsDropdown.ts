import {RichDropdown} from 'lib-admin-ui/ui/selector/dropdown/RichDropdown';
import {Project} from '../../../../data/project/Project';
import {ProjectViewer} from '../../../viewer/ProjectViewer';
import * as Q from 'q';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ProjectGetRequest} from '../../../../resource/ProjectGetRequest';
import {ProjectsLoader} from './ProjectsLoader';
import {i18n} from 'lib-admin-ui/util/Messages';

export class ProjectsDropdown extends RichDropdown<Project> {

    constructor() {
        super({
            optionDisplayValueViewer: new ProjectViewer(),
            inputPlaceholderText: `<${i18n('settings.field.project.parent.notset')}>`,
            dataIdProperty: 'value'
        });
    }

    protected createLoader(): ProjectsLoader {
        return new ProjectsLoader();
    }

    protected createOption(project: Project): Option<Project> {
        return {value: project.getName(), displayValue: project};
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('parent-selector');

            return rendered;
        });
    }

    selectProjectByName(projectName: string) {
        if (!projectName) {
            return;
        }

        new ProjectGetRequest(projectName).sendAndParse().then((project: Project) => {
            this.selectOption(this.createOption(project));
        }).catch(DefaultErrorHandler.handle);
    }

    selectProject(project: Project) {
        if (!project) {
            return;
        }

        this.selectOption(this.createOption(project));
    }
}

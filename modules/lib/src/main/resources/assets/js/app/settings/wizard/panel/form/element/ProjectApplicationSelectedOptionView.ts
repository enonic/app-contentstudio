import {ProjectApplication} from './ProjectApplication';
import {ProjectApplicationViewer} from './ProjectApplicationViewer';
import {BaseSelectedOptionView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import * as Q from 'q';

export class ProjectApplicationSelectedOptionView
    extends BaseSelectedOptionView<ProjectApplication> {

    private projectApplicationViewer: ProjectApplicationViewer;

    doRender(): Q.Promise<boolean> {
        this.projectApplicationViewer = new ProjectApplicationViewer();
        this.projectApplicationViewer.setObject(this.getOption().getDisplayValue());
        this.appendChild(this.projectApplicationViewer);
        this.appendActionButtons();

        return Q.resolve();
    }
}

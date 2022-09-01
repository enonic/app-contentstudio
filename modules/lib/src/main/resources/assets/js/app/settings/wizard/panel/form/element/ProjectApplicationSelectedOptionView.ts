import {ProjectApplication} from './ProjectApplication';
import {BaseSelectedOptionView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import * as Q from 'q';
import {ProjectSelectedApplicationViewer} from './ProjectSelectedApplicationViewer';

export class ProjectApplicationSelectedOptionView
    extends BaseSelectedOptionView<ProjectApplication> {

    private projectApplicationViewer: ProjectSelectedApplicationViewer;

    doRender(): Q.Promise<boolean> {
        this.projectApplicationViewer = new ProjectSelectedApplicationViewer();
        this.projectApplicationViewer.setObject(this.getOption().getDisplayValue());
        this.appendChild(this.projectApplicationViewer);
        this.appendActionButtons();

        return Q.resolve();
    }
}

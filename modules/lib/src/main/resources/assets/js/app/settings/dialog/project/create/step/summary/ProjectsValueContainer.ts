import {SummaryValueContainer} from './SummaryValueContainer';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {type Project} from '../../../../../data/project/Project';

export class ProjectsValueContainer
    extends SummaryValueContainer {

    constructor() {
        super('projects-container');
    }

    updateValue(value: Project[]): ProjectsValueContainer {
        this.itemContainer.removeChildren();
        value.forEach(project => {
            const row = new SpanEl('project-item');
            row.setHtml(`${project.getDisplayName()} (${project.getName()})`);
            this.itemContainer.appendChild(row);
        });

        return this;
    }
}

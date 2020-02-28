import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {ProjectListItemViewer} from './ProjectListItemViewer';

export class SelectedProjectListItemViewer
    extends ProjectListItemViewer {

    private prefixElement: SpanEl;

    constructor() {
        super();

        this.prefixElement = new SpanEl('label');
    }

    setPrefix(value: string) {
        this.prefixElement.setHtml(value);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.insertChild(this.prefixElement, 0);
            return rendered;
        });
    }
}

import {AppBar} from 'lib-admin-ui/app/bar/AppBar';
import {Application} from 'lib-admin-ui/app/Application';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';

export class ContentAppBar
    extends AppBar {

    private projectInfoBlock: DivEl;

    constructor(application: Application) {
        super(application);

        this.initElements();
    }

    private initElements() {
        this.projectInfoBlock = new DivEl('project');

    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const project: Element = new SpanEl('label').setHtml(i18n('app.context'));
            const projectName: Element = new SpanEl('name').setHtml('Default');
            this.projectInfoBlock.appendChildren(project, projectName);
            this.insertChild(this.projectInfoBlock, 0);

            return rendered;
        });
    }
}

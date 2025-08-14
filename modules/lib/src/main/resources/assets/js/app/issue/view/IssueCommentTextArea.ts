import Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {CompositeFormInputEl} from '@enonic/lib-admin-ui/dom/CompositeFormInputEl';
import {PrincipalViewerCompact} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';

export class IssueCommentTextArea
    extends CompositeFormInputEl {

    private icon: PrincipalViewerCompact;
    private container: DivEl;
    private textArea: TextArea;

    constructor() {
        const textArea = new TextArea('comment');
        super(textArea);
        this.textArea = textArea;
        this.icon = new PrincipalViewerCompact();
        this.addClass('issue-comment-textarea');
        this.container = new DivEl('textarea-container');
        this.container.appendChild(this.textArea);
    }

    setUser(principal: Principal) {
        this.icon.setObject(principal);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.removeChildren().appendChildren<Element>(this.icon, this.container);
            return rendered;
        });
    }

    getValue(): string {
        return super.getValue().trim();
    }
}

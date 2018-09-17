import TextArea = api.ui.text.TextArea;
import PrincipalViewerCompact = api.ui.security.PrincipalViewerCompact;
import Principal = api.security.Principal;
import CompositeFormInputEl = api.dom.CompositeFormInputEl;

export class IssueCommentTextArea
    extends CompositeFormInputEl {

    private icon: PrincipalViewerCompact;
    private container: api.dom.DivEl;
    private textArea: api.ui.text.TextArea;

    constructor() {
        const textArea = new TextArea('comment');
        super(textArea);
        this.textArea = textArea;
        this.icon = new PrincipalViewerCompact();
        this.addClass('issue-comment-textarea');
        this.container = new api.dom.DivEl('textarea-container');
        this.container.appendChild(this.textArea);
    }

    setUser(principal: Principal) {
        this.icon.setObject(principal);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.removeChildren().appendChildren<api.dom.Element>(this.icon, this.container);
            return rendered;
        });
    }

    getValue(): string {
        return super.getValue().trim();
    }
}

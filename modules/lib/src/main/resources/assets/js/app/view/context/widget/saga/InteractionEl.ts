import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class InteractionEl
    extends DivEl {

    private readonly user: Principal;

    constructor(user: Principal) {
        super('chat-interaction');

        this.user = user;

        this.appendChildren();
    }

    addUserMessage(message: string): this {
        this.appendChild(new UserInteractionEntry(message, this.user));
        return this;
    }

    startWaiting(): this {
        const waitingBlock = new DivEl('chat-interaction-waiting');
        waitingBlock.appendChild(new DivEl('dot-flashing'));
        this.appendChild(waitingBlock);
        return this;
    }

    stopWaiting(): this {
        this.getChildren().find((element: Element) => element.hasClass('chat-interaction-waiting'))?.remove();
        return this;
    }

    addAssistantMessage(message: string): this {
        this.appendChild(new AssistantInteractionEntry(message, this.user));
        return this;
    }
}

abstract class InteractionEntry extends DivEl {

    protected logoEl: DivEl;

    protected titleAndTextEl: DivEl;

    protected readonly user: Principal;

    protected readonly message: string;

    protected constructor(message: string, user: Principal) {
        super('chat-interaction-entry');

        this.user = user;
        this.message = message;
        this.initElements();
    }

    protected initElements(): void {
        this.logoEl = this.makeLogoEl();
        this.titleAndTextEl = this.makeTitleAndTextEl();
    }

    protected makeLogoEl(): DivEl {
        const userLogoEl = new DivEl('chat-interaction-actor-logo');
        const userLogo = new DivEl('logo-wrapper');
        const userLogoText = new SpanEl('user-icon').setHtml(this.makeNameAbbreviation());

        userLogo.appendChild(userLogoText);
        userLogoEl.appendChildren(userLogo);
        return userLogoEl;
    }

    protected makeTitleAndTextEl(): DivEl {
        const titleAndTextEl = new DivEl('chat-interaction-title-and-text');
        const titleEl = new DivEl('chat-interaction-title').setHtml(this.makeNameTitle());
        const textEl = new DivEl('chat-interaction-message').setHtml(this.message, false);
        titleAndTextEl.appendChildren(titleEl, textEl);
        return titleAndTextEl;
    }

    abstract makeNameAbbreviation(): string;

    abstract makeNameTitle(): string;

    abstract makeClassName(): string;

    abstract makeIconTooltip(): string;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass(this.makeClassName());
            this.setTitle(this.makeIconTooltip());
            this.appendChildren(this.logoEl, this.titleAndTextEl);

            return rendered;
        });
    }
}

class UserInteractionEntry
    extends InteractionEntry {

    constructor(message: string, user: Principal) {
        super(message, user);
    }

    makeNameAbbreviation(): string {
        const displayName = this.user.getDisplayName().split(' ').map(word => word.substring(0, 1).toUpperCase());
        return displayName.length >= 2
               ? displayName.join('').substring(0, 2)
               : this.user.getDisplayName().substring(0, 2).toUpperCase();
    }

    makeNameTitle(): string {
        return 'You';
    }

    makeClassName(): string {
        return 'chat-interaction-entry-user';
    }

    makeIconTooltip(): string {
        return this.user.getDisplayName();
    }
}

class AssistantInteractionEntry
    extends InteractionEntry {

    constructor(message: string, user: Principal) {
        super(message, user);
    }

    makeNameAbbreviation(): string {
        return 'EA';
    }

    makeNameTitle(): string {
        return 'Saga Assistant';
    }

    makeClassName(): string {
        return 'chat-interaction-entry-assistant';
    }

    makeIconTooltip(): string {
        return 'Enonic Saga Assistant';
    }
}



import {AppBarTabId} from '@enonic/lib-admin-ui/app/bar/AppBarTabId';
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';


export class ContentAppBarTabId
    extends AppBarTabId {

    private appMode: UrlAction;

    static forNew(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(UrlAction.NEW, id);
    }

    static forBrowse(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(UrlAction.BROWSE, id);
    }

    static forEdit(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(UrlAction.EDIT, id);
    }

    static forIssue(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(UrlAction.ISSUE, id);
    }

    static forInbound(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(UrlAction.INBOUND, id);
    }

    static forOutbound(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(UrlAction.OUTBOUND, id);
    }

    static forCustom(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(UrlAction.CUSTOM, id);
    }

    static fromString(mode: string, id: string): ContentAppBarTabId {
        const modeStringLowerCase: string = mode.toLowerCase();

        if (modeStringLowerCase === UrlAction.NEW) {
            return this.forNew(id);
        }

        if (modeStringLowerCase === UrlAction.BROWSE) {
            return this.forBrowse(id);
        }

        if (modeStringLowerCase === UrlAction.EDIT) {
            return this.forEdit(id);
        }

        if (modeStringLowerCase === UrlAction.ISSUE) {
            return this.forIssue(id);
        }

        if (modeStringLowerCase === UrlAction.INBOUND) {
            return this.forInbound(id);
        }

        if (modeStringLowerCase === UrlAction.OUTBOUND) {
            return this.forOutbound(id);
        }

        return this.forCustom(id);
    }

    static fromMode(mode: UrlAction, id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(mode, id);
    }

    private constructor(appMode: UrlAction, id: string, modeString?: string) {
        if (appMode === UrlAction.CUSTOM) {
            super(modeString, id);
        } else {
            super(appMode, id);
        }

        this.appMode = appMode;
    }

    isBrowseMode(): boolean {
        return this.appMode === UrlAction.BROWSE;
    }

    toString(): string {
        const project: string = ProjectContext.get().getProject().getName();

        return `${this.getMode()}:${project}/${this.getId()}`;
    }
}

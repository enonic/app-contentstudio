import {AppBarTabId} from 'lib-admin-ui/app/bar/AppBarTabId';
import {ProjectContext} from './project/ProjectContext';
import {ContentAppMode} from './ContentAppMode';


export class ContentAppBarTabId
    extends AppBarTabId {

    private appMode: ContentAppMode;

    static forNew(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppMode.NEW, id);
    }

    static forBrowse(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppMode.BROWSE, id);
    }

    static forEdit(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppMode.EDIT, id);
    }

    static forIssue(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppMode.ISSUE, id);
    }

    static forInbound(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppMode.INBOUND, id);
    }

    static forOutbound(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppMode.OUTBOUND, id);
    }

    static forCustom(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppMode.CUSTOM, id);
    }

    static fromString(mode: string, id: string): ContentAppBarTabId {
        const modeStringLowerCase: string = mode.toLowerCase();

        if (modeStringLowerCase === ContentAppMode.NEW) {
            return this.forNew(id);
        }

        if (modeStringLowerCase === ContentAppMode.BROWSE) {
            return this.forBrowse(id);
        }

        if (modeStringLowerCase === ContentAppMode.EDIT) {
            return this.forEdit(id);
        }

        if (modeStringLowerCase === ContentAppMode.ISSUE) {
            return this.forIssue(id);
        }

        if (modeStringLowerCase === ContentAppMode.INBOUND) {
            return this.forInbound(id);
        }

        if (modeStringLowerCase === ContentAppMode.OUTBOUND) {
            return this.forOutbound(id);
        }

        return this.forCustom(id);
    }

    static fromMode(mode: ContentAppMode, id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(mode, id);
    }

    private constructor(appMode: ContentAppMode, id: string, modeString?: string) {
        if (appMode === ContentAppMode.CUSTOM) {
            super(modeString, id);
        } else {
            super(appMode, id);
        }

        this.appMode = appMode;
    }

    isBrowseMode(): boolean {
        return this.appMode === ContentAppMode.BROWSE;
    }

    toString(): string {
        const project: string = ProjectContext.get().getProject();

        return `${this.getMode()}:${project}/${this.getId()}`;
    }
}

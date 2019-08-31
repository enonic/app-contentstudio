import AppBarTabId = api.app.bar.AppBarTabId;
import {LayerContext} from './layer/LayerContext';

export class ContentAppBarTabId
    extends AppBarTabId {

    private tabMode: ContentAppBarTabMode;

    static forNew(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.NEW, id);
    }

    static forBrowse(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.BROWSE, id);
    }

    static forEdit(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.EDIT, id);
    }

    static forView(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.VIEW, id);
    }

    static forLocalize(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.LOCALIZE, id);
    }

    static forIssue(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.ISSUE, id);
    }

    static forInbound(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.INBOUND, id);
    }

    static forOutbound(id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.OUTBOUND, id);
    }

    static forCustom(mode: string, id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(ContentAppBarTabMode.CUSTOM, id);
    }

    static fromString(mode: string, id: string): ContentAppBarTabId {
        const modeStringUpperCase: string = mode.toLowerCase();

        if (modeStringUpperCase === ContentAppBarTabMode.NEW) {
            return this.forNew(id);
        }

        if (modeStringUpperCase === ContentAppBarTabMode.BROWSE) {
            return this.forBrowse(id);
        }

        if (modeStringUpperCase === ContentAppBarTabMode.EDIT) {
            return this.forEdit(id);
        }

        if (modeStringUpperCase === ContentAppBarTabMode.VIEW) {
            return this.forView(id);
        }

        if (modeStringUpperCase === ContentAppBarTabMode.LOCALIZE) {
            return this.forLocalize(id);
        }

        if (modeStringUpperCase === ContentAppBarTabMode.ISSUE) {
            return this.forIssue(id);
        }

        if (modeStringUpperCase === ContentAppBarTabMode.INBOUND) {
            return this.forInbound(id);
        }

        if (modeStringUpperCase === ContentAppBarTabMode.OUTBOUND) {
            return this.forOutbound(id);
        }

        return this.forCustom(mode, id);
    }

    static fromMode(mode: ContentAppBarTabMode, id: string): ContentAppBarTabId {
        return new ContentAppBarTabId(mode, id);
    }

    private constructor(tabMode: ContentAppBarTabMode, id: string, modeString?: string) {
        if (tabMode === ContentAppBarTabMode.CUSTOM) {
            super(modeString, id);
        } else {
            super(tabMode, id);
        }

        this.tabMode = tabMode;
    }

    isViewMode(): boolean {
        return this.tabMode === ContentAppBarTabMode.VIEW;
    }

    isLocalizeMode(): boolean {
        return this.tabMode === ContentAppBarTabMode.LOCALIZE;
    }

    isBrowseMode(): boolean {
        return this.tabMode === ContentAppBarTabMode.BROWSE;
    }

    toString(): string {
        const layer: string = LayerContext.get().getCurrentLayer().getName();

        return `${this.getMode()}:${layer}/${this.getId()}`;
    }
}

export enum ContentAppBarTabMode {
    NEW = 'new', BROWSE = 'browse', EDIT = 'edit', VIEW = 'view', LOCALIZE = 'localize', ISSUE = 'issue',
    INBOUND = 'inbound', OUTBOUND = 'outbound', CUSTOM = 'custom'
}

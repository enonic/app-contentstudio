import {LiveEditModel} from './LiveEditModel';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {PageState} from '../app/wizard/page/PageState';
import {FragmentComponent} from '../app/page/region/FragmentComponent';
import {TextComponent} from '../app/page/region/TextComponent';
import {PageHelper} from '../app/util/PageHelper';
import {PageItem} from '../app/page/region/PageItem';

export class LiveEditParams {

    readonly isFragment?: boolean;

    readonly isFragmentAllowed?: boolean;

    readonly isPageTemplate?: boolean;

    readonly displayName?: string;

    readonly locked?: boolean;

    readonly isResetEnabled?: boolean;

    readonly pageName?: string;

    readonly pageIconClass?: string;

    readonly isPageEmpty?: boolean;

    readonly applicationKeys?: string[];

    readonly contentId: string;

    readonly language?: string;

    readonly contentType?: string;

    readonly sitePath?: string;

    readonly modifyPermissions?: boolean;

    constructor(builder: LiveEditParamsBuilder) {
        this.isFragment = builder.isFragment;
        this.isFragmentAllowed = builder.isFragmentAllowed;
        this.isPageTemplate = builder.isPageTemplate;
        this.displayName = builder.displayName;
        this.locked = builder.locked;
        this.isResetEnabled = builder.isResetEnabled;
        this.pageName = builder.pageName;
        this.pageIconClass = builder.pageIconClass;
        this.isPageEmpty = builder.isPageEmpty;
        this.applicationKeys = builder.applicationKeys;
        this.contentId = builder.contentId;
        this.language = builder.language;
        this.contentType = builder.contentType;
        this.sitePath = builder.sitePath;
        this.modifyPermissions = builder.modifyPermissions;
    }

    static create(): LiveEditParamsBuilder {
        return new LiveEditParamsBuilder();
    }

    static fromLiveEditModel(liveEditModel: LiveEditModel, applicationKeys: string[], modifyPermissions: boolean): LiveEditParams {
        const isPageTemplate = liveEditModel.getContent().isPageTemplate();
        const isFragment = liveEditModel.getContent().getType().isFragment();

        return LiveEditParams.create()
            .setIsPageTemplate(isPageTemplate)
            .setIsFragment(isFragment)
            .setDisplayName(liveEditModel.getContent().getDisplayName())
            .setLocked(!isPageTemplate && !PageState.getState()?.hasController() && !isFragment)
            .setIsFragmentAllowed(liveEditModel.isFragmentAllowed())
            .setIsResetEnabled(PageState.getState()?.hasController())
            .setPageName(liveEditModel.getContent().getDisplayName())
            .setPageIconClass(PageHelper.getPageIconClass(PageState.getState()))
            .setIsPageEmpty(isPageTemplate && !PageState.getState()?.hasController())
            .setApplicationKeys(applicationKeys)
            .setContentId(liveEditModel.getContent().getId())
            .setLanguage(liveEditModel.getContent()?.getLanguage())
            .setContentType(liveEditModel.getContent().getType()?.toString())
            .setSitePath(liveEditModel.getSiteModel()?.getSite().getPath().toString())
            .setModifyPermissions(modifyPermissions)
            .build();
    }

    static fromObject(obj: object): LiveEditParams {
        return LiveEditParams.create()
            .setIsFragment(obj['isFragment'])
            .setIsFragmentAllowed(obj['isFragmentAllowed'])
            .setIsPageTemplate(obj['isPageTemplate'])
            .setDisplayName(obj['displayName'])
            .setLocked(obj['locked'])
            .setIsResetEnabled(obj['isResetEnabled'])
            .setPageName(obj['pageName'])
            .setPageIconClass(obj['pageIconClass'])
            .setIsPageEmpty(obj['isPageEmpty'])
            .setApplicationKeys(obj['applicationKeys'])
            .setContentId(obj['contentId'])
            .setLanguage(obj['language'])
            .setContentType(obj['contentType'])
            .setSitePath(obj['sitePath'])
            .setModifyPermissions(obj['modifyPermissions'])
            .build();
    }

    getFragmentIdByPath(path: string): string | undefined {
        const component = this.getComponentByPath(path);

        if (component instanceof FragmentComponent) {
            return component.getFragment()?.toString();
        }

        return undefined;
    }

    getTextComponentData(path: string): string | undefined {
        const component = this.getComponentByPath(path);

        if (component instanceof TextComponent) {
            return component.getText();
        }

        return undefined;
    }

    private getComponentByPath(path: string): PageItem | undefined {
        const componentPath = ComponentPath.fromString(path);
        return PageState.getComponentByPath(componentPath);
    }
}

export class LiveEditParamsBuilder {

    isFragment?: boolean;

    isFragmentAllowed?: boolean;

    isPageTemplate?: boolean;

    displayName?: string;

    locked?: boolean;

    isResetEnabled?: boolean;

    pageName?: string;

    pageIconClass?: string;

    isPageEmpty?: boolean;

    applicationKeys?: string[];

    contentId: string;

    language?: string;

    contentType?: string;

    sitePath?: string;

    modifyPermissions?: boolean;

    setIsFragment(value: boolean): LiveEditParamsBuilder {
        this.isFragment = value;
        return this;
    }

    setIsFragmentAllowed(value: boolean): LiveEditParamsBuilder {
        this.isFragmentAllowed = value;
        return this;
    }

    setIsPageTemplate(value: boolean): LiveEditParamsBuilder {
        this.isPageTemplate = value;
        return this;
    }

    setDisplayName(value: string): LiveEditParamsBuilder {
        this.displayName = value;
        return this;
    }

    setLocked(value: boolean): LiveEditParamsBuilder {
        this.locked = value;
        return this;
    }

    setIsResetEnabled(value: boolean): LiveEditParamsBuilder {
        this.isResetEnabled = value;
        return this;
    }

    setPageName(value: string): LiveEditParamsBuilder {
        this.pageName = value;
        return this;
    }

    setPageIconClass(value: string): LiveEditParamsBuilder {
        this.pageIconClass = value;
        return this;
    }

    setIsPageEmpty(value: boolean): LiveEditParamsBuilder {
        this.isPageEmpty = value;
        return this;
    }

    setApplicationKeys(value: string[]): LiveEditParamsBuilder {
        this.applicationKeys = value;
        return this;
    }

    setContentId(value: string): LiveEditParamsBuilder {
        this.contentId = value;
        return this;
    }

    setLanguage(value: string): LiveEditParamsBuilder {
        this.language = value;
        return this;
    }

    setContentType(value: string): LiveEditParamsBuilder {
        this.contentType = value;
        return this;
    }

    setSitePath(value: string): LiveEditParamsBuilder {
        this.sitePath = value;
        return this;
    }

    setModifyPermissions(value: boolean): LiveEditParamsBuilder {
        this.modifyPermissions = value;
        return this;
    }

    build(): LiveEditParams {
        return new LiveEditParams(this);
    }
}

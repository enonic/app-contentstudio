import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {CreateHtmlAreaDialogEvent} from './CreateHtmlAreaDialogEvent';
import {ContentSummary} from '../../../content/ContentSummary';
import {LangDirection} from '@enonic/lib-admin-ui/dom/Element';
import {Project} from '../../../settings/data/project/Project';

export class HtmlEditorParams {

    private readonly content?: ContentSummary; // used for image dialog
    private readonly applicationKeys: ApplicationKey[]; // used for macro dialog
    private readonly project?: Project; // used to set correct requests paths in dialogs

    private readonly assetsUri: string;
    private readonly editorContainerId: string;
    private readonly focusHandler: (e: FocusEvent) => void;
    private readonly blurHandler: (e: FocusEvent) => void;
    private readonly mouseLeaveHandler: (e: MouseEvent, mousePressed?: boolean) => void;
    private readonly keydownHandler: (e: KeyboardEvent) => void;
    private readonly nodeChangeHandler: () => void;
    private readonly editorLoadedHandler: () => void;
    private readonly editorReadyHandler: (eventInfo: CKEDITOR.eventInfo) => void;
    private readonly saveHandler?: () => void;
    private readonly createDialogHandler: (event: CreateHtmlAreaDialogEvent) => void;
    private readonly inline: boolean = false;
    private readonly fullscreenMode: boolean = false;
    private readonly fixedToolbarContainer: string;
    private readonly editableSourceCode: boolean;
    private readonly customStylesToBeUsed: boolean = false;
    private readonly enabledTools: string[];
    private readonly disabledTools: string[];
    private readonly allowedHeadings: string;
    private readonly langDirection: LangDirection;
    private readonly label: string;

    constructor(builder: HtmlEditorParamsBuilder) {
        if (!builder.assetsUri || !builder.editorContainerId) {
            throw new Error('some required fields are missing for Html Editor');
        }

        this.content = builder.content;
        this.applicationKeys = builder.applicationKeys;
        this.project = builder.project;

        this.assetsUri = builder.assetsUri;
        this.editorContainerId = builder.editorContainerId;
        this.focusHandler = builder.focusHandler;
        this.blurHandler = builder.blurHandler;
        this.mouseLeaveHandler = builder.mouseLeaveHandler;
        this.keydownHandler = builder.keydownHandler;
        this.nodeChangeHandler = builder.nodeChangeHandler;
        this.editorLoadedHandler = builder.editorLoadedHandler;
        this.editorReadyHandler = builder.editorReadyHandler;
        this.createDialogHandler = builder.createDialogHandler;
        this.saveHandler = builder.saveHandler;
        this.inline = builder.inline;
        this.fullscreenMode = builder.fullscreenMode;
        this.fixedToolbarContainer = builder.fixedToolbarContainer;
        this.editableSourceCode = builder.editableSourceCode;
        this.customStylesToBeUsed = builder.customStylesToBeUsed;
        this.enabledTools = builder.enabledTools;
        this.disabledTools = builder.disabledTools;
        this.allowedHeadings = builder.allowedHeadings;
        this.langDirection = builder.langDirection;
        this.label = builder.label;
    }

    getContent(): ContentSummary {
        return this.content;
    }

    getApplicationKeys(): ApplicationKey[] {
        return this.applicationKeys;
    }

    getAssetsUri(): string {
        return this.assetsUri;
    }

    getEditorContainerId(): string {
        return this.editorContainerId;
    }

    hasFocusHandler(): boolean {
        return !!this.focusHandler;
    }

    getFocusHandler(): (e: FocusEvent) => void {
        return this.focusHandler;
    }

    hasBlurHandler(): boolean {
        return !!this.blurHandler;
    }

    getBlurHandler(): (e: FocusEvent) => void {
        return this.blurHandler;
    }

    hasMouseLeaveHandler(): boolean {
        return !!this.mouseLeaveHandler;
    }

    getMouseLeaveHandler(): (e: MouseEvent, mousePressed?: boolean) => void {
        return this.mouseLeaveHandler;
    }

    hasKeydownHandler(): boolean {
        return !!this.keydownHandler;
    }

    getKeydownHandler(): (e: KeyboardEvent) => void {
        return this.keydownHandler;
    }

    hasNodeChangeHandler(): boolean {
        return !!this.nodeChangeHandler;
    }

    getNodeChangeHandler(): () => void {
        return this.nodeChangeHandler;
    }

    hasEditorLoadedHandler(): boolean {
        return !!this.editorLoadedHandler;
    }

    getEditorLoadedHandler(): () => void {
        return this.editorLoadedHandler;
    }

    hasEditorReadyHandler(): boolean {
        return !!this.editorReadyHandler;
    }

    getEditorReadyHandler(): (eventInfo: CKEDITOR.eventInfo) => void {
        return this.editorReadyHandler;
    }

    getSaveHandler(): () => void {
        return this.saveHandler;
    }

    hasCreateDialogListener(): boolean {
        return !!this.createDialogHandler;
    }

    getCreateDialogListener(): (event: CreateHtmlAreaDialogEvent) => void {
        return this.createDialogHandler;
    }

    isInline(): boolean {
        return this.inline;
    }

    isFullScreenMode(): boolean {
        return this.fullscreenMode;
    }

    getFixedToolbarContainer(): string {
        return this.fixedToolbarContainer;
    }

    getEditableSourceCode(): boolean {
        return this.editableSourceCode;
    }

    isCustomStylesToBeUsed(): boolean {
        return this.customStylesToBeUsed;
    }

    getEnabledTools(): string[] {
        return this.enabledTools;
    }

    getDisabledTools(): string[] {
        return this.disabledTools;
    }

    getAllowedHeadings(): string {
        return this.allowedHeadings;
    }

    getLangDirection(): LangDirection {
        return this.langDirection;
    }

    getProject(): Project {
        return this.project;
    }

    getLabel(): string {
        return this.label;
    }

    public static create(): HtmlEditorParamsBuilder {
        return new HtmlEditorParamsBuilder();
    }
}

export class HtmlEditorParamsBuilder {

    content: ContentSummary; // used for image dialog

    applicationKeys: ApplicationKey[]; // used for macro dialog

    assetsUri: string;

    editorContainerId: string;

    focusHandler: (e: FocusEvent) => void;

    blurHandler: (e: FocusEvent) => void;

    mouseLeaveHandler: (e: MouseEvent, mousePressed?: boolean) => void;

    keydownHandler: (e: KeyboardEvent) => void;

    nodeChangeHandler: () => void;

    editorLoadedHandler: () => void;

    editorReadyHandler: (eventInfo: CKEDITOR.eventInfo) => void;

    saveHandler: () => void;

    createDialogHandler: (event: CreateHtmlAreaDialogEvent) => void;

    inline: boolean = false;

    fullscreenMode: boolean = false;

    fixedToolbarContainer: string;

    editableSourceCode: boolean;

    customStylesToBeUsed: boolean = false;

    enabledTools: string[];

    disabledTools: string[];

    allowedHeadings: string;

    langDirection: LangDirection = LangDirection.AUTO;

    project: Project;

    label: string;

    setEditableSourceCode(value: boolean): HtmlEditorParamsBuilder {
        this.editableSourceCode = value;
        return this;
    }

    setAssetsUri(assetsUri: string): HtmlEditorParamsBuilder {
        this.assetsUri = assetsUri;
        return this;
    }

    setEditorContainerId(id: string): HtmlEditorParamsBuilder {
        this.editorContainerId = id;
        return this;
    }

    setFullscreenMode(value: boolean): HtmlEditorParamsBuilder {
        this.fullscreenMode = value;
        return this;
    }

    setCreateDialogHandler(createHandler: (event: CreateHtmlAreaDialogEvent) => void) {
        this.createDialogHandler = createHandler;
        return this;
    }

    setFocusHandler(focusHandler: (e: FocusEvent) => void): HtmlEditorParamsBuilder {
        this.focusHandler = focusHandler;
        return this;
    }

    setBlurHandler(blurHandler: (e: FocusEvent) => void): HtmlEditorParamsBuilder {
        this.blurHandler = blurHandler;
        return this;
    }

    setMouseLeaveHandler(mouseLeaveHandler: (e: MouseEvent, mousePressed?: boolean) => void): HtmlEditorParamsBuilder {
        this.mouseLeaveHandler = mouseLeaveHandler;
        return this;
    }

    setKeydownHandler(keydownHandler: (e: KeyboardEvent) => void): HtmlEditorParamsBuilder {
        this.keydownHandler = keydownHandler;
        return this;
    }

    setNodeChangeHandler(nodeChangeHandler: () => void): HtmlEditorParamsBuilder {
        this.nodeChangeHandler = AppHelper.debounce(() => nodeChangeHandler(), 200);

        return this;
    }

    setEditorLoadedHandler(editorLoadedHandler: () => void): HtmlEditorParamsBuilder {
        this.editorLoadedHandler = editorLoadedHandler;
        return this;
    }

    setEditorReadyHandler(editorReadyHandler: (eventInfo: CKEDITOR.eventInfo) => void): HtmlEditorParamsBuilder {
        this.editorReadyHandler = editorReadyHandler;
        return this;
    }

    setSaveHandler(saveHandler: () => void): HtmlEditorParamsBuilder {
        this.saveHandler = saveHandler;
        return this;
    }

    setInline(inline: boolean): HtmlEditorParamsBuilder {
        this.inline = inline;
        return this;
    }

    setFixedToolbarContainer(fixedToolbarContainer: string): HtmlEditorParamsBuilder {
        this.fixedToolbarContainer = fixedToolbarContainer;
        return this;
    }

    setContent(content: ContentSummary): HtmlEditorParamsBuilder {
        this.content = content;
        return this;
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]): HtmlEditorParamsBuilder {
        this.applicationKeys = applicationKeys;
        return this;
    }

    setCustomStylesToBeUsed(value: boolean): HtmlEditorParamsBuilder {
        this.customStylesToBeUsed = value;
        return this;
    }

    setEnabledTools(tools: string[]): HtmlEditorParamsBuilder {
        this.enabledTools = tools;
        return this;
    }

    setDisabledTools(tools: string[]): HtmlEditorParamsBuilder {
        this.disabledTools = tools;
        return this;
    }

    setAllowedHeadings(allowedHeadings: string): HtmlEditorParamsBuilder {
        this.allowedHeadings = allowedHeadings;
        return this;
    }

    setLangDirection(value: LangDirection): HtmlEditorParamsBuilder {
        this.langDirection = value;
        return this;
    }

    setProject(value: Project): HtmlEditorParamsBuilder {
        this.project = value;
        return this;
    }

    setLabel(value: string): HtmlEditorParamsBuilder {
        this.label = value;
        return this;
    }

    build(): HtmlEditorParams {
        return new HtmlEditorParams(this);
    }
}

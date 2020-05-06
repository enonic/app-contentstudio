import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {CreateHtmlAreaDialogEvent} from './CreateHtmlAreaDialogEvent';

export class HtmlEditorParams {

    private content: ContentSummary; // used for image dialog
    private contentPath: ContentPath; // used for macro dialog
    private applicationKeys: ApplicationKey[]; // used for macro dialog

    private assetsUri: string;
    private editorContainerId: string;
    private focusHandler: (e: FocusEvent) => void;
    private blurHandler: (e: FocusEvent) => void;
    private mouseLeaveHandler: (e: MouseEvent, mousePressed?: boolean) => void;
    private keydownHandler: (e: KeyboardEvent) => void;
    private nodeChangeHandler: (e: any) => void;
    private editorLoadedHandler: () => void;
    private editorReadyHandler: () => void;
    private createDialogHandler: { (event: CreateHtmlAreaDialogEvent): void };
    private inline: boolean = false;
    private fullscreenMode: boolean = false;
    private fixedToolbarContainer: string;
    private editableSourceCode: boolean;
    private customStylesToBeUsed: boolean = false;
    private tools: any;
    private allowScripts: boolean = false;
    private allowedHeadings: string;

    constructor(builder: HtmlEditorParamsBuilder) {
        if (!builder.assetsUri || !builder.editorContainerId || !builder.content) {
            throw new Error('some required fields are missing for Html Editor');
        }

        this.content = builder.content;
        this.contentPath = builder.contentPath;
        this.applicationKeys = builder.applicationKeys;
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
        this.inline = builder.inline;
        this.fullscreenMode = builder.fullscreenMode;
        this.fixedToolbarContainer = builder.fixedToolbarContainer;
        this.editableSourceCode = builder.editableSourceCode;
        this.customStylesToBeUsed = builder.customStylesToBeUsed;
        this.tools = builder.tools;
        this.allowScripts = builder.allowScripts;
        this.allowedHeadings = builder.allowedHeadings;
    }

    private checkRequiredFieldsAreSet(htmlEditorParams: HtmlEditorParams) {
        if (!htmlEditorParams.getAssetsUri() || !htmlEditorParams.getEditorContainerId() || !htmlEditorParams.getContent()) {
            throw new Error('some required fields are missing for Html Editor');
        }
    }

    getContent(): ContentSummary {
        return this.content;
    }

    getContentPath(): ContentPath {
        return this.contentPath;
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

    getNodeChangeHandler(): (e: any) => void {
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

    getEditorReadyHandler(): () => void {
        return this.editorReadyHandler;
    }

    hasCreateDialogListener(): boolean {
        return !!this.createDialogHandler;
    }

    getCreateDialogListener(): { (event: CreateHtmlAreaDialogEvent): void } {
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

    getTools(): any {
        return this.tools;
    }

    isScriptAllowed(): boolean {
        return this.allowScripts;
    }

    getAllowedHeadings(): string {
        return this.allowedHeadings;
    }

    public static create(): HtmlEditorParamsBuilder {
        return new HtmlEditorParamsBuilder();
    }
}

export class HtmlEditorParamsBuilder {

    content: ContentSummary; // used for image dialog

    contentPath: ContentPath; // used for macro dialog

    applicationKeys: ApplicationKey[]; // used for macro dialog

    assetsUri: string;

    editorContainerId: string;

    focusHandler: (e: FocusEvent) => void;

    blurHandler: (e: FocusEvent) => void;

    mouseLeaveHandler: (e: MouseEvent, mousePressed?: boolean) => void;

    keydownHandler: (e: KeyboardEvent) => void;

    nodeChangeHandler: (e: any) => void;

    editorLoadedHandler: () => void;

    editorReadyHandler: () => void;

    createDialogHandler: { (event: CreateHtmlAreaDialogEvent): void };

    inline: boolean = false;

    fullscreenMode: boolean = false;

    fixedToolbarContainer: string;

    editableSourceCode: boolean;

    customStylesToBeUsed: boolean = false;

    tools: any;

    allowScripts: boolean = false;

    allowedHeadings: string;

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

    setNodeChangeHandler(nodeChangeHandler: (e: any) => void): HtmlEditorParamsBuilder {
        this.nodeChangeHandler = AppHelper.debounce((e) => {
            nodeChangeHandler(e);
        }, 200);

        return this;
    }

    setEditorLoadedHandler(editorLoadedHandler: () => void): HtmlEditorParamsBuilder {
        this.editorLoadedHandler = editorLoadedHandler;
        return this;
    }

    setEditorReadyHandler(editorReadyHandler: () => void): HtmlEditorParamsBuilder {
        this.editorReadyHandler = editorReadyHandler;
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

    setContentPath(contentPath: ContentPath): HtmlEditorParamsBuilder {
        this.contentPath = contentPath;
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

    setTools(tools: any): HtmlEditorParamsBuilder {
        this.tools = tools;
        return this;
    }

    setAllowScripts(value: boolean): HtmlEditorParamsBuilder {
        this.allowScripts = value;
        return this;
    }

    setAllowedHeadings(allowedHeadings: string): HtmlEditorParamsBuilder {
        this.allowedHeadings = allowedHeadings;
        return this;
    }

    build(): HtmlEditorParams {
        return new HtmlEditorParams(this);
    }
}

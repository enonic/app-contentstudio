import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { type Element } from '@enonic/lib-admin-ui/dom/Element';
import { Panel } from '@enonic/lib-admin-ui/ui/panel/Panel';
import { LoadMask } from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import { LiveViewImageEditorElement } from '../../../v6/pages/wizard/ui/layout/LiveViewImageEditor';
import { PreviewToolbarElement } from '../../../v6/widgets/preview-panel/ui/PreviewToolbar';
import { $isLiveViewImageEditorActive } from '../../../v6/widgets/inspectors/model/liveViewWidgets.store';
import { type LiveEditPageProxy } from './LiveEditPageProxy';

export interface FrameContainerConfig {
    proxy: LiveEditPageProxy;
}

export class FrameContainer extends Panel {
    private readonly toolbar: PreviewToolbarElement;
    private readonly contents: DivEl;
    private readonly imageEditor: LiveViewImageEditorElement;
    private readonly proxy: LiveEditPageProxy;
    private readonly wrapper: DivEl;
    private readonly unsubscribers: (() => void)[] = [];

    constructor(config: FrameContainerConfig) {
        super('frame-container');
        this.setDoOffset(false);

        this.proxy = config.proxy;
        this.toolbar = new PreviewToolbarElement({ editorLayout: true });

        // `frame-contents` groups the image editor and the iframe wrapper so the live
        // load masks can be scoped to them and leave the toolbar interactive.
        this.contents = new DivEl('frame-contents bg-surface-neutral');
        // Keep editor loading independent of late iframe load events when switching widgets.
        const imageLoadMask = new LoadMask(this.contents).addClass('live-load-mask preview-load-mask');
        this.imageEditor = new LiveViewImageEditorElement({
            onLoadingChange: (loading) => {
                if (loading && $isLiveViewImageEditorActive.get()) {
                    imageLoadMask.show();
                } else {
                    imageLoadMask.hide();
                }
            },
        });

        this.wrapper = new DivEl('wrapper');
        this.wrapper.appendChild(this.proxy.getIFrame());

        this.contents.appendChild(this.imageEditor);
        this.contents.appendChild(this.wrapper);

        this.appendChildren<Element>(this.toolbar, this.contents, this.proxy.getDragMask());

        this.unsubscribers.push($isLiveViewImageEditorActive.subscribe(() => this.updateIframeVisibility()));

        this.onRemoved(() => {
            this.unsubscribers.forEach((unsub) => unsub());
        });
    }

    private updateIframeVisibility(): void {
        const imageEditorActive = $isLiveViewImageEditorActive.get();
        // Switch both roots together while Preact updates the editor's contents.
        this.imageEditor.setVisible(imageEditorActive);
        this.wrapper.setVisible(!imageEditorActive);
    }

    public getToolbar(): PreviewToolbarElement {
        return this.toolbar;
    }

    public getWrapper(): DivEl {
        return this.wrapper;
    }

    public getContents(): DivEl {
        return this.contents;
    }
}

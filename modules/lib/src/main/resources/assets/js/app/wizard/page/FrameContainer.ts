import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {LiveViewImageEditorElement} from '../../../v6/features/views/wizard/layout/LiveViewImageEditor';
import {PreviewToolbarElement} from '../../../v6/features/views/browse/layout/preview/PreviewToolbar';
import {$isLiveViewImageEditorActive} from '../../../v6/features/store/liveViewWidgets.store';
import {type LiveEditPageProxy} from './LiveEditPageProxy';

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
        this.toolbar = new PreviewToolbarElement();
        this.imageEditor = new LiveViewImageEditorElement();

        this.wrapper = new DivEl('wrapper');
        this.wrapper.appendChild(this.proxy.getIFrame());

        // `frame-contents` groups the image editor and the iframe wrapper so the live
        // load mask can be scoped to them and leave the toolbar interactive.
        this.contents = new DivEl('frame-contents');
        this.contents.appendChild(this.imageEditor);
        this.contents.appendChild(this.wrapper);

        this.appendChildren<Element>(this.toolbar, this.contents, this.proxy.getDragMask());

        this.unsubscribers.push($isLiveViewImageEditorActive.subscribe(() => this.updateIframeVisibility()));

        this.onRemoved(() => {
            this.unsubscribers.forEach((unsub) => unsub());
        });
    }

    private updateIframeVisibility(): void {
        this.wrapper.setVisible(!$isLiveViewImageEditorActive.get());
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

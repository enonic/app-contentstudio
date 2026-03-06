import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentItemPreviewToolbar} from '../../view/ContentItemPreviewToolbar';
import {LiveEditPageProxy} from './LiveEditPageProxy';
import {RenderingMode} from '../../rendering/RenderingMode';
import {PreviewWidgetDropdown} from '../../view/toolbar/PreviewWidgetDropdown';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';


export interface FrameContainerConfig {
    proxy: LiveEditPageProxy;
}


export class FrameContainer
    extends Panel {

    private readonly toolbar: ContentItemPreviewToolbar;
    private readonly proxy: LiveEditPageProxy;
    private readonly wrapper: DivEl;

    constructor(config: FrameContainerConfig) {
        super('frame-container');
        this.setDoOffset(false);

        this.proxy = config.proxy;
        this.toolbar = new ContentItemPreviewToolbar(RenderingMode.EDIT);

        this.wrapper = new DivEl('wrapper');
        this.wrapper.appendChild(this.proxy.getIFrame());

        this.appendChildren<Element>(this.toolbar, this.wrapper, this.proxy.getDragMask());
    }

    public getToolbar(): ContentItemPreviewToolbar {
        return this.toolbar;
    }

    public getWrapper(): DivEl {
        return this.wrapper;
    }

    public getWidgetSelector(): PreviewWidgetDropdown {
        return this.toolbar.getWidgetSelector();
    }
}

import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {PreviewToolbarElement} from '../../../v6/features/views/browse/layout/preview/PreviewToolbar';
import {type LiveEditPageProxy} from './LiveEditPageProxy';

export interface FrameContainerConfig {
    proxy: LiveEditPageProxy;
}

export class FrameContainer extends Panel {
    private readonly toolbar: PreviewToolbarElement;
    private readonly proxy: LiveEditPageProxy;
    private readonly wrapper: DivEl;

    constructor(config: FrameContainerConfig) {
        super('frame-container');
        this.setDoOffset(false);

        this.proxy = config.proxy;
        this.toolbar = new PreviewToolbarElement();

        this.wrapper = new DivEl('wrapper');

        this.wrapper.appendChild(this.proxy.getIFrame());

        this.appendChildren<Element>(this.toolbar, this.wrapper, this.proxy.getDragMask());
    }

    public getToolbar(): PreviewToolbarElement {
        return this.toolbar;
    }

    public getWrapper(): DivEl {
        return this.wrapper;
    }
}

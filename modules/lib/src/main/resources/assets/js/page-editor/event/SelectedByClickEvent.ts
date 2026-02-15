import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';

export abstract class SelectedByClickEvent
    extends IframeEvent {

    private rightClicked: boolean;

    constructor(rightClicked: boolean = false) {
        super();
        this.rightClicked = rightClicked;
    }

    isRightClicked(): boolean {
        return this.rightClicked;
    }
}

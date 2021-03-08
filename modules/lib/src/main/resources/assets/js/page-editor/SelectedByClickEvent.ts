import {Event} from 'lib-admin-ui/event/Event';

export abstract class SelectedByClickEvent
    extends Event {

    private rightClicked: boolean;

    constructor(rightClicked: boolean = false) {
        super();
        this.rightClicked = rightClicked;
    }

    isRightClicked(): boolean {
        return this.rightClicked;
    }
}

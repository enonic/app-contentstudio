export abstract class SelectedByClickEvent
    extends api.event.Event {

    private rightClicked: boolean;

    constructor(rightClicked: boolean = false) {
        super();
        this.rightClicked = rightClicked;
    }

    isRightClicked(): boolean {
        return this.rightClicked;
    }
}

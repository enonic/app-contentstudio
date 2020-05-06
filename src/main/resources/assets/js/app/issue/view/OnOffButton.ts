import {Button} from 'lib-admin-ui/ui/button/Button';

export interface OnOffButtonLabels {
    onLabel: string;
    offLabel: string;
}

export interface OnOffButtonOptions
    extends OnOffButtonLabels {

    off: boolean;
    clickHandler?: (event: MouseEvent) => void;
}

export class OnOffButton
    extends Button {

    private onLabel: string;

    private offLabel: string;

    private off: boolean;

    constructor(options: OnOffButtonOptions) {
        const {off, onLabel, offLabel, clickHandler} = options;
        const defaultLabel = off ? offLabel : onLabel;

        super(defaultLabel);

        this.onLabel = onLabel;
        this.offLabel = offLabel;
        this.off = !!off;

        this.addClass('on-off-button');

        this.initListeners(clickHandler);
    }

    protected initListeners(clickHandler: (event: MouseEvent) => void) {
        this.onClicked((event: MouseEvent) => {
            this.off = !this.off;

            this.refreshCurrentLabel();

            if (clickHandler) {
                clickHandler(event);
            }
        });
    }

    updateLabels(labels: OnOffButtonLabels) {
        const {onLabel, offLabel} = labels;

        this.onLabel = onLabel;
        this.offLabel = offLabel;

        this.refreshCurrentLabel();

    }

    isOff(): boolean {
        return this.off;
    }

    turnOn() {
        this.off = false;
        this.refreshCurrentLabel();
    }

    turnOff() {
        this.off = true;
        this.refreshCurrentLabel();
    }

    private refreshCurrentLabel() {
        if (this.off) {
            this.setLabel(this.offLabel);
        } else {
            this.setLabel(this.onLabel);
        }
    }

}

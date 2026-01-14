import {PanelStripHeader, PanelStripHeaderConfig} from '@enonic/lib-admin-ui/ui/panel/PanelStripHeader';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';

export interface ContentPanelStripHeaderConfig extends PanelStripHeaderConfig {
    optional?: boolean;
}

export class ContentPanelStripHeader extends PanelStripHeader {

    protected config: ContentPanelStripHeaderConfig;

    private toggler: ButtonEl;

    private tooltip: Tooltip;

    private enableChangedListeners: ((value: boolean) => void)[] = [];

    constructor(config: ContentPanelStripHeaderConfig) {
        super(config);
    }

    protected initElements(): void {
        super.initElements();

        if (this.config.optional) {
            this.toggler = new ButtonEl();
            this.tooltip = new Tooltip(this.toggler, '', 200).setMode(Tooltip.MODE_GLOBAL_STATIC);

            this.setTogglerState(false);
        }
    }

    protected initListeners(): void {
        super.initListeners();

        if (this.config.optional) {
            this.toggler.onClicked((e) => this.toggleState(e));
            this.onClicked((e) => this.hasClass('enabled') || this.toggleState(e));
        }
    }

    setTogglerState(enabled: boolean, silent: boolean = false) {
        if (!this.toggler) {
            return;
        }

        let changed: boolean = false;
        if (this.hasClass('enabled') !== enabled) {
            changed = true;
        }

        this.toggleClass('enabled', enabled);
        this.toggleClass('disabled', !enabled);

        this.tooltip.setText(i18n(enabled ? 'action.disable' : 'action.enable'));
        this.toggler.setAriaLabel(enabled ? i18n('action.removeXdata') : i18n('action.addXdata'));

        if (changed && !silent) {
            this.notifyEnableChanged(enabled);
        }
    }

    onEnableChanged(listener: (value: boolean) => void) {
        this.enableChangedListeners.push(listener);
    }

    unEnableChanged(listener: (value: boolean) => void) {
        this.enableChangedListeners = this.enableChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private toggleState(event: MouseEvent) {
        this.setTogglerState(!this.hasClass('enabled'));
        event.stopPropagation();
    }

    private notifyEnableChanged(value: boolean) {
        this.enableChangedListeners.forEach((listener) => {
            listener(value);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('content-panel-strip-header');

            if (this.toggler) {
                this.toggler.addClass('toggler-button icon-close');
                this.toggler.setAriaLabel(i18n('action.removeXdata'));
                this.appendChild(this.toggler);
            }

            return rendered;
        });
    }
}

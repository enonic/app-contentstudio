import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {AppContext} from '../AppContext';
import {type Widget} from '@enonic/lib-admin-ui/content/Widget';
import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {WidgetButton} from './WidgetButton';

export class WidgetsToolbar
    extends DivEl {

    private buttons: WidgetButton[] = [];

    private itemSelectedListeners: ((appOrWidgetId: string) => void) [] = [];

    private static MAIN_APP_ENDING: string = 'studio:main';

    private static ARCHIVE_APP_ENDING: string = 'plus:archive';

    private static SETTINGS_APP_ENDING: string = 'studio:settings';

    constructor() {
        super('actions-block');
    }

    addWidget(widget: Widget, buttonClass?: string): void {
        this.createWidgetButton(widget, buttonClass);
    }

    private createWidgetButton(widget: Widget, buttonClass?: string) {
        const sidebarButton: WidgetButton = new WidgetButton(widget);
        sidebarButton.setLabel(widget.getDisplayName());
        sidebarButton.setTitle(widget.getDisplayName());

        if (buttonClass) {
            sidebarButton.addClass(buttonClass);
        }

        if (widget.getIconUrl()) {
            const imgEl: ImgEl = new ImgEl(widget.getFullIconUrl());
            sidebarButton.appendChild(imgEl);
        }

        this.listenButtonClicked(sidebarButton);

        const pos: number = this.getButtonPos(sidebarButton);

        if (pos < 0) {
            this.appendChild(sidebarButton);
        } else {
            this.insertChild(sidebarButton, pos);
        }

        this.buttons.push(sidebarButton);
    }

    toggleActiveButton() {
        this.buttons.forEach((b: WidgetButton) => {
            b.toggleSelected(b.getWidgetId() === AppContext.get().getCurrentAppOrWidgetId());
        });
    }

    private getButtonPos(sidebarButton: WidgetButton): number {
        if (this.isMainAppButton(sidebarButton)) {
            return 0;
        }

        if (this.isArchiveAppButton(sidebarButton)) {
            return 1;
        }

        if (this.isSettingsApp(sidebarButton)) {
            return -1;
        }

        return this.getNonDefaultAppPos(sidebarButton.getWidgetDisplayName().toLowerCase());
    }

    private getNonDefaultAppPos(widgetName: string): number {
        let pos: number = -1;

        this.getChildren().some((existingButton: WidgetButton, index: number) => {
            if (this.isMainAppButton(existingButton) || this.isArchiveAppButton(existingButton)) {
                return false;
            }

            if (this.isSettingsApp(existingButton)) { // inserting before Settings button
                pos = index;
                return true;
            }

            // finding
            if (widgetName.localeCompare(existingButton.getWidgetDisplayName().toLowerCase()) < 0) {
                pos = index;
                return true;
            }

            return false;
        });

        return pos;
    }

    private isMainAppButton(button: WidgetButton): boolean {
        return button.getWidgetId().endsWith(WidgetsToolbar.MAIN_APP_ENDING);
    }

    private isArchiveAppButton(button: WidgetButton): boolean {
        return button.getWidgetId().endsWith(WidgetsToolbar.ARCHIVE_APP_ENDING);
    }

    private isSettingsApp(button: WidgetButton): boolean {
        return button.getWidgetId().endsWith(WidgetsToolbar.SETTINGS_APP_ENDING);
    }

    private onButtonClicked(button: WidgetButton) {
        this.buttons.forEach((b: Button) => {
            b.toggleClass(WidgetButton.SELECTED_CLASS, b === button);
        });

        if (button.getWidgetId() !== AppContext.get().getCurrentAppOrWidgetId()) {
            this.notifyItemSelected(button.getWidgetId());
        }
    }

    private listenButtonClicked(button: WidgetButton) {
        const clickListener: () => void = () => this.onButtonClicked(button);
        button.onTouchStart(clickListener);
        button.onClicked(clickListener);

        button.onRemoved(() => {
            button.unTouchStart(clickListener);
            button.unClicked(clickListener);
        });
    }

    removeWidget(widget: Widget): void {
        this.removeButtonById(widget.getWidgetDescriptorKey().toString());
    }

    private removeButtonById(itemId: string): void {
        const buttonToRemove: WidgetButton = this.buttons.find((b: WidgetButton) => b.getWidgetId() === itemId);

        if (buttonToRemove) {
            this.buttons = this.buttons.filter((b: WidgetButton) => b !== buttonToRemove);
            buttonToRemove.remove();
        }
    }

    private notifyItemSelected(itemId: string) {
        this.itemSelectedListeners.forEach((listener: (id: string) => void) => {
            listener(itemId);
        });
    }

    onItemSelected(handler: (itemId: string) => void) {
        this.itemSelectedListeners.push(handler);
    }

    getButtons(): Button[] {
        return this.buttons;
    }
}

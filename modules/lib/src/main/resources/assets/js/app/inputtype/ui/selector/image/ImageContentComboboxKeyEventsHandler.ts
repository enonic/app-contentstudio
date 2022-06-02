import {KeyEventsHandler} from '@enonic/lib-admin-ui/event/KeyEventsHandler';
import {DropdownGrid} from '@enonic/lib-admin-ui/ui/selector/DropdownGrid';
import {ComboBoxOptionFilterInput} from '@enonic/lib-admin-ui/ui/selector/combobox/ComboBoxOptionFilterInput';
import {ImageContentComboBox} from './ImageContentComboBox';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';

export class ImageContentComboboxKeyEventsHandler
    extends KeyEventsHandler {

    private static CELLS_IN_ROW: number = 3;
    private input: ComboBoxOptionFilterInput;
    private grid: DropdownGrid<MediaTreeSelectorItem>;
    private lastSelectedCol: number = 0;
    public static debug: boolean = false;

    constructor(comboBox: ImageContentComboBox) {
        super();
        this.input = comboBox.getComboBox().getInput();
        this.grid = comboBox.getComboBox().getComboBoxDropdownGrid();

        this.onLeft(this.handleLeft.bind(this));
        this.onUp(this.handleUp.bind(this));
        this.onRight(this.handleRight.bind(this));
        this.onDown(this.handleDown.bind(this));
    }

    private handleLeft(e: KeyboardEvent): boolean {
        const activeRow = this.grid.getActiveRow();
        if (ImageContentComboboxKeyEventsHandler.debug) {
            console.debug('ImageContentComboboxKeyEventsHandler.handleLeft: active row = ' + activeRow);
        }
        if (activeRow >= 0) {
            e.stopPropagation();
            e.preventDefault();
            this.adjustCell(activeRow, -1);
            return true;
        }
    }

    private handleUp(e: KeyboardEvent): boolean {
        const activeRow = this.grid.getActiveRow();
        if (ImageContentComboboxKeyEventsHandler.debug) {
            console.debug('ImageContentComboboxKeyEventsHandler.handleUp: active row = ' + activeRow);
        }
        if (activeRow >= 0) {
            e.stopPropagation();
            e.preventDefault();
            if (this.isFirstRow(activeRow)) {
                this.lastSelectedCol = activeRow;
                this.grid.resetActiveSelection();
                this.input.giveFocus();
            } else {
                this.adjustRow(activeRow, -1);
            }
            return true;
        }

        if (this.grid.getGrid().hasClass('reverted')) {
            this.handleDown(e);
            return true;
        }
    }

    private handleRight(e: KeyboardEvent): boolean {
        const activeRow = this.grid.getActiveRow();
        if (ImageContentComboboxKeyEventsHandler.debug) {
            console.debug('ImageContentComboboxKeyEventsHandler.handleRight: active row = ' + activeRow);
        }
        if (activeRow >= 0) {
            e.stopPropagation();
            e.preventDefault();
            this.adjustCell(activeRow, 1);
            return true;
        }
    }

    private handleDown(e: KeyboardEvent): boolean {
        if (!this.grid.isVisible()) {
            // use default down handler if grid is not visible to show dropdown
            return false;
        }
        e.stopPropagation();
        e.preventDefault();
        const activeRow = this.grid.getActiveRow();
        if (ImageContentComboboxKeyEventsHandler.debug) {
            console.debug('ImageContentComboboxKeyEventsHandler.handleDown: active row = ' + activeRow);
        }
        if (activeRow >= 0) {
            this.adjustRow(activeRow, 1);
        } else {
            this.grid.navigateToRow(this.lastSelectedCol);
        }
        return true;
    }

    private isFirstRow(activeRow: number): boolean {
        return activeRow / ImageContentComboboxKeyEventsHandler.CELLS_IN_ROW < 1;
    }

    private adjustRow(activeRow: number, increment: number) {
        const desiredRow = activeRow + increment * ImageContentComboboxKeyEventsHandler.CELLS_IN_ROW;
        return this.grid.navigateToRow(Math.min(desiredRow, this.grid.getOptionCount() - 1));
    }

    private adjustCell(activeRow: number, increment: number) {
        const cells = ImageContentComboboxKeyEventsHandler.CELLS_IN_ROW;
        const cols = activeRow % cells;
        const fullRows = activeRow - cols;
        const rowLength = Math.min(this.grid.getOptionCount() - fullRows, cells);   // check if row is not complete
        let delta = (cols + increment) % rowLength;
        if (delta < 0) {
            delta += rowLength;
        }
        return this.grid.navigateToRow(fullRows + delta);
    }
}

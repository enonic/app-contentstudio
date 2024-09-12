import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {AccessibilityHelper} from '../util/AccessibilityHelper';
import {IncludeChildrenToggler} from './IncludeChildrenToggler';
import {StatusSelectionItem} from './StatusSelectionItem';

export type ItemStateChangeListener = (itemId: ContentId, enabled: boolean) => void;

export class TogglableStatusSelectionItem
    extends StatusSelectionItem {

    private itemStateChangedListeners: ItemStateChangeListener[] = [];

    private id: ContentId;

    private toggler?: IncludeChildrenToggler;

    constructor(viewer: Viewer<ContentSummaryAndCompareStatus>, item: ContentSummaryAndCompareStatus) {
        super(viewer, item);

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        if (this.item.getContentSummary().hasChildren()) {
            this.toggler = new IncludeChildrenToggler();
        }

        this.id = this.item.getContentSummary().getContentId();
    }

    protected initListeners(): void {
        this.whenRendered(() => this.addTabIndexToTogglerAndRemoveElements());

        this.toggler?.onStateChanged((enabled: boolean) => {
            this.notifyItemStateChanged((this.getBrowseItem() as ContentSummaryAndCompareStatus).getContentId(), enabled);
        });
    }

    public doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            if (this.toggler) {
                this.prependChild(this.toggler);
                this.addClass('toggleable');
            }

            return rendered;
        });
    }

    public setReadOnly(value: boolean) {
        if (this.toggler) {
            this.toggler.setReadOnly(value);
        }
    }

    hasChildrenItems(): boolean {
        return this.item.getContentSummary()?.hasChildren();
    }

    toggleIncludeChildren(condition?: boolean, silent?: boolean): boolean {
        return !!this.toggler?.toggle(condition, silent);
    }

    getContentId(): ContentId {
        return this.id;
    }

    setTogglerActive(value: boolean) {
        this.toggleClass('toggleable', value);
    }

    includesChildren(): boolean {
        return !this.toggler || this.toggler.isEnabled();
    }

    public onItemStateChanged(listener: ItemStateChangeListener) {
        this.itemStateChangedListeners.push(listener);
    }

    public unItemStateChanged(listener: ItemStateChangeListener) {
        this.itemStateChangedListeners = this.itemStateChangedListeners.filter((current) => {
            return current !== listener;
        });
    }

    private notifyItemStateChanged(item: ContentId, enabled: boolean) {
        this.itemStateChangedListeners.forEach((listener) => {
            listener(item, enabled);
        });
    }

    private addTabIndexToTogglerAndRemoveElements() {
        if (this.toggler) {
            AccessibilityHelper.makeTabbable(this.toggler);
        }
        if (this.removeEl) {
            AccessibilityHelper.makeTabbable(this.removeEl);
        }
    }
}

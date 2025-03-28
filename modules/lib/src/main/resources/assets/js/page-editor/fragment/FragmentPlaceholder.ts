import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {FragmentComponentView} from './FragmentComponentView';
import {ShowWarningLiveEditEvent} from '../ShowWarningLiveEditEvent';
import {LayoutItemType} from '../layout/LayoutItemType';
import {GetContentByIdRequest} from '../../app/resource/GetContentByIdRequest';
import {Content} from '../../app/content/Content';
import {LayoutComponentType} from '../../app/page/region/LayoutComponentType';
import {SetFragmentComponentEvent} from '../event/outgoing/manipulation/SetFragmentComponentEvent';
import {FragmentDropdown} from '../../app/wizard/page/contextwindow/inspect/region/FragmentDropdown';
import Q from 'q';
import {ContentSummary} from '../../app/content/ContentSummary';
import {ContentId} from '../../app/content/ContentId';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';

export class FragmentPlaceholder
    extends ItemViewPlaceholder {

    private fragmentComponentView: FragmentComponentView;

    private fragmentDropdown: FragmentDropdown;

    private comboboxWrapper: DivEl;

    constructor() {
        super();

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.comboboxWrapper = new DivEl('rich-combobox-wrapper');
        this.fragmentDropdown = new FragmentDropdown();
    }

    protected initListeners(): void {
        this.fragmentDropdown.onSelectionChanged((selectionChange: SelectionChange<ContentSummary>) => {
            if (selectionChange.selected?.length > 0) {
                const contentId: ContentId = selectionChange.selected[0].getContentId();

                if (this.isInsideLayout()) {
                    new GetContentByIdRequest(contentId).sendAndParse().done((content: Content) => {
                        let fragmentComponent = content.getPage() ? content.getPage().getFragment() : null;

                        if (fragmentComponent && fragmentComponent.getType() instanceof LayoutComponentType) {
                            this.fragmentDropdown.setSelectedFragment(null);
                            new ShowWarningLiveEditEvent(i18n('notify.nestedLayouts')).fire();
                        } else {
                            new SetFragmentComponentEvent(this.fragmentComponentView.getPath(), contentId.toString()).fire();
                            this.fragmentComponentView.showLoadingSpinner();
                        }
                    });
                } else {
                    new SetFragmentComponentEvent(this.fragmentComponentView.getPath(), contentId.toString()).fire();
                    this.fragmentComponentView.showLoadingSpinner();
                }
            }
        });
    }

    private isInsideLayout(): boolean {
        let parentRegion = this.fragmentComponentView.getParentItemView();
        if (!parentRegion) {
            return false;
        }
        let parent = parentRegion.getParentItemView();
        if (!parent) {
            return false;
        }

        return parent.getType() instanceof LayoutItemType;
    }

    setComponentView(fragmentComponentView: FragmentComponentView): void {
        this.fragmentComponentView = fragmentComponentView;
        this.fragmentDropdown.setSitePath(this.fragmentComponentView.getLiveEditParams().sitePath);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('icon-pie');
            this.addClassEx('fragment-placeholder');

            this.comboboxWrapper.appendChild(this.fragmentDropdown);
            this.appendChild(this.comboboxWrapper);

            return rendered;
        });
    }

    select() {
        if (!this.isRendered()) {
            this.whenRendered(() => this.select());
        } else {
            this.comboboxWrapper.show();
        }
    }

    deselect() {
        this.comboboxWrapper.hide();
    }

    focus(): void {
        if (!this.isRendered()) {
            this.whenRendered(() => this.focus());
        } else {
            this.fragmentDropdown.giveFocus();
        }
    }
}

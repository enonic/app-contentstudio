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
import {OptionSelectedEvent} from '@enonic/lib-admin-ui/ui/selector/OptionSelectedEvent';
import {ContentSummary} from '../../app/content/ContentSummary';
import {ContentId} from '../../app/content/ContentId';

export class FragmentPlaceholder
    extends ItemViewPlaceholder {

    private fragmentComponentView: FragmentComponentView;

    private fragmentDropdown: FragmentDropdown;

    private comboboxWrapper: DivEl;

    constructor(fragmentView: FragmentComponentView) {
        super();

        this.fragmentComponentView = fragmentView;

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.comboboxWrapper = new DivEl('rich-combobox-wrapper');
        this.fragmentDropdown = new FragmentDropdown();
        this.fragmentDropdown.setSitePath(this.fragmentComponentView.getLiveEditParams().sitePath);
    }

    protected initListeners(): void {
        this.fragmentDropdown.onOptionSelected((event: OptionSelectedEvent<ContentSummary>) => {
            const contentId: ContentId = event.getOption().getDisplayValue().getContentId();

            if (this.isInsideLayout()) {
                new GetContentByIdRequest(contentId).sendAndParse().done((content: Content) => {
                    let fragmentComponent = content.getPage() ? content.getPage().getFragment() : null;

                    if (fragmentComponent && fragmentComponent.getType() instanceof LayoutComponentType) {
                        this.fragmentDropdown.deselectOptions();
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
            this.fragmentDropdown.giveFocus();
        }
    }

    deselect() {
        this.comboboxWrapper.hide();
    }
}

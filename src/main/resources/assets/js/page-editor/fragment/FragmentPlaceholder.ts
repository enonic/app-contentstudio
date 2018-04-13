import './../../api.ts';
import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {FragmentComponentView} from './FragmentComponentView';
import {ShowWarningLiveEditEvent} from '../ShowWarningLiveEditEvent';
import {LayoutItemType} from '../layout/LayoutItemType';
import {FragmentOptionDataLoader} from './FragmentOptionDataLoader';
import FragmentComponent = api.content.page.region.FragmentComponent;
import GetContentByIdRequest = api.content.resource.GetContentByIdRequest;
import Content = api.content.Content;
import LayoutComponentType = api.content.page.region.LayoutComponentType;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import i18n = api.util.i18n;
import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;

export class FragmentPlaceholder
    extends ItemViewPlaceholder {

    private fragmentComponentView: FragmentComponentView;

    private comboBox: api.content.ContentComboBox<ContentTreeSelectorItem>;

    private comboboxWrapper: api.dom.DivEl;

    constructor(fragmentView: FragmentComponentView) {
        super();
        this.addClassEx('fragment-placeholder');
        this.fragmentComponentView = fragmentView;

        this.comboboxWrapper = new api.dom.DivEl('rich-combobox-wrapper');

        let sitePath = this.fragmentComponentView.getLiveEditModel().getSiteModel().getSite().getPath().toString();
        let loader = new FragmentOptionDataLoader().setParentSitePath(sitePath);

        this.comboBox = api.content.ContentComboBox.create()
            .setMaximumOccurrences(1)
            .setLoader(loader)
            .setMinWidth(270)
            .setTreegridDropdownEnabled(false)
            .setTreeModeTogglerAllowed(false)
            .build();

        this.comboboxWrapper.appendChildren(this.comboBox);
        this.appendChild(this.comboboxWrapper);

        this.comboBox.onOptionSelected((event: SelectedOptionEvent<ContentTreeSelectorItem>) => {

            let component: FragmentComponent = this.fragmentComponentView.getComponent();
            let fragmentContent = event.getSelectedOption().getOption().displayValue;

            if (this.isInsideLayout()) {
                new GetContentByIdRequest(fragmentContent.getContentId()).sendAndParse().done((content: Content) => {
                    let fragmentComponent = content.getPage() ? content.getPage().getFragment() : null;

                    if (fragmentComponent && api.ObjectHelper.iFrameSafeInstanceOf(fragmentComponent.getType(), LayoutComponentType)) {
                        this.comboBox.clearSelection();
                        new ShowWarningLiveEditEvent(i18n('notify.nestedLayouts')).fire();

                    } else {
                        component.setFragment(fragmentContent.getContentId(), fragmentContent.getDisplayName());
                        this.fragmentComponentView.showLoadingSpinner();
                    }
                });
            } else {
                component.setFragment(fragmentContent.getContentId(), fragmentContent.getDisplayName());
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
        return api.ObjectHelper.iFrameSafeInstanceOf(parent.getType(), LayoutItemType);
    }

    select() {
        this.comboboxWrapper.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboboxWrapper.hide();
    }
}

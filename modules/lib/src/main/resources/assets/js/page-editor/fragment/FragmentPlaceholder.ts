import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ItemViewPlaceholder} from '../ItemViewPlaceholder';
import {FragmentComponentView} from './FragmentComponentView';
import {ShowWarningLiveEditEvent} from '../ShowWarningLiveEditEvent';
import {LayoutItemType} from '../layout/LayoutItemType';
import {FragmentOptionDataLoader} from './FragmentOptionDataLoader';
import {ContentComboBox} from '../../app/inputtype/ui/selector/ContentComboBox';
import {ContentTreeSelectorItem} from '../../app/item/ContentTreeSelectorItem';
import {GetContentByIdRequest} from '../../app/resource/GetContentByIdRequest';
import {Content} from '../../app/content/Content';
import {FragmentComponent} from '../../app/page/region/FragmentComponent';
import {LayoutComponentType} from '../../app/page/region/LayoutComponentType';
import {SelectedOptionEvent} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';

export class FragmentPlaceholder
    extends ItemViewPlaceholder {

    private fragmentComponentView: FragmentComponentView;

    private comboBox: ContentComboBox<ContentTreeSelectorItem>;

    private comboboxWrapper: DivEl;

    constructor(fragmentView: FragmentComponentView) {
        super();

        this.addClass('icon-pie');
        this.addClassEx('fragment-placeholder');
        this.fragmentComponentView = fragmentView;

        this.comboboxWrapper = new DivEl('rich-combobox-wrapper');

        let sitePath = this.fragmentComponentView.getLiveEditModel().getSiteModel().getSite().getPath().toString();
        let loader = new FragmentOptionDataLoader().setParentSitePath(sitePath);

        this.comboBox = ContentComboBox.create()
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
            let fragmentContent = event.getSelectedOption().getOption().getDisplayValue();

            if (this.isInsideLayout()) {
                new GetContentByIdRequest(fragmentContent.getContentId()).sendAndParse().done((content: Content) => {
                    let fragmentComponent = content.getPage() ? content.getPage().getFragment() : null;

                    if (fragmentComponent && ObjectHelper.iFrameSafeInstanceOf(fragmentComponent.getType(), LayoutComponentType)) {
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
        return ObjectHelper.iFrameSafeInstanceOf(parent.getType(), LayoutItemType);
    }

    select() {
        this.comboboxWrapper.show();
        this.comboBox.giveFocus();
    }

    deselect() {
        this.comboboxWrapper.hide();
    }
}

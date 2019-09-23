import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {FragmentSelectorForm} from './FragmentSelectorForm';
import {FragmentComponentView} from '../../../../../../page-editor/fragment/FragmentComponentView';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import {LayoutItemType} from '../../../../../../page-editor/layout/LayoutItemType';
import {FragmentDropdown} from './FragmentDropdown';
import {GetContentSummaryByIdRequest} from '../../../../../resource/GetContentSummaryByIdRequest';
import {GetContentByIdRequest} from '../../../../../resource/GetContentByIdRequest';
import {ContentUpdatedEvent} from '../../../../../event/ContentUpdatedEvent';
import {EditContentEvent} from '../../../../../event/EditContentEvent';
import {Content} from '../../../../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../../../../content/ContentSummaryAndCompareStatus';
import {FragmentComponent} from '../../../../../page/region/FragmentComponent';
import {ComponentPropertyChangedEvent} from '../../../../../page/region/ComponentPropertyChangedEvent';
import {LayoutComponentType} from '../../../../../page/region/LayoutComponentType';
import ContentSummary = api.content.ContentSummary;
import ContentId = api.content.ContentId;
import Option = api.ui.selector.Option;
import OptionSelectedEvent = api.ui.selector.OptionSelectedEvent;
import Button = api.ui.button.Button;
import i18n = api.util.i18n;

export class FragmentInspectionPanel
    extends ComponentInspectionPanel<FragmentComponent> {

    private fragmentView: FragmentComponentView;

    private fragmentSelector: FragmentDropdown;

    private fragmentForm: FragmentSelectorForm;

    private editFragmentButton: Button;

    private handleSelectorEvents: boolean = true;

    private componentPropertyChangedEventHandler: (event: ComponentPropertyChangedEvent) => void;

    private contentUpdatedListener: (event: any) => void;

    constructor() {
        super(<ComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType('fragment')
        });

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.fragmentSelector = new FragmentDropdown();
        this.fragmentForm = new FragmentSelectorForm(this.fragmentSelector, i18n('field.fragment'));
    }

    private initListeners() {
        this.componentPropertyChangedEventHandler = (event: ComponentPropertyChangedEvent) => {
            // Ensure displayed selector option is removed when fragment is removed
            if (event.getPropertyName() === FragmentComponent.PROPERTY_FRAGMENT) {
                if (!this.component.hasFragment()) {
                    // this.fragmentSelector.setContent(null);
                    this.fragmentSelector.setSelection(null);
                }
            }
        };

        this.handleContentUpdatedEvent();
        this.initSelectorListeners();
    }

    setModel(liveEditModel: LiveEditModel) {
        super.setModel(liveEditModel);
        this.fragmentSelector.setModel(liveEditModel);
        this.fragmentSelector.load();
    }

    layout() {
        this.removeChildren();
        this.appendChild(this.fragmentForm);
        this.appendEditTemplateButton();
    }

    private appendEditTemplateButton() {
        this.editFragmentButton = new Button(i18n('action.editFragment'));
        this.editFragmentButton.addClass('blue large');

        this.editFragmentButton.onClicked(() => {
            const fragmentId: ContentId = this.component.getFragment();
            if (fragmentId) {
                const fragment: ContentSummary = this.fragmentSelector.getSelection(fragmentId);
                const fragmentContent: ContentSummaryAndCompareStatus = ContentSummaryAndCompareStatus.fromContentSummary(fragment);

                new EditContentEvent([fragmentContent]).fire();
            }
        });

        this.fragmentForm.appendChild(this.editFragmentButton);
    }

    private handleContentUpdatedEvent() {
        this.contentUpdatedListener = (event: ContentUpdatedEvent) => {
            // update currently selected option if this is the one updated
            if (this.component && event.getContentId().equals(this.component.getFragment())) {
                this.fragmentSelector.getSelectedOption().displayValue = event.getContentSummary();
            }
        };
        ContentUpdatedEvent.on(this.contentUpdatedListener);

        this.onRemoved((event) => {
            ContentUpdatedEvent.un(this.contentUpdatedListener);
        });
    }

    setFragmentComponentView(fragmentView: FragmentComponentView) {
        this.fragmentView = fragmentView;
    }

    setFragmentComponent(fragment: FragmentComponent) {
        this.unregisterComponentListeners();

        this.setComponent(fragment);
        this.updateSelectorValue();

        this.registerComponentListeners();
    }

    private updateSelectorValue() {
        const contentId: ContentId = this.component.getFragment();
        if (contentId) {
            const fragment: ContentSummary = this.fragmentSelector.getSelection(contentId);
            if (fragment) {
                this.setSelectorValue(fragment);
            } else {
                new GetContentSummaryByIdRequest(contentId).sendAndParse().then((receivedFragment: ContentSummary) => {
                    this.setSelectorValue(receivedFragment);
                }).catch((reason: any) => {
                    if (this.isNotFoundError(reason)) {
                        this.setSelectorValue(null);
                    } else {
                        api.DefaultErrorHandler.handle(reason);
                    }
                }).done();
            }
        } else {
            this.setSelectorValue(null);
        }
    }

    private registerComponentListeners() {
        if (this.component) {
            this.component.onPropertyChanged(this.componentPropertyChangedEventHandler);
        }
    }

    private unregisterComponentListeners() {
        if (this.component) {
            this.component.unPropertyChanged(this.componentPropertyChangedEventHandler);
        }
    }

    private setSelectorValue(fragment: ContentSummary) {
        this.handleSelectorEvents = false;
        if (fragment) {
            let option = this.fragmentSelector.getOptionByValue(fragment.getId().toString());
            if (!option) {
                this.fragmentSelector.addFragmentOption(fragment);
            }
        }
        this.fragmentSelector.setSelection(fragment);
        this.editFragmentButton.setEnabled(!!fragment);
        this.handleSelectorEvents = true;
    }

    private initSelectorListeners() {

        this.fragmentSelector.onOptionSelected((selectedOption: OptionSelectedEvent<ContentSummary>) => {
            if (this.handleSelectorEvents) {
                let option: Option<ContentSummary> = selectedOption.getOption();
                let fragmentContent = option.displayValue;

                if (this.isInsideLayout()) {
                    new GetContentByIdRequest(fragmentContent.getContentId()).sendAndParse().done((content: Content) => {
                        let fragmentComponent = content.getPage() ? content.getPage().getFragment() : null;

                        if (fragmentComponent &&
                            api.ObjectHelper.iFrameSafeInstanceOf(fragmentComponent.getType(), LayoutComponentType)) {
                            api.notify.showWarning(i18n('notify.nestedLayouts'));

                        } else {
                            this.component.setFragment(fragmentContent.getContentId(), fragmentContent.getDisplayName());
                        }
                    });
                } else {
                    this.component.setFragment(fragmentContent.getContentId(), fragmentContent.getDisplayName());
                }
            }
        });
    }

    private isInsideLayout(): boolean {
        let parentRegion = this.fragmentView.getParentItemView();
        if (!parentRegion) {
            return false;
        }
        let parent = parentRegion.getParentItemView();
        if (!parent) {
            return false;
        }
        return api.ObjectHelper.iFrameSafeInstanceOf(parent.getType(), LayoutItemType);
    }

    cleanUp() {
        this.unregisterComponentListeners();
        this.component = null;
    }

    getName(): string {
        return i18n('live.view.insert.fragment');
    }

}

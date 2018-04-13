import Option = api.ui.selector.Option;

import ContentSummary = api.content.ContentSummary;

import RichDropdown = api.ui.selector.dropdown.RichDropdown;
import ContentSummaryViewer = api.content.ContentSummaryViewer;
import FragmentContentSummaryLoader = api.content.FragmentContentSummaryLoader;
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';

export class FragmentDropdown
    extends RichDropdown<ContentSummary> {

    protected loader: FragmentContentSummaryLoader;

    private model: LiveEditModel;

    constructor(model: LiveEditModel) {

        super({
            optionDisplayValueViewer: new ContentSummaryViewer(),
            dataIdProperty: 'value'
        });

        this.model = model;
    }

    load() {
        this.loader
            .setParentSitePath(this.model.getSiteModel().getSite().getPath().toString())
            .setContentPath(this.model.getContent().getPath());

        this.loader.load();
    }

    setModel(model: LiveEditModel) {
        this.model = model;
    }

    protected createLoader(): FragmentContentSummaryLoader {
        return new FragmentContentSummaryLoader();
    }

    protected createOption(fragment: ContentSummary): Option<ContentSummary> {
        let indices: string[] = [];
        indices.push(fragment.getDisplayName());
        indices.push(fragment.getName().toString());

        return <Option<ContentSummary>>{
            value: fragment.getId().toString(),
            displayValue: fragment,
            indices: indices
        };
    }

    addFragmentOption(fragment: ContentSummary) {
        if (fragment) {
            this.addOption(this.createOption(fragment));
        }
    }

    setSelection(fragment: ContentSummary) {

        if (fragment) {
            let option = this.getOptionByValue(fragment.getId().toString());
            if (option) {
                this.selectOption(option, true);
            }
        } else {
            this.reset();
        }
    }

    getSelection(contentId: ContentId): ContentSummary {
        let id = contentId.toString();
        if (id) {
            let option = this.getOptionByValue(id);
            if (option) {
                return option.displayValue;
            }
        }
        return null;
    }
}

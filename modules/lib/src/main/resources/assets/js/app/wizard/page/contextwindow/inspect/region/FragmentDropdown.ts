import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {FragmentContentSummaryLoader} from './FragmentContentSummaryLoader';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {RichDropdown} from 'lib-admin-ui/ui/selector/dropdown/RichDropdown';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummaryViewer} from '../../../../../content/ContentSummaryViewer';
import {ContentSummary} from '../../../../../content/ContentSummary';

export class FragmentDropdown
    extends RichDropdown<ContentSummary> {

    protected loader: FragmentContentSummaryLoader;

    private model: LiveEditModel;

    constructor() {
        super({
            optionDisplayValueViewer: new ContentSummaryViewer(),
            dataIdProperty: 'value'
        });
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

        return Option.create<ContentSummary>()
                .setValue(fragment.getId().toString())
                .setDisplayValue(fragment)
                .setIndices(indices)
                .build();
    }

    addFragmentOption(fragment: ContentSummary) {
        if (fragment) {
            this.addOption(this.createOption(fragment));
        }
    }

    setSelection(fragment: ContentSummary) {
        this.resetActiveSelection();
        this.resetSelected();

        if (fragment) {
            let option = this.getOptionByValue(fragment.getId().toString());
            if (option) {
                this.selectOption(option, true);
            }
        } else {
            this.reset();
            this.hideDropdown();
        }
    }

    getSelection(contentId: ContentId): ContentSummary {
        let id = contentId.toString();
        if (id) {
            let option = this.getOptionByValue(id);
            if (option) {
                return option.getDisplayValue();
            }
        }
        return null;
    }
}

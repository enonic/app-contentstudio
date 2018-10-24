import {BaseInspectionPanel} from './BaseInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../page-editor/ItemViewIconClassResolver';
import {Content} from '../../../../content/Content';
import i18n = api.util.i18n;

export class ContentInspectionPanel
    extends BaseInspectionPanel {

    private content: Content;

    private namesAndIcon: api.app.NamesAndIconView;

    constructor() {
        super();

        this.namesAndIcon =
            new api.app.NamesAndIconView(new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.medium)).setIconClass(
                ItemViewIconClassResolver.resolveByType('content', 'icon-xlarge'));

        this.appendChild(this.namesAndIcon);
    }

    setContent(content: Content) {

        this.content = content;

        if (content) {
            this.namesAndIcon.setMainName(content.getDisplayName());
            this.namesAndIcon.setSubName(content.getPath().toString());
        } else {
            this.namesAndIcon.setMainName(i18n('field.inspection.noContent'));
            this.namesAndIcon.setSubName('');
        }
    }

}

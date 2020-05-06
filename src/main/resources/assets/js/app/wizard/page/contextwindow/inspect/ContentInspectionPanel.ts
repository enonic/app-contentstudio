import {i18n} from 'lib-admin-ui/util/Messages';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {BaseInspectionPanel} from './BaseInspectionPanel';
import {ItemViewIconClassResolver} from '../../../../../page-editor/ItemViewIconClassResolver';
import {Content} from '../../../../content/Content';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';

export class ContentInspectionPanel
    extends BaseInspectionPanel {

    private content: Content;

    private namesAndIcon: NamesAndIconView;

    constructor() {
        super();

        this.namesAndIcon =
            new NamesAndIconView(new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.medium)).setIconClass(
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

    getName(): string {
        return i18n('field.content');
    }

}

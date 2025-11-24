import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../../app/view/context/WidgetItemView';
import {useI18n} from '../../../../../hooks/useI18n';
import {GetContentByIdRequest} from '../../../../../../../app/resource/GetContentByIdRequest';
import {Content} from '../../../../../../../app/content/Content';
import {ContentAccessDescription} from './ContentAccessDescription';
import {PermissionsList} from './PermissionsList';
import {EditPermissionsButton} from './EditPermissionsButton';
import Q from 'q';
import {Title} from '../utils';

type Props = {
    content?: Content;
};

async function loadContent(contentSummary: ContentSummaryAndCompareStatus): Promise<Content | undefined> {
    try {
        const request = new GetContentByIdRequest(contentSummary.getContentId());
        const content = await request.sendAndParse();

        return content;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}

const DetailsWidgetPermissionsSection = ({content}: Props): ReactElement => {
    if (!content) return;

    return (
        <div>
            <Title text={useI18n('field.contextPanel.details.sections.permissions')} />
            <div className="flex flex-col gap-2.5 my-5">
                <ContentAccessDescription content={content} />
                <PermissionsList content={content} />
            </div>
            <div className="flex justify-end">
                <EditPermissionsButton content={content} />
            </div>
        </div>
    );
};

DetailsWidgetPermissionsSection.displayName = 'DetailsWidgetPermissionsSection';

/**
 * Wrapper
 */

export class DetailsWidgetPermissionsSectionElement
    extends LegacyElement<typeof DetailsWidgetPermissionsSection>
    implements WidgetItemViewInterface
{
    constructor(props: Props) {
        super(props, DetailsWidgetPermissionsSection);
    }

    // Backwards compatibility

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        if (!item) return;

        loadContent(item).then((content: Content) => {
            this.props.setKey('content', content);
        });

        return Q();
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}

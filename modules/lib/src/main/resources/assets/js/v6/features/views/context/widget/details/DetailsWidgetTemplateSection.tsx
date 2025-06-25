import {Link, Separator, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useEffect, useState} from 'react';
import {Content} from '../../../../../../app/content/Content';
import {PageTemplate} from '../../../../../../app/content/PageTemplate';
import {Descriptor} from '../../../../../../app/page/Descriptor';
import {PageMode} from '../../../../../../app/page/PageMode';
import {ContentUrlHelper} from '../../../../../../app/util/ContentUrlHelper';
import {
    loadComponentDescriptor,
    loadDefaultPageTemplate,
    loadNearestSite,
    loadPageTemplate,
} from '../../../../api/details';
import {useI18n} from '../../../../hooks/useI18n';
import {TemplateIcon} from '../../../../shared/icons/TemplateIcon';
import {ItemLabel} from '../../../../shared/ItemLabel';
import {$detailsWidgetContent} from '../../../../store/context/detailsWidgets.store';

type State = {
    mode: PageMode;
    template: PageTemplate | null;
    descriptor: Descriptor | null;
};

type ModeTranslations = Record<PageMode, string>;

function getDisplayName(content: Content, state: State, translations: ModeTranslations): string {
    if (content.isPageTemplate()) {
        return content.getDisplayName();
    }

    return translations[state.mode];
}

async function attemptAutomaticMode(content: Content): Promise<State> {
    const site = await loadNearestSite(content.getContentId());

    const defaultPageTemplate = site ? await loadDefaultPageTemplate(site.getContentId(), content.getType()) : undefined;

    if (defaultPageTemplate?.isPage()) {
        return {mode: PageMode.AUTOMATIC, template: defaultPageTemplate, descriptor: null};
    }

    return {mode: PageMode.NO_CONTROLLER, template: null, descriptor: null};
}

async function getState(content: Content): Promise<State> {
    if (content.getType().isFragment()) {
        return {mode: PageMode.FRAGMENT, template: null, descriptor: null};
    }

    if (content.isPage() && content.getPage().hasTemplate()) {
        const template = await loadPageTemplate(content.getPage().getTemplate());

        if (template) {
            return {mode: PageMode.FORCED_TEMPLATE, template, descriptor: null};
        }

        return attemptAutomaticMode(content);
    }

    if (content.isPage()) {
        const descriptor = await loadComponentDescriptor(content);

        if (descriptor) {
            return {mode: PageMode.FORCED_CONTROLLER, template: null, descriptor};
        }
    }

    return attemptAutomaticMode(content);
}

const DETAILS_WIDGET_TEMPLATE_SECTION_NAME = 'DetailsWidgetTemplateSection';

export const DetailsWidgetTemplateSection = (): ReactElement => {
    const content = useStore($detailsWidgetContent);
    const [state, setState] = useState<State>({mode: PageMode.NO_CONTROLLER, template: null, descriptor: null});

    const titleText = useI18n('field.contextPanel.details.sections.template');
    const modeTranslations: ModeTranslations = {
        [PageMode.AUTOMATIC]: useI18n('widget.pagetemplate.automatic'),
        [PageMode.FORCED_CONTROLLER]: useI18n('widget.pagetemplate.forcedcontroller'),
        [PageMode.FORCED_TEMPLATE]: useI18n('widget.pagetemplate.forcedtemplate'),
        [PageMode.FRAGMENT]: useI18n('widget.pagetemplate.fragment'),
        [PageMode.NO_CONTROLLER]: useI18n('widget.pagetemplate.default'),
    };

    useEffect(() => {
        if (!content) return;

        getState(content).then(setState);
    }, [content]);

    if (!content || state.mode === PageMode.NO_CONTROLLER) return null;

    const displayName = getDisplayName(content, state, modeTranslations);

    return (
        <section data-component={DETAILS_WIDGET_TEMPLATE_SECTION_NAME} className="flex flex-col gap-5">
            <Separator label={titleText} />
            <ItemLabel
                icon={<TemplateIcon pageMode={state.mode} size={24} />}
                primary={displayName}
                secondary={
                    state.template ? (
                        <Tooltip value={state.template.getPath().toString()}>
                            <Link
                                target="_blank"
                                className="text-xs text-subtle truncate"
                                href={ContentUrlHelper.generateEditContentUrl(state.template.getContentId())}
                                title={state.template.getDisplayName()}
                            >
                                {state.template.getDisplayName()}
                            </Link>
                        </Tooltip>
                    ) : state.descriptor ? (
                        <Tooltip value={state.descriptor.getKey().toString()}>
                            <span className="text-xs text-subtle truncate" title={state.descriptor.getDisplayName()}>
                                {state.descriptor.getDisplayName()}
                            </span>
                        </Tooltip>
                    ) : null
                }
            />
        </section>
    );
};

DetailsWidgetTemplateSection.displayName = DETAILS_WIDGET_TEMPLATE_SECTION_NAME;

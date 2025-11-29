import {ReactElement, useEffect, useState} from 'react';
import {loadComponentDescriptor, loadDefaultPageTemplate, loadNearestSite, loadPageTemplate, Title} from './utils';
import {Content} from '../../../../../../app/content/Content';
import {PageTemplate} from '../../../../../../app/content/PageTemplate';
import {PageMode} from '../../../../../../app/page/PageMode';
import {Link, Tooltip} from '@enonic/ui';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentUrlHelper} from '../../../../../../app/util/ContentUrlHelper';
import {Descriptor} from '../../../../../../app/page/Descriptor';
import {TemplateIcon} from '../../../../shared/icons/TemplateIcon';
import {$detailsWidgetContent} from '../../../../store/context/detailsWidgets.store';
import {useStore} from '@nanostores/preact';

type State = {
    mode: PageMode;
    template: PageTemplate | null;
    descriptor: Descriptor | null;
};

function getDisplayName(content: Content, state: State): string {
    if (content.isPageTemplate()) {
        return content.getDisplayName();
    }

    switch (state.mode) {
        case PageMode.AUTOMATIC:
            return useI18n('widget.pagetemplate.automatic');
        case PageMode.FORCED_CONTROLLER:
            return useI18n('widget.pagetemplate.forcedcontroller');
        case PageMode.FORCED_TEMPLATE:
            return useI18n('widget.pagetemplate.forcedtemplate');
        case PageMode.FRAGMENT:
            return useI18n('widget.pagetemplate.fragment');
        default:
            return useI18n('widget.pagetemplate.default');
    }
}

async function attemptAutomaticMode(content: Content): Promise<State> {
    const site = await loadNearestSite(content.getContentId());

    const defaultPageTemplate = await loadDefaultPageTemplate(site.getContentId(), content.getType());

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

export const DetailsWidgetTemplateSection = (): ReactElement => {
    const content = useStore($detailsWidgetContent);
    const [state, setState] = useState<State>({mode: PageMode.NO_CONTROLLER, template: null, descriptor: null});

    useEffect(() => {
        if (!content) return;

        getState(content).then(setState);
    }, [content]);

    if (!content || state.mode === PageMode.NO_CONTROLLER) return undefined;

    return (
        <div>
            <Title text={useI18n('field.contextPanel.details.sections.template')} />
            <div className="my-4">
                <div className="flex gap-7.5 items-center">
                    {/* Icon */}
                    <TemplateIcon pageMode={state.mode} className="shrink-0" />
                    <div className="flex flex-col gap-1 overflow-hidden">
                        {/* Name */}
                        <span className="text-sm truncate" title={getDisplayName(content, state)}>
                            {getDisplayName(content, state)}
                        </span>

                        {/* Descriptor */}
                        {state.template ? (
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
                                <span
                                    className="text-xs text-subtle truncate"
                                    title={state.descriptor.getDisplayName()}
                                >
                                    {state.descriptor.getDisplayName()}
                                </span>
                            </Tooltip>
                        ) : undefined}
                    </div>
                </div>
            </div>
        </div>
    );
};

DetailsWidgetTemplateSection.displayName = 'DetailsWidgetTemplateSection';

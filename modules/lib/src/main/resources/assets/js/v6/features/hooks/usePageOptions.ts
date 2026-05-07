import {useStore} from '@nanostores/preact';
import {LayoutTemplate, type LucideIcon, SquareChartGantt, SquareCode, WandSparkles} from 'lucide-react';
import {useMemo} from 'react';
import type {PageTemplate} from '../../../app/content/PageTemplate';
import {$contentContext, $defaultPageTemplateName, usePageState} from '../store/page-editor';
import {
    $isPageInspectionLoading,
    $pageConfigDescriptor,
    $pageControllerOptions,
    $pageTemplateOptions,
    $selectedPageOptionKey,
} from '../store/page-inspection.store';
import {useI18n} from './useI18n';

export const AUTO_KEY = '__auto__';

export type PageOptionType = 'auto' | 'template' | 'controller';

export type PageOption = {
    key: string;
    label: string;
    description: string;
    type: PageOptionType;
    icon: LucideIcon;
};

export type UsePageOptionsResult = {
    options: PageOption[];
    filteredOptions: PageOption[];
    selectedOption: PageOption | undefined;
    selectedKey: string | null;
    selection: string[];
    isLoading: boolean;
};

function getTemplateIcon(template: PageTemplate): LucideIcon {
    return template.getDisplayName() === 'Custom' ? SquareChartGantt : LayoutTemplate;
}

export function usePageOptions(searchValue?: string): UsePageOptionsResult {
    const page = usePageState();
    const ctx = useStore($contentContext);
    const defaultTemplateName = useStore($defaultPageTemplateName);
    const templates = useStore($pageTemplateOptions);
    const controllers = useStore($pageControllerOptions);
    const pageConfigDescriptor = useStore($pageConfigDescriptor);
    const selectedKey = useStore($selectedPageOptionKey);
    const isLoading = useStore($isPageInspectionLoading);

    const autoLabel = useI18n('widget.pagetemplate.automatic');
    const noDefaultLabel = useI18n('field.page.template.noDefault');
    const noDescriptionLabel = useI18n('text.noDescription');

    const isFragment = page?.isFragment() ?? false;
    const showAutoOption = ctx != null && !ctx.isPageTemplate && !isFragment;
    const autoDescription = defaultTemplateName ? `(${defaultTemplateName})` : noDefaultLabel;

    const options = useMemo((): PageOption[] => {
        const result: PageOption[] = [];

        if (showAutoOption) {
            result.push({
                key: AUTO_KEY,
                label: autoLabel,
                description: autoDescription,
                type: 'auto',
                icon: WandSparkles,
            });
        }

        for (const template of templates) {
            result.push({
                key: template.getKey().toString(),
                label: template.getDisplayName(),
                description: template.getPath()?.toString() ?? template.getKey().toString(),
                type: 'template',
                icon: getTemplateIcon(template),
            });
        }

        for (const controller of controllers) {
            result.push({
                key: controller.getKey().toString(),
                label: controller.getDisplayName(),
                description: controller.getDescription() || noDescriptionLabel,
                type: 'controller',
                icon: SquareCode,
            });
        }

        return result;
    }, [showAutoOption, autoLabel, autoDescription, noDescriptionLabel, templates, controllers]);

    const filteredOptions = useMemo(() => {
        if (!searchValue) return options;
        const lower = searchValue.toLowerCase();
        return options.filter(option => option.label.toLowerCase().includes(lower));
    }, [searchValue, options]);

    const selectedOption = useMemo((): PageOption | undefined => {
        const fromOptions = options.find(option => option.key === selectedKey);
        if (fromOptions != null) {
            return fromOptions;
        }

        if (page?.hasController()) {
            const controllerKey = page.getController();
            const controllerKeyString = controllerKey.toString();
            const matchingDescriptor = pageConfigDescriptor != null
                && pageConfigDescriptor.getKey().toString() === controllerKeyString
                ? pageConfigDescriptor
                : null;

            return {
                key: controllerKeyString,
                label: matchingDescriptor != null
                    ? matchingDescriptor.getDisplayName()
                    : controllerKey.getName().toString(),
                description: matchingDescriptor != null
                    ? matchingDescriptor.getDescription() || noDescriptionLabel
                    : controllerKeyString,
                type: 'controller',
                icon: SquareCode,
            };
        }

        if (page?.hasTemplate()) {
            const templateKey = page.getTemplate().toString();
            return {
                key: templateKey,
                label: templateKey,
                description: templateKey,
                type: 'template',
                icon: LayoutTemplate,
            };
        }

        return undefined;
    }, [noDescriptionLabel, options, page, pageConfigDescriptor, selectedKey]);

    return {
        options,
        filteredOptions,
        selectedOption,
        selectedKey,
        selection: selectedKey != null ? [selectedKey] : [],
        isLoading,
    };
}

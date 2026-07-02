import { useStore } from '@nanostores/preact';
import { LayoutTemplate, type LucideIcon, SquareChartGantt, SquareCode, WandSparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { PageTemplate } from '../../../app/content/PageTemplate';
import { $contentContext, $defaultPageTemplateName, usePageState } from '../store/page-editor';
import {
    $isPageInspectionLoading,
    $pageConfigDescriptor,
    $pageControllerOptions,
    $pageTemplateOptions,
    $selectedPageOptionKey,
} from '../store/page-inspection.store';
import { useI18n } from '../../shared/lib/hooks/useI18n';

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
    selectedKey: string | undefined;
    selection: string[];
    isLoading: boolean;
};

function getTemplateIcon(template: PageTemplate): LucideIcon {
    return template.getDisplayName() === 'Custom' ? SquareChartGantt : LayoutTemplate;
}

export function useSelectedPageOption(): PageOption | undefined {
    const page = usePageState();
    const ctx = useStore($contentContext);
    const defaultTemplateName = useStore($defaultPageTemplateName);
    const templates = useStore($pageTemplateOptions);
    const controllers = useStore($pageControllerOptions);
    const pageConfigDescriptor = useStore($pageConfigDescriptor);
    const selectedKey = useStore($selectedPageOptionKey) ?? undefined;

    const autoLabel = useI18n('widget.pagetemplate.automatic');
    const noDefaultLabel = useI18n('field.page.template.noDefault');
    const noDescriptionLabel = useI18n('text.noDescription');

    return useMemo((): PageOption | undefined => {
        if (selectedKey === AUTO_KEY) {
            const isFragment = page?.isFragment() ?? false;
            const showAutoOption = ctx != null && !ctx.isPageTemplate && !isFragment;
            if (!showAutoOption) return undefined;
            return {
                key: AUTO_KEY,
                label: autoLabel,
                description: defaultTemplateName ? `(${defaultTemplateName})` : noDefaultLabel,
                type: 'auto',
                icon: WandSparkles,
            };
        }

        if (selectedKey !== undefined) {
            const template = templates.find((t) => t.getKey().toString() === selectedKey);
            if (template != null) {
                return {
                    key: selectedKey,
                    label: template.getDisplayName(),
                    description: template.getPath()?.toString() ?? selectedKey,
                    type: 'template',
                    icon: getTemplateIcon(template),
                };
            }

            const controller = controllers.find((c) => c.getKey().toString() === selectedKey);
            if (controller != null) {
                return {
                    key: selectedKey,
                    label: controller.getDisplayName(),
                    description: controller.getDescription() || noDescriptionLabel,
                    type: 'controller',
                    icon: SquareCode,
                };
            }
        }

        if (page?.hasController()) {
            const controllerKey = page.getController();
            const controllerKeyString = controllerKey.toString();
            const matchingDescriptor =
                pageConfigDescriptor != null && pageConfigDescriptor.getKey().toString() === controllerKeyString
                    ? pageConfigDescriptor
                    : null;

            return {
                key: controllerKeyString,
                label:
                    matchingDescriptor != null
                        ? matchingDescriptor.getDisplayName()
                        : controllerKey.getName().toString(),
                description:
                    matchingDescriptor != null
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
    }, [
        page,
        ctx,
        defaultTemplateName,
        templates,
        controllers,
        pageConfigDescriptor,
        selectedKey,
        autoLabel,
        noDefaultLabel,
        noDescriptionLabel,
    ]);
}

export function usePageOptions(searchValue?: string): UsePageOptionsResult {
    const page = usePageState();
    const ctx = useStore($contentContext);
    const defaultTemplateName = useStore($defaultPageTemplateName);
    const templates = useStore($pageTemplateOptions);
    const controllers = useStore($pageControllerOptions);
    const selectedKey = useStore($selectedPageOptionKey) ?? undefined;
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
        return options.filter((option) => option.label.toLowerCase().includes(lower));
    }, [searchValue, options]);

    const selectedOption = useSelectedPageOption();

    return {
        options,
        filteredOptions,
        selectedOption,
        selectedKey,
        selection: selectedKey !== undefined ? [selectedKey] : [],
        isLoading,
    };
}

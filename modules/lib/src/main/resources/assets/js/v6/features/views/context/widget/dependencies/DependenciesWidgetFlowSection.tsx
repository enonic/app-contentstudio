import {ReactElement, useCallback} from 'react';
import {DependencyType} from '../../../../../../app/browse/DependencyType';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {Button} from '@enonic/ui';
import {useI18n} from '../../../../hooks/useI18n';
import {capitalize} from '../../../../utils/format/capitalize';
import {ShowDependenciesEvent} from '../../../../../../app/browse/ShowDependenciesEvent';
import {DependencyParams} from '../../../../../../app/browse/DependencyParams';
import {ContentId} from '../../../../../../app/content/ContentId';
import {DependencyItem} from '.';

type DependenciesProps = {
    type: DependencyType;
    dependencies: DependencyItem[];
    contentId: ContentId;
};

type ShowAllButtonProps = Omit<DependenciesProps, 'dependencies'> & {total: number};

const DEPENDENCIES_WIDGET_FLOW_SECTION_NAME = 'DependenciesWidgetFlowSection';

export const DependenciesWidgetFlowSection = (props: DependenciesProps): ReactElement => {
    const {type, dependencies} = props;
    const noDependenciesLabel = useI18n(`field.widget.noDependencies.${type}`);
    const total = dependencies.reduce((acc, dependency) => acc + dependency.itemCount, 0);

    if (total === 0) {
        return (
            <span data-component={DEPENDENCIES_WIDGET_FLOW_SECTION_NAME} className="text-center text-sm text-subtle">
                {noDependenciesLabel}
            </span>
        );
    }

    if (type === DependencyType.INBOUND) {
        return (
            <div data-component={DEPENDENCIES_WIDGET_FLOW_SECTION_NAME} className="space-y-7.5 w-full">
                <DependenciesList {...props} />
                <ShowAllButton {...props} total={total} />
            </div>
        );
    }

    return (
        <div data-component={DEPENDENCIES_WIDGET_FLOW_SECTION_NAME} className="space-y-7.5 w-full">
            <ShowAllButton {...props} total={total} />
            <DependenciesList {...props} />
        </div>
    );
};

DependenciesWidgetFlowSection.displayName = DEPENDENCIES_WIDGET_FLOW_SECTION_NAME;

/**
 *  Internal Components
 */

const DependenciesList = ({type, dependencies, contentId}: DependenciesProps) => {
    const toLabel = useCallback((contentType: ContentTypeName, itemCount: number): string => {
        const name = contentType.toString().split(':').pop();

        if (!name) return contentType.toString();

        const ctyName = name
            .split('-')
            .map((s) => capitalize(s))
            .join(' ');

        return `${ctyName} (${itemCount})`;
    }, []);

    const onDependencyClick = useCallback(
        (dependency: DependencyItem) => {
            new ShowDependenciesEvent(
                DependencyParams.create()
                    .setContentId(contentId)
                    .setDependencyType(type)
                    .setContentType(dependency.contentType)
                    .build()
            ).fire();
        },
        [contentId, type]
    );

    return (
        <ul className="list-none flex flex-col gap-2.5">
            {dependencies.map((dependency) => (
                <li key={dependency.contentType.toString()}>
                    <Button
                        className="flex justify-start items-center gap-2.5 w-full"
                        onClick={() => onDependencyClick(dependency)}
                    >
                        <ContentIcon contentType={dependency.contentType.toString()} url={dependency.iconUrl} />
                        <span className="font-semibold">{toLabel(dependency.contentType, dependency.itemCount)}</span>
                    </Button>
                </li>
            ))}
        </ul>
    );
};

DependenciesList.displayName = 'DependenciesList';

const ShowAllButton = ({type, contentId, total}: ShowAllButtonProps) => {
    const showAllDependenciesLabel =
        type === DependencyType.INBOUND
            ? useI18n('field.contextPanel.showAllInbound', total)
            : useI18n('field.contextPanel.showAllOutbound', total);

    const onShowDependenciesClick = useCallback(() => {
        new ShowDependenciesEvent(
            DependencyParams.create().setContentId(contentId).setDependencyType(type).build()
        ).fire();
    }, [contentId, type]);

    return (
        <Button
            className="mx-auto block"
            onClick={onShowDependenciesClick}
            label={showAllDependenciesLabel}
            variant="outline"
        />
    );
};

ShowAllButton.displayName = 'ShowAllButton';

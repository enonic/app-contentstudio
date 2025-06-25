import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {Button} from '@enonic/ui';
import {ReactElement, useCallback} from 'react';
import {DependencyItem} from '.';
import {DependencyParams} from '../../../../../../app/browse/DependencyParams';
import {DependencyType} from '../../../../../../app/browse/DependencyType';
import {ShowDependenciesEvent} from '../../../../../../app/browse/ShowDependenciesEvent';
import {ContentId} from '../../../../../../app/content/ContentId';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {capitalize} from '../../../../utils/format/capitalize';

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
            <div
                data-component={DEPENDENCIES_WIDGET_FLOW_SECTION_NAME}
                className="flex flex-col gap-7.5 items-center w-full px-1.5"
            >
                <DependenciesList {...props} />
                <ShowAllButton {...props} total={total} />
            </div>
        );
    }

    return (
        <div
            data-component={DEPENDENCIES_WIDGET_FLOW_SECTION_NAME}
            className="flex flex-col gap-7.5 items-center w-full px-1.5"
        >
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
        <ul className="list-none flex flex-col gap-2.5 w-full first:mt-1.5 last:mb-1.5">
            {dependencies.map((dependency) => (
                <li key={dependency.contentType.toString()}>
                    <Button
                        size="sm"
                        className="flex justify-start items-center gap-2.5 w-full"
                        onClick={() => onDependencyClick(dependency)}
                        label={createLabel(dependency.contentType, dependency.itemCount)}
                    >
                        <ContentIcon contentType={dependency.contentType.toString()} url={dependency.iconUrl} />
                    </Button>
                </li>
            ))}
        </ul>
    );
};

DependenciesList.displayName = 'DependenciesList';

const ShowAllButton = ({type, contentId, total}: ShowAllButtonProps) => {
    const showAllInboundLabel = useI18n('field.contextPanel.showAllInbound', total);
    const showAllOutboundLabel = useI18n('field.contextPanel.showAllOutbound', total);
    const showAllDependenciesLabel = type === DependencyType.INBOUND ? showAllInboundLabel : showAllOutboundLabel;

    const onShowDependenciesClick = useCallback(() => {
        new ShowDependenciesEvent(
            DependencyParams.create().setContentId(contentId).setDependencyType(type).build()
        ).fire();
    }, [contentId, type]);

    return (
        <Button
            size="sm"
            onClick={onShowDependenciesClick}
            label={showAllDependenciesLabel}
            variant="outline"
        />
    );
};

ShowAllButton.displayName = 'ShowAllButton';

function createLabel(contentType: ContentTypeName, itemCount: number): string {
    const name = contentType.toString().split(':').pop();

    if (!name) return contentType.toString();

    const ctyName = name
        .split('-')
        .map((s) => capitalize(s))
        .join(' ');

    return `${ctyName} (${itemCount})`;
}

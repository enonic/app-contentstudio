import {cn, ListItem, type ListItemProps} from '@enonic/ui';
import type {ReactElement} from 'react';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Project} from '../../settings/data/project/Project';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';
import {ProjectIcon} from './ProjectIcon';

export type ProjectItemProps = {
    label: string;
    projectName?: string;
    language?: string;
    hasIcon?: boolean;
    href?: string;
} & Omit<ListItemProps, 'children'>;

export function ProjectItem({
    label,
    projectName,
    language,
    hasIcon,
    className,
    ...rest
}: ProjectItemProps): ReactElement {
    return (
        <ListItem className={cn('cursor-pointer', className)} {...rest}>
            <ListItem.Content className="grid grid-cols-[auto_1fr] gap-2.5 items-center">
                <div className='flex items-center justify-center flex-shrink-0 group-data-[tone=inverse]:text-alt'>
                    <ProjectIcon className="row-span-2 size-8 group-data-[tone=inverse]:!text-alt" projectName={projectName} language={language} hasIcon={hasIcon} />
                </div>
                <div className='min-w-0 text-left'>
                    <h1 className='text-base truncate font-semibold group-data-[tone=inverse]:text-alt'>
                        {label}
                        {language ? <span className="text-sm text-subtle group-data-[tone=inverse]:text-alt">{` (${language})`}</span> : null}
                    </h1>
                    <p className='truncate text-sm text-subtle group-data-[tone=inverse]:text-alt'>{projectName}</p>
                </div>
            </ListItem.Content>
        </ListItem>
    );
}

export class ProjectItemElement
    extends LegacyElement<typeof ProjectItem, ProjectItemProps> {
    private project: Project;

    constructor(project: Project) {
        super(
            {
                label: project.getDisplayName() || project.getName(),
                projectName: project.getName(),
                language: project.getLanguage(),
                hasIcon: !!project.getIcon(),
            },
            ProjectItem,
        );
        this.project = project;
    }

    getProject(): Project {
        return this.project;
    }

    isSelectable(): boolean {
        return ProjectHelper.isAvailable(this.project);
    }

    setSelected(selected: boolean): void {
        this.props.setKey('selected', selected);
    }

    setUrl(value: string, _target?: string): this {
        this.props.setKey('href', value);
        return this;
    }
}

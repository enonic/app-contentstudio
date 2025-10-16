import {ListItem, type ListItemProps} from '@enonic/ui';
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

export function ProjectItemView({
                                    label,
                                    projectName,
                                    language,
                                    hasIcon,
                                    selected,
                                    className,
                                    href,
                                    ...rest
                                }: ProjectItemProps): ReactElement {
    return (
        <ListItem
            {...rest}
        >
            <ListItem.Content className="flex-1 min-w-0 grid-cols-[auto_1fr] gap-2.5 items-center grid">
                <ProjectIcon
                    projectName={projectName}
                    language={language}
                    hasIcon={hasIcon}
                />
                <div>
                <h3 className="text-base leading-5.5">
                    {label}
                    {language ? <span className="text-sm text-subtle">({language})</span> : null}
                </h3>
                <p className="text-sm text-subtle">{projectName}</p>
                </div>
            </ListItem.Content>
        </ListItem>
    );
}

export default ProjectItemView;

export class ProjectItem
    extends LegacyElement<typeof ProjectItemView, ProjectItemProps> {
    private project: Project;

    constructor(project: Project) {
        const displayName = project.getDisplayName() || project.getName();
        const name = project.getName();
        const language = project.getLanguage();
        const icon = project.getIcon();
        console.log(project);
        super(
            {
                label: displayName,
                projectName: name,
                language: language,
                hasIcon: !!icon,
            },
            ProjectItemView,
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

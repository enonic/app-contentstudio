import {ListItem, type ListItemProps} from '@enonic/ui';
import type {ReactElement, ReactNode} from 'react';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Project} from '../../settings/data/project/Project';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';
import ProjectIcon from './ProjectIcon';

export type ProjectItemProps = {
  label: string;
  description?: string;
  language?: string;
  icon?: ReactNode;
  hasIcon?: boolean;
  left?: ReactNode;
  href?: string;
} & Omit<ListItemProps, 'children'>;

export function ProjectItemView({
  label,
  description,
  language,
  icon,
  hasIcon,
  left,
  selected,
  className,
  href,
  onClick,
  role,
  ...rest
}: ProjectItemProps): ReactElement {
  return (
    <ListItem
      selected={selected}
      aria-selected={selected}
      {...rest}
    >
        <ListItem.Left>
            {icon ? (
                <span className="h-6 w-6 rounded">{icon}</span>
            ) : (
                <ProjectIcon
                    name={typeof description === 'string' ? description : undefined}
                    language={language}
                    hasIcon={hasIcon}
                />
            )}
        </ListItem.Left>
            <ListItem.Content>
                <h3 className="text-base leading-5.5">{label}</h3>
                <p className="text-sm text-subtle">{description}</p>

            </ListItem.Content>
    </ListItem>
  );
}

export default ProjectItemView;

// Legacy wrapper so this item can be used in places where AEl/Element-based items are expected
export class ProjectItem extends LegacyElement<typeof ProjectItemView, ProjectItemProps> {
  private project: Project;

  constructor(project: Project) {
    const displayName = project.getDisplayName() || project.getName();
    const name = project.getName();
      const language = project.getLanguage();
      const icon = project.getIcon();



    super(
      {
        label: displayName,
        description: name,
        language: language,
        icon,
        hasIcon: !!(project.getIcon && project.getIcon()),
        selected: false,
        className: '',
      },
      ProjectItemView,
    );
    this.project = project;
    // Mirror legacy CSS hooks
    this.addClass('project-list-item');
    if (this.isSelectable()) {
      this.addClass('selectable');
    }
  }

  // Accessors expected by callers
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

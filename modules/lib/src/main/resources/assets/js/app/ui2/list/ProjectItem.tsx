import {Button, ListItem, type ListItemProps} from '@enonic/ui';
import type {MouseEventHandler, ReactElement, ReactNode} from 'react';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Project} from '../../settings/data/project/Project';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {Flag} from '../../locale/Flag';

export type ProjectItemProps = {
  label: string;
  description?: string;
  icon?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
} & Omit<ListItemProps, 'children'>;

export function ProjectItemView({
  label,
  description,
  icon,
  left,
  right,
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
      className="p-0.75 !outline-none"
      role={role ?? 'listitem'}
      aria-selected={selected}
      {...rest}
    >
      {left && <ListItem.Left>{left}</ListItem.Left>}
      <ListItem.Content className="!outline-none">
        <Button
          className="bg-unset !outline-none w-full h-full rounded-none"
          onClick={onClick}
          title={label}
        >
          <ListItem.DefaultContent label={label} description={description} icon={icon} />
        </Button>
      </ListItem.Content>
      {right && <ListItem.Right>{right}</ListItem.Right>}
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

    // Resolve icon URL or fallback icon class similar to ProjectViewer
    let icon: ReactNode | undefined;
    try {
      if (project.getIcon()) {
        const url = new ProjectIconUrlResolver()
          .setProjectName(project.getName())
          .setTimestamp(new Date().getTime())
          .resolve();
        if (url) {
          icon = <img src={url} alt="" className="h-6 w-6 rounded-sm inline-block align-middle" />;
        }
      } else if (project.getLanguage()) {
        const lang = String(project.getLanguage());
        // Use Flag mapping to resolve proper country class (accounts for nonstandard codes)
        const f = new Flag(lang);
        const countryClass = f.getCountryClass(); // e.g., 'fi-gb' for 'en'
        const dataCode = countryClass.startsWith('fi-') ? countryClass.slice(3) : countryClass;
        icon = (
          <div className={`fi fis flag ${countryClass} inline-block align-middle`} data-code={dataCode} aria-hidden="true" />
        );
      } else {
        const fallbackClass = ProjectIconUrlResolver.getDefaultIcon(project);
        icon = <i className={`${fallbackClass} inline-block align-middle`} aria-hidden="true" />;
      }
    } catch (_e) {
      // ignore if resolver not applicable
    }

    super(
      {
        label: displayName,
        description: name,
        icon,
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

  isSelected(): boolean {
    return this.props.get().selected === true;
  }

  setSelected(selected: boolean): void {
    this.props.setKey('selected', selected);
  }

  setUrl(value: string, _target?: string): this {
    this.props.setKey('href', value);
    return this;
  }

  // Ensure focusing works with Link-wrapped items without changing lib-admin-ui
  override giveFocus(): boolean {
    const root = this.getHTMLElement();

    // Prefer the direct anchor rendered by the Link component
    const directAnchor = root.querySelector(':scope > a');
    if (directAnchor instanceof HTMLElement) {
      directAnchor.focus();
      return true;
    }

    // Fallbacks: common focusable elements inside the item
    const fallback = root.querySelector('a[href], button, input, [tabindex]:not([tabindex="-1"])');
    if (fallback instanceof HTMLElement) {
      fallback.focus();
      return true;
    }

    return super.giveFocus();
  }
}

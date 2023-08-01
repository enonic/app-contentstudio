import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectsComboBox} from './ProjectsComboBox';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {Project} from '../../../../data/project/Project';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

enum PARENT_TYPE {
    PROJECT = 'project', LAYER = 'layer'
}

export class ProjectTypeFormItem
    extends ProjectFormItem {

    private projectsCombobox: ProjectsComboBox;

    private projectsComboLabel: DivEl;

    constructor() {
        super(new ProjectFormItemBuilder(
            new RadioGroup('read-access-radio-group'))
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('settings.field.project.type'))
            .setValidator(Validators.required) as ProjectFormItemBuilder);

        this.initElements();
        this.initListeners();
        this.addClass('project-type-form-item');
    }

    protected initElements(): void {
        const readAccessRadioGroup: RadioGroup = this.getRadioGroup();

        readAccessRadioGroup.addOption(PARENT_TYPE.PROJECT, i18n('settings.items.type.project'));
        readAccessRadioGroup.addOption(PARENT_TYPE.LAYER, i18n('settings.items.type.layer'));

        this.projectsCombobox = new ProjectsComboBox();
        this.projectsCombobox.insertAfterEl(this.getRadioGroup());
        this.projectsCombobox.setEnabled(false);
        this.projectsCombobox.hide();

        this.projectsComboLabel = new DivEl('projects-label').setHtml(i18n('settings.field.project.parent'));
        this.projectsCombobox.prependChild(this.projectsComboLabel);
    }

    protected initListeners(): void {
        this.getRadioGroup().onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();
            const isLayer: boolean = newValue === PARENT_TYPE.LAYER.toString();
            const isToBeVisible: boolean = isLayer || !!this.projectsCombobox.getValue();

            this.projectsCombobox.setEnabled(isLayer);
            this.projectsCombobox.setVisible(isToBeVisible);
            this.projectsComboLabel.setVisible(isToBeVisible);
        });
    }

    private getRadioGroup(): RadioGroup {
        return this.getInput() as RadioGroup;
    }

    setSelectedProject(value: Project): void {
        if (value) {
            this.getRadioGroup().setValue(PARENT_TYPE.LAYER);
            this.projectsCombobox.selectProject(value);
        }
    }

    hasData(): boolean {
        const selectedType: string = this.getRadioGroup().getValue();
        return selectedType === PARENT_TYPE.PROJECT.toString() || (selectedType === PARENT_TYPE.LAYER.toString() && !!this.projectsCombobox.getValue());
    }

    getSelectedProject(): Project {
        return this.getRadioGroup().getValue() === PARENT_TYPE.LAYER.toString() ? this.projectsCombobox.getSelectedDisplayValues()[0] : null;
    }

    onRadioValueChanged(listener: () => void): void {
        this.getRadioGroup().onValueChanged(listener);
    }

    onProjectValueChanged(listener: () => void): void {
        this.projectsCombobox.onValueChanged(listener);
    }
}

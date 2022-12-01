import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectsSelector} from './ProjectsSelector';
import {RadioGroup} from '@enonic/lib-admin-ui/ui/RadioGroup';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {Project} from '../../../../data/project/Project';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

enum PARENT_TYPE {
    PROJECT = 'project', LAYER = 'layer'
}

export class ProjectTypeFormItem
    extends ProjectFormItem {

    private projectsSelector: ProjectsSelector;

    private projectsComboLabel: DivEl;

    constructor() {
        super(<ProjectFormItemBuilder>new ProjectFormItemBuilder(
            new RadioGroup('read-access-radio-group'))
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('settings.field.project.type'))
            .setValidator(Validators.required));

        this.initElements();
        this.initListeners();
        this.addClass('project-type-form-item');
    }

    protected initElements(): void {
        const readAccessRadioGroup: RadioGroup = this.getRadioGroup();

        readAccessRadioGroup.addOption(PARENT_TYPE.PROJECT, i18n('settings.items.type.project'));
        readAccessRadioGroup.addOption(PARENT_TYPE.LAYER, i18n('settings.items.type.layer'));

        this.projectsSelector = new ProjectsSelector();
        this.projectsSelector.insertAfterEl(this.getRadioGroup());
        this.projectsSelector.setEnabled(false);
        this.projectsSelector.hide();

        this.projectsComboLabel = new DivEl('projects-label').setHtml(i18n('settings.field.project.parent'));
        this.projectsSelector.prependChild(this.projectsComboLabel);
    }

    protected initListeners(): void {
        this.getRadioGroup().onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();
            const isLayer: boolean = newValue === PARENT_TYPE.LAYER;
            const isToBeVisible: boolean = isLayer || !!this.projectsSelector.getValue();

            this.projectsSelector.setEnabled(isLayer);
            this.projectsSelector.setVisible(isToBeVisible);
            this.projectsComboLabel.setVisible(isToBeVisible);
        });
    }

    private getRadioGroup(): RadioGroup {
        return <RadioGroup>this.getInput();
    }

    hasData(): boolean {
        const selectedType: string = this.getRadioGroup().getValue();
        return selectedType === PARENT_TYPE.PROJECT || (selectedType === PARENT_TYPE.LAYER && !!this.projectsSelector.getValue());
    }

    getSelectedProjects(): Project[] {
        return this.getRadioGroup().getValue() === PARENT_TYPE.LAYER ? this.projectsSelector.getSelectedDisplayValues() : null;
    }

    onRadioValueChanged(listener: () => void): void {
        this.getRadioGroup().onValueChanged(listener);
    }

    onProjectValueChanged(listener: () => void): void {
        this.projectsSelector.onValueChanged(listener);
    }
}

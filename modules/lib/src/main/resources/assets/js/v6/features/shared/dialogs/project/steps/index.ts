import {ProjectDialogParentStepHeader, ProjectDialogParentStepContent} from './ProjectDialogParentStep';
import {ProjectDialogAccessStepHeader, ProjectDialogAccessStepContent} from './ProjectDialogAccessStep';
import {ProjectDialogRoleStepHeader, ProjectDialogRoleStepContent} from './ProjectDialogRoleStep';
import {ProjectDialogApplicationStepHeader, ProjectDialogApplicationStepContent} from './ProjectDialogApplicationStep';
import {ProjectDialogNameStepHeader, ProjectDialogNameStepContent} from './ProjectDialogNameStep';
import {ProjectDialogSummaryStepHeader, ProjectDialogSummaryStepContent} from './ProjectDialogSummaryStep';

export const ProjectDialogSteps = {
    ParentStep: {
        Header: ProjectDialogParentStepHeader,
        Content: ProjectDialogParentStepContent,
    },
    AccessStep: {
        Header: ProjectDialogAccessStepHeader,
        Content: ProjectDialogAccessStepContent,
    },
    RoleStep: {
        Header: ProjectDialogRoleStepHeader,
        Content: ProjectDialogRoleStepContent,
    },
    ApplicationStep: {
        Header: ProjectDialogApplicationStepHeader,
        Content: ProjectDialogApplicationStepContent,
    },
    NameStep: {
        Header: ProjectDialogNameStepHeader,
        Content: ProjectDialogNameStepContent,
    },
    SummaryStep: {
        Header: ProjectDialogSummaryStepHeader,
        Content: ProjectDialogSummaryStepContent,
    },
};

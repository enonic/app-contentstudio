import {NewProjectDialogParentStepContent, NewProjectDialogParentStepHeader} from './NewProjectDialogParentStep';
import {NewProjectDialogLanguageStepHeader, NewProjectDialogLanguageStepContent} from './NewProjectDialogLanguageStep';
import {NewProjectDialogAccessStepContent, NewProjectDialogAccessStepHeader} from './NewProjectDialogAccessStep';
import {NewProjectDialogRoleStepContent, NewProjectDialogRoleStepHeader} from './NewProjectDialogRoleStep';

export const NewProjectDialogSteps = {
    ParentStep: {
        Header: NewProjectDialogParentStepHeader,
        Content: NewProjectDialogParentStepContent,
    },
    LanguageStep: {
        Header: NewProjectDialogLanguageStepHeader,
        Content: NewProjectDialogLanguageStepContent,
    },
    AccessStep: {
        Header: NewProjectDialogAccessStepHeader,
        Content: NewProjectDialogAccessStepContent,
    },
    RoleStep: {
        Header: NewProjectDialogRoleStepHeader,
        Content: NewProjectDialogRoleStepContent,
    },
};

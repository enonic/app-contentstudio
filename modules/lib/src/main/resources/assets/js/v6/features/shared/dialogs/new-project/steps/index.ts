import {NewProjectDialogParentStepHeader, NewProjectDialogParentStepContent} from './NewProjectDialogParentStep';
import {NewProjectDialogLanguageStepHeader, NewProjectDialogLanguageStepContent} from './NewProjectDialogLanguageStep';
import {NewProjectDialogAccessStepHeader, NewProjectDialogAccessStepContent} from './NewProjectDialogAccessStep';
import {NewProjectDialogRoleStepHeader, NewProjectDialogRoleStepContent} from './NewProjectDialogRoleStep';
import {NewProjectDialogApplicationStepHeader, NewProjectDialogApplicationStepContent} from './NewProjectDialogApplicationStep';
import {NewProjectDialogNameStepHeader, NewProjectDialogNameStepContent} from './NewProjectDialogNameStep';
import {NewProjectDialogSummaryStepHeader, NewProjectDialogSummaryStepContent} from './NewProjectDialogSummaryStep';

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
    ApplicationStep: {
        Header: NewProjectDialogApplicationStepHeader,
        Content: NewProjectDialogApplicationStepContent,
    },
    NameStep: {
        Header: NewProjectDialogNameStepHeader,
        Content: NewProjectDialogNameStepContent,
    },
    SummaryStep: {
        Header: NewProjectDialogSummaryStepHeader,
        Content: NewProjectDialogSummaryStepContent,
    },
};

import {PermissionsDialogAccessStepHeader, PermissionsDialogAccessStepContent} from './PermissionsAccessStep';
import {PermissionsDialogStrategyStepHeader, PermissionsDialogStrategyStepContent} from './PermissionsStrategyStep';
import {PermissionsDialogSummaryStepHeader, PermissionsDialogSummaryStepContent} from './PermissionsSummaryStep';

export const PermissionsDialogSteps = {
    AccessStep: {
        Header: PermissionsDialogAccessStepHeader,
        Content: PermissionsDialogAccessStepContent,
    },
    StrategyStep: {
        Header: PermissionsDialogStrategyStepHeader,
        Content: PermissionsDialogStrategyStepContent,
    },
    SummaryStep: {
        Header: PermissionsDialogSummaryStepHeader,
        Content: PermissionsDialogSummaryStepContent,
    },
};

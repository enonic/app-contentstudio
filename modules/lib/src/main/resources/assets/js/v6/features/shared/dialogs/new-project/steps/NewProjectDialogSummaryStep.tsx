import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {Avatar, Dialog, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {ProjectAccess} from '../../../../../../app/settings/access/ProjectAccess';
import {useI18n} from '../../../../hooks/useI18n';
import {$newProjectDialog} from '../../../../store/dialogs/newProjectDialog.store';
import {$languages} from '../../../../store/languages.store';
import {getInitials} from '../../../../utils/format/initials';
import {ApplicationIcon} from '../../../icons/ApplicationIcon';
import {FlagIcon} from '../../../icons/FlagIcon';

export const NewProjectDialogSummaryStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.summary.title');
    const descriptionLabel = useI18n('dialog.project.wizard.summary.description');

    return <Dialog.StepHeader step="step-summary" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogSummaryStepHeader.displayName = 'NewProjectDialogSummaryStepHeader';

export type NewProjectDialogSummaryStepContentProps = {
    locked?: boolean;
};

export const NewProjectDialogSummaryStepContent = ({locked = false}: NewProjectDialogSummaryStepContentProps): ReactElement => {
    const {
        parentProjects,
        nameData,
        defaultLanguage: defaultLanguageId,
        accessMode,
        permissions,
        roles,
        rolePrincipals,
        applications,
    } = useStore($newProjectDialog, {keys: ['parentProjects', 'nameData', 'defaultLanguage', 'accessMode', 'permissions', 'roles', 'applications', 'rolePrincipals']});
    const languages = useStore($languages);

    // Constants
    const parentProjectLabel = useI18n('dialog.project.wizard.summary.parentProject');
    const parentProjectsLabel = useI18n('dialog.project.wizard.summary.parentProjects');
    const projectNameAndIdLabel = useI18n('dialog.project.wizard.summary.projectNameAndId');
    const languageLabel = useI18n('dialog.project.wizard.summary.language');
    const accessModeLabel = useI18n('dialog.project.wizard.summary.accessMode');
    const permissionsLabel = useI18n('dialog.project.wizard.summary.permissions');
    const applicationsLabel = useI18n('dialog.project.wizard.summary.applications');
    const accessModePublicLabel = useI18n('settings.items.wizard.readaccess.public');
    const accessModePrivateLabel = useI18n('settings.items.wizard.readaccess.private');
    const accessModeCustomLabel = useI18n('settings.items.wizard.readaccess.custom');
    const ownerLabel = useI18n('settings.projects.access.owner');
    const editorLabel = useI18n('settings.projects.access.editor');
    const contributorLabel = useI18n('settings.projects.access.contributor');
    const authorLabel = useI18n('settings.projects.access.author');

    const selectedAccessModeLabel = (() => {
        switch (accessMode) {
            case 'public':
                return accessModePublicLabel;
            case 'private':
                return accessModePrivateLabel;
            case 'custom':
                return accessModeCustomLabel;
            default:
                return '';
        }
    })();

    const principalsByRole = (() => {
        const bucket: Map<string, Principal[]> = new Map<string, Principal[]>();

        const owners = rolePrincipals.filter((principal) => roles[principal.getKey().toString()] === ProjectAccess.OWNER);
        const editors = rolePrincipals.filter((principal) => roles[principal.getKey().toString()] === ProjectAccess.EDITOR);
        const contributors = rolePrincipals.filter((principal) => roles[principal.getKey().toString()] === ProjectAccess.CONTRIBUTOR);
        const authors = rolePrincipals.filter((principal) => roles[principal.getKey().toString()] === ProjectAccess.AUTHOR);

        if (owners.length > 0) bucket.set(ownerLabel, owners);
        if (editors.length > 0) bucket.set(editorLabel, editors);
        if (contributors.length > 0) bucket.set(contributorLabel, contributors);
        if (authors.length > 0) bucket.set(authorLabel, authors);

        return bucket;
    })();

    const defaultLanguage = languages.find((language) => language.id === defaultLanguageId);

    return (
        <Dialog.StepContent step="step-summary" locked={locked}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-7.5 gap-y-5 bg-surface-primary p-5 rounded-md text-sm">
                {parentProjects.length > 0 && (
                    <div className="contents">
                        <dt className="font-semibold">{parentProjects.length > 1 ? parentProjectsLabel : parentProjectLabel}</dt>
                        <dd className="flex flex-col gap-2.5">
                            {parentProjects.map((project) => {
                                const name = project.getDisplayName();
                                const identifier = project.getName();

                                return <span key={identifier}>{`${name} (${identifier})`}</span>;
                            })}
                        </dd>
                    </div>
                )}

                <div className="contents">
                    <dt className="font-semibold">{projectNameAndIdLabel}</dt>
                    <dd>
                        {nameData.name} / {nameData.identifier}
                    </dd>
                </div>

                {defaultLanguage && (
                    <div className="contents">
                        <dt className="font-semibold">{languageLabel}</dt>
                        <dd className="flex gap-2">
                            <FlagIcon language={defaultLanguage.id} className="size-6 -my-0.5" />
                            <span>{defaultLanguage.label}</span>
                        </dd>
                    </div>
                )}

                {accessMode && (
                    <div className="contents">
                        <dt className="font-semibold">{accessModeLabel}</dt>
                        <dd className="flex gap-2.5">
                            <span>{selectedAccessModeLabel}</span>
                            {accessMode === 'custom' &&
                                permissions.map((p) => {
                                    const principalDisplayName = p.getDisplayName();
                                    const principalKey = p.getKey().toString();

                                    return (
                                        <Tooltip key={principalKey} value={principalDisplayName}>
                                            <Avatar size="sm" className="size-6 -my-0.5">
                                                <Avatar.Fallback className="text-alt font-semibold">
                                                    {getInitials(principalDisplayName)}
                                                </Avatar.Fallback>
                                            </Avatar>
                                        </Tooltip>
                                    );
                                })}
                        </dd>
                    </div>
                )}

                {principalsByRole.size > 0 && (
                    <div className="contents">
                        <dt className="font-semibold">{permissionsLabel}</dt>
                        <dd className="grid grid-cols-[auto_1fr] items-center gap-2.5">
                            {Array.from(principalsByRole.entries()).map(([label, principals]) => (
                                <div className="contents" key={label}>
                                    <span>{label}</span>
                                    <div className="flex gap-2.5">
                                        {principals.map((p) => {
                                            const principalDisplayName = p.getDisplayName();
                                            const principalKey = p.getKey().toString();

                                            return (
                                                <Tooltip key={principalKey} value={principalDisplayName}>
                                                    <Avatar size="sm" className="size-6 -my-0.5">
                                                        <Avatar.Fallback className="text-alt font-semibold">
                                                            {getInitials(principalDisplayName)}
                                                        </Avatar.Fallback>
                                                    </Avatar>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </dd>
                    </div>
                )}

                {applications.length > 0 && (
                    <div className="contents">
                        <dt className="font-semibold">{applicationsLabel}</dt>
                        <dd className="grid grid-cols-[auto_1fr] items-center gap-x-1 gap-y-2.5">
                            {applications.map((application) => {
                                const key = application.getApplicationKey().toString();
                                const name = application.getDisplayName();

                                return (
                                    <div className="contents" key={key}>
                                        <ApplicationIcon application={application} className="size-6 -my-0.5" />
                                        <span>{name}</span>
                                    </div>
                                );
                            })}
                        </dd>
                    </div>
                )}
            </dl>
        </Dialog.StepContent>
    );
};

NewProjectDialogSummaryStepContent.displayName = 'NewProjectDialogSummaryStepContent';

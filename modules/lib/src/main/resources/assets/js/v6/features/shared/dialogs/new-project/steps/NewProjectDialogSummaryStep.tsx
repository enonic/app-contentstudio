import {Avatar, Dialog, Tooltip} from '@enonic/ui';
import {ReactElement, useMemo, Fragment} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {useStore} from '@nanostores/preact';
import {$newProjectDialog} from '../../../../store/dialogs/newProjectDialog.store';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectAccess} from '../../../../../../app/settings/access/ProjectAccess';
import {getInitials} from '../../../../utils/format/initials';
import {ApplicationIcon} from '../../../icons/ApplicationIcon';
import {$principals} from '../../../../store/principals.store';
import {$languages} from '../../../../store/languages.store';
import {FlagIcon} from '../../../icons/FlagIcon';

export const NewProjectDialogSummaryStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.summary.title');
    const descriptionLabel = useI18n('dialog.project.wizard.summary.description');

    return <Dialog.StepHeader step="step-summary" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogSummaryStepHeader.displayName = 'NewProjectDialogSummaryStepHeader';

export const NewProjectDialogSummaryStepContent = ({locked = false}: {locked?: boolean}): ReactElement => {
    const {
        parentProjects,
        nameData,
        defaultLanguage: defaultLanguageId,
        accessMode,
        permissions,
        roles,
        applications,
    } = useStore($newProjectDialog);
    const {principals} = useStore($principals);
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
    const selectedAccessModeLabel = useMemo(() => {
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
    }, [accessMode, accessModePublicLabel, accessModePrivateLabel, accessModeCustomLabel]);

    const principalsByRole = useMemo(() => {
        const bucket: Map<string, Principal[]> = new Map<string, Principal[]>();

        const owners = principals.filter((principal) => roles.get(principal.getKey().toString()) === ProjectAccess.OWNER);
        const editors = principals.filter((principal) => roles.get(principal.getKey().toString()) === ProjectAccess.EDITOR);
        const contributors = principals.filter((principal) => roles.get(principal.getKey().toString()) === ProjectAccess.CONTRIBUTOR);
        const authors = principals.filter((principal) => roles.get(principal.getKey().toString()) === ProjectAccess.AUTHOR);

        if (owners.length > 0) bucket.set(ownerLabel, owners);
        if (editors.length > 0) bucket.set(editorLabel, editors);
        if (contributors.length > 0) bucket.set(contributorLabel, contributors);
        if (authors.length > 0) bucket.set(authorLabel, authors);

        return bucket;
    }, [principals, roles, ownerLabel, editorLabel, contributorLabel, authorLabel]);

    const defaultLanguage = useMemo(() => languages.find((language) => language.id === defaultLanguageId), [languages, defaultLanguageId]);

    return (
        <Dialog.StepContent step="step-summary" locked={locked}>
            <div className="grid grid-cols-[auto_1fr] gap-5 bg-surface-primary p-5 rounded-md text-sm">
                {parentProjects.length > 0 && (
                    <>
                        <span className="font-semibold">{parentProjects.length > 1 ? parentProjectsLabel : parentProjectLabel}</span>
                        <div className="flex flex-col gap-2.5">
                            {parentProjects.map((project) => {
                                const name = project.getDisplayName();
                                const identifier = project.getName();

                                return <span key={identifier}>{`${name} (${identifier})`}</span>;
                            })}
                        </div>
                    </>
                )}

                <span className="font-semibold">{projectNameAndIdLabel}</span>
                <span>
                    {nameData.name} / {nameData.identifier}
                </span>

                {defaultLanguage && (
                    <>
                        <span className="font-semibold">{languageLabel}</span>
                        <div className="flex gap-2">
                            <FlagIcon language={defaultLanguage.id} />
                            <span>{defaultLanguage.label}</span>
                        </div>
                    </>
                )}

                {accessMode && (
                    <>
                        <span className="font-semibold">{accessModeLabel}</span>
                        <div className="flex gap-2.5">
                            <span>{selectedAccessModeLabel}</span>
                            {accessMode === 'custom' && (
                                <>
                                    {permissions.map((p) => {
                                        const principalDisplayName = p.getDisplayName();
                                        const principalKey = p.getKey().toString();

                                        return (
                                            <Tooltip key={principalKey} value={principalDisplayName}>
                                                <Avatar size="sm">
                                                    <Avatar.Fallback className="text-alt font-semibold">
                                                        {getInitials(principalDisplayName)}
                                                    </Avatar.Fallback>
                                                </Avatar>
                                            </Tooltip>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </>
                )}

                {principalsByRole.size > 0 && (
                    <>
                        <span className="font-semibold">{permissionsLabel}</span>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-2.5">
                            {Array.from(principalsByRole.entries()).map(([label, principals]) => (
                                <Fragment key={label}>
                                    <span>{label}</span>
                                    <div className="flex gap-2.5">
                                        {principals.map((p) => {
                                            const principalDisplayName = p.getDisplayName();
                                            const principalKey = p.getKey().toString();

                                            return (
                                                <Tooltip key={principalKey} value={principalDisplayName}>
                                                    <Avatar size="sm">
                                                        <Avatar.Fallback className="text-alt font-semibold">
                                                            {getInitials(principalDisplayName)}
                                                        </Avatar.Fallback>
                                                    </Avatar>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </Fragment>
                            ))}
                        </div>
                    </>
                )}

                {applications.length > 0 && (
                    <>
                        <span className="font-semibold">{applicationsLabel}</span>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-1.5">
                            {applications.map((application) => {
                                const key = application.getApplicationKey().toString();
                                const name = application.getDisplayName();

                                return (
                                    <Fragment key={key}>
                                        <ApplicationIcon application={application} />
                                        <span>{name}</span>
                                    </Fragment>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </Dialog.StepContent>
    );
};

NewProjectDialogSummaryStepContent.displayName = 'NewProjectDialogSummaryStepContent';

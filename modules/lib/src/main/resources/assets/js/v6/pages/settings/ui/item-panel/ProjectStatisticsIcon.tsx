import { Tooltip } from '@enonic/ui';
import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { type ChangeEvent, type ReactElement, useEffect, useRef, useState } from 'react';
import { type Project } from '../../../../../app/settings/data/project/Project';
import { updateProjectIcon } from '../../../../entities/project/api/updateProjectIcon.api';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { ProjectIcon } from '../../../../shared/ui/icons/ProjectIcon';

const PROJECT_STATISTICS_ICON_NAME = 'ProjectStatisticsIcon';

const ACCEPTED_ICON_TYPES = 'image/jpeg,image/png,image/gif,image/svg+xml';

type Props = {
    project: Readonly<Project>;
};

export const ProjectStatisticsIcon = ({ project }: Props): ReactElement => {
    const uploadLabel = useI18n('settings.statistics.project.uploadIcon');

    const inputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState(0);
    const [iconVersion, setIconVersion] = useState<string | null>(null);

    const hasIcon = !!project.getIcon() || iconVersion != null;
    const iconHash = iconVersion ?? project.getIcon()?.getSha512();

    useEffect(() => setIconVersion(null), [project]);

    const handleClick = (): void => {
        inputRef.current?.click();
    };

    const handleChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';

        if (!file) return;

        await updateProjectIcon({ projectName: project.getName(), file, onProgress: (_, p) => setProgress(p) }).match(
            () => {
                setIconVersion(String(Date.now()));
            },
            (error) => {
                showError(i18n('notify.upload.error', file.name, error.message));
            }
        );
        setProgress(0);
    };

    return (
        <Tooltip delay={300} value={progress > 0 ? undefined : uploadLabel}>
            <button
                data-component={PROJECT_STATISTICS_ICON_NAME}
                type="button"
                onClick={handleClick}
                disabled={progress > 0}
                aria-label={uploadLabel}
                className="relative inline-flex cursor-pointer overflow-hidden rounded-full transition-opacity hover:opacity-70 disabled:cursor-default disabled:opacity-50"
            >
                {progress > 0 && (
                    <div
                        className="animate-pulse absolute top-0 left-0 h-full bg-success-rev opacity-30"
                        style={{ width: `${progress}%` }}
                    />
                )}
                <ProjectIcon
                    projectName={project.getName()}
                    language={project.getLanguage()}
                    hasIcon={hasIcon}
                    iconHash={iconHash}
                    isLayer={project.hasParents()}
                    className="size-14"
                />
                <input ref={inputRef} type="file" accept={ACCEPTED_ICON_TYPES} className="hidden" onChange={handleChange} />
            </button>
        </Tooltip>
    );
};

ProjectStatisticsIcon.displayName = PROJECT_STATISTICS_ICON_NAME;

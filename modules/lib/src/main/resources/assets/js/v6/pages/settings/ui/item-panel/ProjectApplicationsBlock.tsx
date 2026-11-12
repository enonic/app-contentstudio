import { Separator } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ReactElement, useEffect, useMemo } from 'react';
import { ProjectViewItem } from '../../../../../app/settings/view/ProjectViewItem';
import { $applications, loadApplications, type Application } from '../../../../entities/application';
import { APPLICATION_KEY } from '../../../../shared/lib/cms/application/applicationKey';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { ApplicationIcon } from '../../../../shared/ui/icons/ApplicationIcon';
import { ItemLabel } from '../../../../shared/ui/ItemLabel';

type ProjectApplicationsBlockProps = {
    item: ProjectViewItem;
};

const PROJECT_APPLICATIONS_BLOCK_NAME = 'ProjectApplicationsBlock';

/** The project's own applications, in the order they were selected; the portal is no app. */
export const ProjectApplicationsBlock = ({ item }: ProjectApplicationsBlockProps): ReactElement | null => {
    const headerText = useI18n('settings.items.wizard.step.applications');
    const { applications: installed, loaded } = useStore($applications, { keys: ['applications', 'loaded'] });

    const keys = useMemo(
        () =>
            (item.getSiteConfigs() ?? [])
                .map((config) => config.getApplicationKey().toString())
                .filter((key) => key !== APPLICATION_KEY.PORTAL),
        [item],
    );

    useEffect(() => {
        if (keys.length > 0) {
            void loadApplications();
        }
    }, [keys]);

    if (keys.length === 0) {
        return null;
    }

    const applications = keys.map((key) => installed.find((app) => app.key === key) ?? { key, displayName: key });

    return (
        <section data-component={PROJECT_APPLICATIONS_BLOCK_NAME} className="w-[360px] shrink">
            <Separator label={headerText} />
            <ul className="flex flex-col gap-2 mt-5">
                {applications.map((application) => (
                    <li key={application.key}>
                        <ProjectApplicationLabel application={application} loaded={loaded} />
                    </li>
                ))}
            </ul>
        </section>
    );
};

ProjectApplicationsBlock.displayName = PROJECT_APPLICATIONS_BLOCK_NAME;

//
// * ProjectApplicationLabel
//

type ProjectApplicationLabelProps = {
    application: Application;
    /** Whether the installed applications have been fetched, so a missing one is really unavailable. */
    loaded: boolean;
};

/** Name, icon and description of an app; one this node does not run reads as unavailable once the list is known. */
const ProjectApplicationLabel = ({ application, loaded }: ProjectApplicationLabelProps): ReactElement => {
    const unavailableLabel = useI18n('text.application.unavailable');
    const isInstalled = application.state != null;

    let description: string | undefined;
    if (isInstalled) {
        description = application.description;
    } else if (loaded) {
        description = unavailableLabel;
    }

    return (
        <ItemLabel
            title={application.key}
            icon={<ApplicationIcon application={application} />}
            primary={application.displayName}
            secondary={description}
        />
    );
};

ProjectApplicationLabel.displayName = 'ProjectApplicationLabel';

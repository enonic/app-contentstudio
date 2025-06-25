import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {ReactElement} from 'react';
import {ContentVersion} from '../../../../../app/ContentVersion';
import {VersionItemPublishStatus} from '../../status/VersionItemPublishStatus';
import {getModifierLabel, getOperationLabel} from '../../../store/context/versionStore';

type SelectedVersionCardProps = {
    label: string;
    version: ContentVersion;
};

export const SelectedVersionCard = ({label, version}: SelectedVersionCardProps): ReactElement => {
    const modifierLabel = getModifierLabel(version);
    const operationLabel = getOperationLabel(version);
    const timeLabel = DateHelper.getFormattedTimeFromDate(version.getTimestamp());

    return (
        <div className="flex flex-col gap-5">
            <span className="text-base font-semibold">{label}</span>
            <div className="flex items-center gap-2 px-4.5 py-3 rounded-lg border border-bdr-subtle bg-surface">
                <div className="flex flex-col justify-center grow">
                    <div className="flex gap-1">
                        <span className="shrink-0 text-base text-subtle">
                            {timeLabel}
                        </span>
                        <span className="text-bdr-soft text-base">|</span>
                        <span className="text-base text-subtle">{operationLabel}</span>
                    </div>
                    {modifierLabel && (
                        <div className="text-xs">{modifierLabel}</div>
                    )}
                </div>

                <VersionItemPublishStatus version={version} />
            </div>
        </div>
    );
};

SelectedVersionCard.displayName = 'SelectedVersionCard';

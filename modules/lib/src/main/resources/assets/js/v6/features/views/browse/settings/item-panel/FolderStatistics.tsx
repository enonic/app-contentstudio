import {Folder} from 'lucide-react';
import {ReactElement} from 'react';
import {FolderViewItem} from '../../../../../../app/settings/view/FolderViewItem';
import {ItemHeader} from './ItemHeader';

type FolderStatisticsProps = {
    item: FolderViewItem;
};

const FOLDER_STATISTICS_NAME = 'FolderStatistics';

export const FolderStatistics = ({item}: FolderStatisticsProps): ReactElement => {
    return (
        <div data-component={FOLDER_STATISTICS_NAME} className="flex flex-col gap-5">
            <ItemHeader
                icon={<Folder size={56} />}
                displayName={item.getDisplayName()}
                subtitle={item.getDescription()}
            />
        </div>
    );
};

FolderStatistics.displayName = FOLDER_STATISTICS_NAME;

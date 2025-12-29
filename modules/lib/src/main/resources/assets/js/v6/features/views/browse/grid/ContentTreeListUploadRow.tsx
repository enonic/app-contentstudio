import {FlatTreeNode, TreeList} from '@enonic/ui';
import {ReactElement} from 'react';
import {LoaderCircle} from 'lucide-react';
import {ItemLabel} from '../../../shared/ItemLabel';
import {ContentUploadData} from './ContentUploadData';
import {ProgressBar} from '../../../shared/primitives/ProgressBar';

export const ContentTreeListUploadRow = ({item}: {item: FlatTreeNode<ContentUploadData>}): ReactElement => {
    return (
        <TreeList.Row key={item.id} item={item}>
            <TreeList.RowLeft>
                <span className={'w-3.5'} />
                <TreeList.RowLevelSpacer level={item.level} />
                <TreeList.RowExpandControl data={item} className="hidden" />
            </TreeList.RowLeft>

            <TreeList.RowContent>
                <div className="flex items-center justify-between gap-2.5">
                    <ItemLabel
                        icon={<LoaderCircle size={24} className="animate-spin" />}
                        primary={item.data.name}
                        secondary={item.data.name}
                    />
                    <ProgressBar className="w-[134px] h-2.5" value={item.data.progress} />
                </div>
            </TreeList.RowContent>
        </TreeList.Row>
    );
};

ContentTreeListUploadRow.displayName = 'ContentTreeListUploadRow';

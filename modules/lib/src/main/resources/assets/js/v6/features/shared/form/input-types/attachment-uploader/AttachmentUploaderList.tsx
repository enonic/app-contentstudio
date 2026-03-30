import {cn, GridList, IconButton, Link} from '@enonic/ui';
import {X} from 'lucide-react';
import {getCmsApiUrl} from '../../../../utils/url/cms';

type AttachmentUploaderListProps = {
    names: string[];
    contentId: string;
    onRemove: (index: number) => void;
    disabled: boolean;
};

export const AttachmentUploaderList = ({contentId, names, onRemove, disabled}: AttachmentUploaderListProps) => {
    if (names.length === 0) return null;

    return (
        <GridList disabled={disabled} className="rounded p-2 -m-2">
            {names.map((name, index) => {
                const url = getCmsApiUrl(`media/${contentId}/${encodeURIComponent(name)}`);

                return (
                    <GridList.Row key={name} id={index.toString()} className={cn('flex items-center justify-between gap-2 py-1')}>
                        <GridList.Cell>
                            <GridList.Action>
                                <Link className="flex items-center gap-2 truncate" href={url} target="_blank">
                                    {name}
                                </Link>
                            </GridList.Action>
                        </GridList.Cell>
                        <GridList.Cell>
                            <GridList.Action>
                                <IconButton icon={X} variant="text" onClick={() => onRemove(index)} disabled={disabled} />
                            </GridList.Action>
                        </GridList.Cell>
                    </GridList.Row>
                );
            })}
        </GridList>
    );
};

AttachmentUploaderList.displayName = 'AttachmentUploaderList';

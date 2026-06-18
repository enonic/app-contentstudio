import {type ReactElement} from 'react';
import {cn, GridList, IconButton, Link} from '@enonic/ui';
import {FieldError} from '@enonic/lib-admin-ui/form2';
import {X} from 'lucide-react';
import {getCmsApiUrl} from '../../../../utils/url/cms';

export type AttachmentUploaderListProps = {
    names: string[];
    contentId: string | undefined;
    onRemove: (index: number) => void;
    disabled: boolean;
    errors?: ReadonlyMap<string, string>;
};

export const AttachmentUploaderList = ({contentId, names, onRemove, disabled, errors}: AttachmentUploaderListProps): ReactElement => {
    if (names.length === 0) return null;

    return (
        <GridList disabled={disabled} className="rounded p-2 -m-2">
            {names.map((name, index) => {
                const url = getCmsApiUrl(`media/${contentId}/${encodeURIComponent(name)}`);
                const error = errors?.get(name);

                return (
                    <GridList.Row key={name} id={index.toString()} className={cn('flex items-center justify-between gap-2 py-1')}>
                        <GridList.Cell>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <GridList.Action>
                                    <Link className="flex items-center gap-2 truncate" href={url} target="_blank">
                                        {name}
                                    </Link>
                                </GridList.Action>
                                {error && <FieldError message={error} className="text-sm" />}
                            </div>
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

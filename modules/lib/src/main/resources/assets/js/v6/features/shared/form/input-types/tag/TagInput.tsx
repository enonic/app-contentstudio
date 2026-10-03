import { PropertyPath } from '@enonic/input-types/data';
import type { SelfManagedComponentProps } from '@enonic/input-types';
import { TagInput as BaseTagInput } from '@enonic/input-types';
import { useStore } from '@nanostores/preact';
import { useCallback, useMemo, type ReactElement } from 'react';
import { $contextContent } from '../../../../../widgets/context-panel/model/contextContent.store';
import { suggestContentTags } from './ContentTagSuggester';
import type { TagConfig } from './TagConfig';

export const TagInput = (props: SelfManagedComponentProps<TagConfig>): ReactElement => {
    const contextContent = useStore($contextContent);
    const fallbackDataPath = useMemo(() => PropertyPath.fromString(props.input.getPath().toString()), [props.input]);
    const dataPath = props.dataPath ?? fallbackDataPath;

    const suggestTags = useCallback(
        (query: string) =>
            suggestContentTags({
                query,
                dataPath,
                content: contextContent,
                config: props.config,
            }),
        [contextContent, dataPath, props.config],
    );

    return <BaseTagInput {...props} suggestTags={suggestTags} />;
};

TagInput.displayName = 'TagInput';

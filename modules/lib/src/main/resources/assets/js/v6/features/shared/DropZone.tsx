import {cn} from '@enonic/ui';
import {type DragEvent as ReactDragEvent, type ReactElement, type ReactNode, useCallback, useId, useRef, useState} from 'react';

const DROP_ZONE_NAME = 'DropZone';

type DropZoneProps = {
    hint?: ReactNode;
    icon?: ReactNode;
    accept?: string;
    multiple?: boolean;
    className?: string;
    isDragging?: boolean;
    onFiles: (files: FileList) => void;
};

export const DropZone = ({
    hint,
    icon,
    accept,
    multiple = false,
    className,
    isDragging: externalDragging,
    onFiles,
}: DropZoneProps): ReactElement => {
    const baseId = useId();
    const inputId = `${DROP_ZONE_NAME}-${baseId}-input`
    const inputRef = useRef<HTMLInputElement>(null);
    const [internalDragging, setInternalDragging] = useState(false);

    const isDragging = externalDragging ?? internalDragging;

    const handleChange = useCallback(() => {
        const files = inputRef.current?.files;
        if (files && files.length > 0) {
            onFiles(files);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    }, [onFiles]);

    const handleDrop = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setInternalDragging(false);

        const {files} = e.dataTransfer;
        if (files.length > 0) {
            if (accept) {
                const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
                const dt = new DataTransfer();
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const matches = acceptedTypes.some((type) => {
                        if (type.startsWith('.')) {
                            return file.name.toLowerCase().endsWith(type);
                        }
                        if (type.endsWith('/*')) {
                            return file.type.startsWith(type.slice(0, -1));
                        }
                        return file.type === type;
                    });
                    if (matches) {
                        dt.items.add(file);
                    }
                }
                if (dt.files.length > 0) {
                    onFiles(dt.files);
                }
            } else {
                onFiles(files);
            }
        }
    }, [accept, onFiles]);

    const handleDragOver = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setInternalDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setInternalDragging(false);
    }, []);

    return (
        <div
            data-component={DROP_ZONE_NAME}
            className={cn('size-full', className)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <input
                id={inputId}
                ref={inputRef}
                type='file'
                accept={accept}
                multiple={multiple}
                onChange={handleChange}
                className='peer sr-only'
            />
            <label
                htmlFor={inputId}
                className={cn(
                    'relative flex flex-col gap-2.5 size-full items-center justify-center p-5',
                    'border border-dashed border-info-rev hover:cursor-pointer transition-all',
                    'peer-focus-visible:outline-none peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-3 peer-focus-visible:ring-offset-ring-offset',
                    isDragging && 'bg-info-rev/10 border-solid',
                )}
            >
                {icon}
                {hint && <p className='text-subtle font-lg'>{hint}</p>}
            </label>
        </div>
    );
};

DropZone.displayName = DROP_ZONE_NAME;

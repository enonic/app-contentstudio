import {type ReactElement, type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {type ContentId} from '../../../../../../app/content/ContentId';
import {type Project} from '../../../../../../app/settings/data/project/Project';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {$activeProject} from '../../../../store/projects.store';
import {type Mode, type Crop, type Dimensions, type Point} from './lib/types';
import {
    readNormalizedCropFromPropertySet,
    readNormalizedFocusFromPropertySet,
    readOrientationFromPropertySet,
    setCropInPropertySet,
    setFocusInPropertySet,
} from './lib/propertySet';
import {adjustCropForOrientation, adjustCropToBaseOrientation} from './lib/crop';
import {adjustFocusForOrientation, adjustFocusToBaseOrientation} from './lib/focus';
import {getBase64Image} from './lib/canvas';
import {getImageUrl} from './lib/image';

type ImageUploaderContextValue = {
    contentId?: ContentId;
    project?: Readonly<Project>;
    value: Value;
    enabled: boolean;
    mode?: Mode;
    setMode: (mode: Mode) => void;
    orientation: number;
    setOrientation: (orientation: number) => void;
    imageUrl?: string;
    setImageUrl: (url: string) => void;
    base64Image?: string;
    dimensions?: Dimensions;
    setDimensions: (dimensions: Dimensions) => void;
    crop?: Crop;
    setCrop: (crop: Crop) => void;
    focus: Point | null;
    setFocus: (focus: Point) => void;
    reset: () => void;
};

const ImageUploaderContext = createContext<ImageUploaderContextValue | undefined>(undefined);

type ImageUploaderProviderProps = {
    values: Value[];
    enabled: boolean;
    children: ReactNode;
};

export const ImageUploaderProvider = ({values, enabled, children}: ImageUploaderProviderProps): ReactElement => {
    const value = values[0];

    // the context content id
    const [contentId, setContentId] = useState<ContentId>();
    // the context project
    const [project, setProject] = useState<Readonly<Project>>();
    // ready, crop, focus, loading, error
    const [mode, setMode] = useState<Mode>();
    // 1 to 8, combining both rotation and mirror
    const [orientation, setOrientation] = useState<number>(readOrientationFromPropertySet(value));
    // committedOrientation tracks the orientation that the currently-rendered base64Image + dimensions correspond to.
    const [committedOrientation, setCommittedOrientation] = useState<number>(readOrientationFromPropertySet(value));
    // the raw image url, without cropping or processing
    const [imageUrl, setImageUrl] = useState<string>();
    // the base64 encoded image
    const [base64Image, setBase64Image] = useState<string>();
    // the dimensions of the image
    const [dimensions, setDimensions] = useState<Dimensions>();
    // the crop of the image.
    const [crop, setCrop] = useState<Crop>();
    // the focus of the image
    const [focus, setFocus] = useState<Point>();

    // Refs
    const modeRef = useRef<Mode>(mode);
    modeRef.current = mode;
    const cropInitializedRef = useRef(false);
    const focusInitializedRef = useRef(false);
    const prevCropRef = useRef<Crop | undefined>(undefined);
    const loadRequestIdRef = useRef(0);

    // ============================================================
    // Content & Project id initialization
    // ============================================================
    useEffect(() => {
        const contentId = $contextContent.get()?.getContentId();
        const project = $activeProject.get();

        if (contentId && project) {
            setContentId(contentId);
            setProject(project);
            setImageUrl(getImageUrl(contentId, project));
        }
    }, []);

    // ============================================================
    // Image loading
    // ============================================================
    // Derived flag used as a dep so the effect re-runs when entering/leaving crop mode.
    const isCropEditing = mode === 'crop';

    useEffect(() => {
        if (!imageUrl) return;

        // Don't override edit mode (crop/focus) with loading/ready — those track user intent.
        // Read via ref so setMode('loading') from within the effect doesn't invalidate the snapshot.
        const isEditing = modeRef.current === 'crop' || modeRef.current === 'focus';

        if (!isEditing) setMode('loading');

        const fetchedOrientation = orientation;
        const requestId = ++loadRequestIdRef.current;

        getBase64Image(imageUrl, fetchedOrientation, isCropEditing ? null : crop)
            .then(({base64Image, dimensions}) => {
                if (requestId !== loadRequestIdRef.current) return;
                setBase64Image(base64Image);
                setDimensions(dimensions);
                setCommittedOrientation(fetchedOrientation);
                if (!isEditing) setMode('ready');
            })
            .catch(() => {
                if (requestId !== loadRequestIdRef.current) return;
                setMode('error');
            });
    }, [imageUrl, orientation, crop, isCropEditing]);

    // ============================================================
    // Crop
    // ============================================================
    const setCropToBaseOrientation = useCallback(
        (crop: Crop) => {
            if (!dimensions) return;

            setCrop(adjustCropToBaseOrientation(crop, committedOrientation, dimensions));
        },
        [committedOrientation, dimensions]
    );

    const cropForOrientation = useMemo(() => {
        if (!crop || !dimensions) return;

        return adjustCropForOrientation(crop, committedOrientation, dimensions);
    }, [crop, committedOrientation, dimensions]);

    useEffect(() => {
        if (!crop || !dimensions || mode === 'crop') return;

        setCropInPropertySet(value, cropForOrientation, dimensions);
    }, [value, mode, cropForOrientation, committedOrientation, dimensions]);

    useEffect(() => {
        if (cropInitializedRef.current || !dimensions) return;

        const normalized = readNormalizedCropFromPropertySet(value);
        cropInitializedRef.current = true;

        if (!normalized) return;

        const denormalizedCrop: Crop = {
            x1: normalized.x1 * dimensions.w,
            y1: normalized.y1 * dimensions.h,
            x2: normalized.x2 * dimensions.w,
            y2: normalized.y2 * dimensions.h,
        };

        const newCrop = adjustCropToBaseOrientation(denormalizedCrop, committedOrientation, dimensions);
        setCrop(newCrop);
        prevCropRef.current = newCrop;
    }, [dimensions, committedOrientation, value]);

    // ============================================================
    // Focus
    // ============================================================
    const setFocusToBaseOrientation = useCallback(
        (focus: Point) => {
            if (!dimensions) return;

            setFocus(adjustFocusToBaseOrientation(focus, committedOrientation, dimensions));
        },
        [committedOrientation, dimensions]
    );

    const focusForOrientation = useMemo(() => {
        if (!focus || !dimensions) return null;

        return adjustFocusForOrientation(focus, committedOrientation, dimensions);
    }, [focus, committedOrientation, dimensions]);

    useEffect(() => {
        if (!focus || !dimensions || mode === 'focus') return;

        setFocusInPropertySet(value, focusForOrientation, dimensions);
    }, [value, mode, focusForOrientation, committedOrientation, dimensions]);

    useEffect(() => {
        if (focusInitializedRef.current || !dimensions) return;

        const normalizedCrop = readNormalizedCropFromPropertySet(value);
        if (normalizedCrop && !crop) return;

        const normalized = readNormalizedFocusFromPropertySet(value);
        focusInitializedRef.current = true;

        if (!normalized) return;

        const denormalizedFocus: Point = {
            x: normalized.x * dimensions.w,
            y: normalized.y * dimensions.h,
        };

        setFocus(adjustFocusToBaseOrientation(denormalizedFocus, committedOrientation, dimensions));
    }, [dimensions, committedOrientation, crop, value]);

    useEffect(() => {
        // When entering focus mode with no focus set, initialize it to the crop/image
        // center so Apply persists the same point the SVG displays by default.
        if (mode !== 'focus' || focus || !dimensions) return;

        const cropForOri = crop ? adjustCropForOrientation(crop, committedOrientation, dimensions) : null;
        const center: Point = cropForOri
            ? {x: (cropForOri.x1 + cropForOri.x2) / 2, y: (cropForOri.y1 + cropForOri.y2) / 2}
            : {x: dimensions.w / 2, y: dimensions.h / 2};

        setFocus(adjustFocusToBaseOrientation(center, committedOrientation, dimensions));
    }, [mode, focus, crop, dimensions, committedOrientation]);

    useEffect(() => {
        // Recenter focus after the crop is applied (mode transitions out of 'crop'),
        // not while the user is still drawing/adjusting the crop rectangle.
        if (mode === 'crop') return;
        if (!crop || !dimensions) return;

        const prev = prevCropRef.current;
        prevCropRef.current = crop;

        // Only recenter focus when the crop actually changed, not on every re-render.
        if (prev && prev.x1 === crop.x1 && prev.y1 === crop.y1 && prev.x2 === crop.x2 && prev.y2 === crop.y2) return;

        const cropForOri = adjustCropForOrientation(crop, committedOrientation, dimensions);
        if (!cropForOri) return;

        const cropCenter: Point = {
            x: (cropForOri.x1 + cropForOri.x2) / 2,
            y: (cropForOri.y1 + cropForOri.y2) / 2,
        };

        const newFocus = adjustFocusToBaseOrientation(cropCenter, committedOrientation, dimensions);
        setFocus(newFocus);
        setFocusInPropertySet(value, newFocus, dimensions);
    }, [crop, dimensions, committedOrientation, value, mode]);

    // ============================================================
    // Reset (atomic, stable, no closure staleness)
    // ============================================================
    const reset = useCallback(() => {
        cropInitializedRef.current = false;
        focusInitializedRef.current = false;
        setOrientation(1);
        setCommittedOrientation(1);
        setCrop(null);
        if (dimensions) {
            const sideways = committedOrientation >= 5;
            const baseW = sideways ? dimensions.h : dimensions.w;
            const baseH = sideways ? dimensions.w : dimensions.h;
            setFocus({x: baseW / 2, y: baseH / 2});
        } else {
            setFocus(null);
        }
        setMode('ready');
    }, [dimensions, committedOrientation]);

    // ============================================================
    // Provider
    // ============================================================
    const providerValue = useMemo(
        () => ({
            contentId,
            project,
            value: value,
            enabled,
            mode,
            setMode,
            orientation,
            setOrientation,
            imageUrl,
            setImageUrl,
            base64Image,
            dimensions,
            setDimensions,
            crop: cropForOrientation,
            setCrop: setCropToBaseOrientation,
            focus: focusForOrientation,
            setFocus: setFocusToBaseOrientation,
            reset,
        }),
        [
            contentId,
            project,
            value,
            enabled,
            mode,
            setMode,
            orientation,
            imageUrl,
            base64Image,
            dimensions,
            cropForOrientation,
            setCropToBaseOrientation,
            focusForOrientation,
            setFocusToBaseOrientation,
            reset,
        ]
    );

    return <ImageUploaderContext.Provider value={providerValue}>{children}</ImageUploaderContext.Provider>;
};

ImageUploaderProvider.displayName = 'ImageUploaderProvider';

export const useImageUploaderContext = (): ImageUploaderContextValue => {
    const context = useContext(ImageUploaderContext);

    if (context === undefined) {
        throw new Error('useImageUploaderContext must be used within an ImageUploaderProvider');
    }

    return context;
};

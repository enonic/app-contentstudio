export const createGuardedSocketHandler =
    (isActive: () => boolean) =>
        <T>(handler: (event: T) => void) =>
            (event: T | null | undefined): void => {
                if (event == null || !isActive()) {
                    return;
                }

                handler(event);
            };

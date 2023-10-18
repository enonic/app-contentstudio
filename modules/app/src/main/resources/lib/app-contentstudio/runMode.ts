declare const Java: {
	type: (_classPath: string) => {
		get: () => string
	}
};

export const XP_RUN_MODE = `${Java.type('com.enonic.xp.server.RunMode').get()}`; // PROD || DEV
export const IS_DEV_MODE = XP_RUN_MODE === 'DEV';
export const IS_PROD_MODE = XP_RUN_MODE === 'PROD';

const showLogs =
	( typeof window !== 'undefined' &&
		window?.bigSkyInitialState?.isDevMode ) ||
	false;

const globalConsole = typeof window !== 'undefined' ? window.console : console;

export default {
	info: showLogs ? globalConsole.info.bind( globalConsole ) : () => {},
	warn: showLogs ? globalConsole.warn.bind( globalConsole ) : () => {},
	error: showLogs ? globalConsole.error.bind( globalConsole ) : () => {},
};

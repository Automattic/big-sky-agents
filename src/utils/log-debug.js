const showLogs = true;
// TODO: switch to the following before going to production.
// const showLogs = process.env.DEBUG;

const globalConsole = typeof window !== 'undefined' ? window.console : console;

export default {
	info: showLogs ? globalConsole.info.bind( globalConsole ) : () => {},
	warn: showLogs ? globalConsole.warn.bind( globalConsole ) : () => {},
	error: showLogs ? globalConsole.error.bind( globalConsole ) : () => {},
};

const showLogs = true;
// TODO: switch to the following before going to production.
// const showLogs = process.env.DEBUG;

export default {
	info: showLogs ? console.info.bind( window.console ) : () => {},
	warn: showLogs ? console.warn.bind( window.console ) : () => {},
	error: showLogs ? console.error.bind( window.console ) : () => {},
};

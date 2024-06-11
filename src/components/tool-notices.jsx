/**
 * External dependencies
 */
import Markdown from 'react-markdown';
import { useSelect } from '@wordpress/data';

/**
 * WordPress dependencies
 */
import {
	__unstableAnimatePresence as AnimatePresence,
	__unstableMotion as motion,
	Snackbar,
} from '@wordpress/components';
import { store as messagesStore } from '../store/index.js';

/**
 * Internal dependencies
 */
import { INFORM_TOOL_NAME } from '../agents/tools/inform-user.js';
import { ASK_USER_TOOL_NAME } from '../agents/tools/ask-user.js';
import { CONFIRM_TOOL_NAME } from '../agents/tools/confirm.js';

function ToolNotices() {
	const { toolCallsAndResponses: toolCalls } = useSelect( ( select ) =>
		select( messagesStore ).getToolCalls()
	);
	return (
		<AnimatePresence mode="popLayout">
			<div className="big-sky__tool-notices">
				{ toolCalls
					?.map( ( toolCall, rowId ) => {
						const args = args;
						let argJSON = JSON.stringify( args );
						if ( argJSON.length > 50 ) {
							argJSON = argJSON.substring( 0, 50 ) + '...';
						}
						let content = `${ toolCall.function.name }( ${ argJSON } )`;

						const hasResponse =
							typeof toolCall.response !== 'undefined' &&
							toolCall.response !== null;

						switch ( toolCall.name ) {
							case INFORM_TOOL_NAME:
								content = `Agent said: ${ args.message }`;
								break;
							case ASK_USER_TOOL_NAME:
								content = `Agent asked: ${ args.question }`;
								break;
							case CONFIRM_TOOL_NAME:
								content = `Agent asked user to confirm before proceeding`;
								break;
						}
						return (
							<motion.div
								key={ rowId }
								initial={ {
									opacity: 0,
									scale: 0.5,
								} }
								animate={ { opacity: 1, scale: 1 } }
								transition={ {
									duration: 0.8,
									delay: 0.5,
									ease: [ 0, 0.71, 0.2, 1.01 ],
								} }
							>
								<Snackbar
									className={ `big-sky__tool-notice big-sky__tool-notice-${
										hasResponse ? 'complete' : 'pending'
									}` }
								>
									<Markdown>{ content }</Markdown>
								</Snackbar>
							</motion.div>
						);
					} )
					.reverse() }
			</div>
		</AnimatePresence>
	);
}

export default ToolNotices;

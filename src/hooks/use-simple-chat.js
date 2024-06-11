/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
import useChatModel from './use-chat-model.js';
import uuidv4 from '../utils/uuid.js';

const formatToolResultContent = ( result ) => {
	if ( typeof result === 'undefined' ) {
		return '';
	}
	return typeof result === 'object'
		? JSON.stringify( result )
		: `${ result }`;
};

const useSimpleChat = ( { token, service, model, temperature, feature } ) => {
	const [ started, setStarted ] = useState( false );
	const [ running, setRunning ] = useState( false );
	const [ error, setError ] = useState();
	const [ pendingToolRequests, setPendingToolRequests ] = useState( [] );
	const [ history, setHistory ] = useState( [] );
	const [ enabled, setEnabled ] = useState( true );
	const [ assistantMessage, setAssistantMessage ] = useState();
	const runningRef = useRef( false );
	const chatModel = useChatModel( { token, service } );

	const call = useCallback( ( name, args, id ) => {
		console.log( '🤖 Adding Tool Call', name, args, id );
		id = id ?? uuidv4();
		setHistory( ( messages ) => [
			...messages,
			{
				role: 'assistant',
				content: ' ',
				tool_calls: [
					{
						id,
						type: 'function',
						function: {
							name,
							arguments: JSON.stringify( args ),
						},
					},
				],
			},
		] );
		setPendingToolRequests( ( toolCalls ) => [
			...toolCalls,
			{
				id,
				type: 'function',
				function: {
					name,
					arguments: args,
				},
			},
		] );
	}, [] );

	const setToolCallResultSync = useCallback(
		( toolCallId, result ) => {
			console.log( '🤖 Setting Tool Call Result', toolCallId, result );
			setHistory( ( messages ) => {
				const newCall = {
					role: 'tool',
					tool_call_id: toolCallId,
					content: formatToolResultContent( result ),
				};
				// careful to insert in the correct order
				const toolCallMessage = messages.find( ( callMessage ) => {
					return (
						callMessage.role === 'assistant' &&
						callMessage.tool_calls?.some(
							( toolCall ) => toolCall.id === toolCallId
						)
					);
				} );
				if ( toolCallMessage ) {
					const index = messages.indexOf( toolCallMessage );
					return [
						...messages.slice( 0, index + 1 ),
						newCall,
						...messages.slice( index + 1 ),
					];
				}
				return [ ...messages, newCall ];
			} );
			console.warn(
				'filtering toolcalls to remove ID',
				toolCallId,
				pendingToolRequests
			);
			setPendingToolRequests( ( toolCalls ) =>
				toolCalls.filter( ( toolCall ) => toolCall.id !== toolCallId )
			);
		},
		[ pendingToolRequests ]
	);

	const setToolCallResult = useCallback(
		( toolCallId, result ) => {
			console.log( '🤖 Resolve Tool Call Result', toolCallId );
			// check if result is a Promise
			if ( result instanceof Promise ) {
				result.then( ( value ) => {
					setToolCallResultSync( toolCallId, value );
				} );
			} else {
				setToolCallResultSync( toolCallId, result );
			}
		},
		[ setToolCallResultSync ]
	);

	const clearPendingToolRequests = useCallback( () => {
		setPendingToolRequests( [] );
	}, [] );

	const clearMessages = useCallback( () => {
		setHistory( [] );
	}, [] );

	const userSay = useCallback( ( content, image_urls = [] ) => {
		console.log( '🤖 User Message', content );
		if ( image_urls?.length ) {
			// TODO: check ChatModelType.isMultimodal( model )
			setHistory( ( messages ) => [
				...messages,
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: content,
						},
						...image_urls.map( ( image_url ) => ( {
							type: 'image_url',
							image_url, //: 'data:image/jpeg;base64,$base64'
						} ) ),
					],
				},
			] );
		} else {
			setHistory( ( messages ) => [
				...messages,
				{
					role: 'user',
					content,
				},
			] );
		}
	}, [] );

	const runAgent = useCallback(
		( messages, tools, systemPrompt, nextStepPrompt ) => {
			if (
				! chatModel || // no Chat Model
				! enabled || // disabled
				running || // already running
				error || // error
				runningRef.current || // also already running
				! messages.length > 0 || // nothing to process
				pendingToolRequests.length > 0 || // waiting on tool calls
				assistantMessage // the assistant has a question for the user
			) {
				console.warn( 'not running agent', {
					chatModel,
					error,
					enabled,
					running,
					messages,
					pendingToolRequests,
					assistantMessage,
					feature,
				} );
				return;
			}

			runningRef.current = true;
			setRunning( true );
			chatModel
				.run( {
					model,
					messages,
					tools,
					systemPrompt,
					nextStepPrompt,
					temperature,
					feature,
				} )
				.then( ( message ) => {
					runningRef.current = false;
					setRunning( false );
					console.log( '🤖 Assistant Message', message );
					setAssistantMessage( message.content );
					setHistory( ( hist ) => [ ...hist, message ] );
					if ( message.tool_calls ) {
						setPendingToolRequests( ( toolCalls ) => [
							...toolCalls,
							...message.tool_calls.map( ( tool_call ) => ( {
								...tool_call,
								function: {
									...tool_call.function,
									arguments: JSON.parse(
										tool_call.function.arguments
									),
								},
							} ) ),
						] );
					}
				} )
				.catch( ( e ) => {
					setError( e.message );
				} );
		},
		[
			assistantMessage,
			enabled,
			error,
			chatModel,
			model,
			pendingToolRequests,
			running,
			temperature,
			feature,
		]
	);

	const onReset = useCallback( () => {
		clearPendingToolRequests();
		clearMessages();
		setError( null );
	}, [ clearMessages, clearPendingToolRequests ] );

	return {
		// running state
		running,
		enabled,
		setEnabled,
		started,
		setStarted,
		error,

		// messages
		history,
		clearMessages,
		userSay,
		agentMessage: assistantMessage,

		// tools
		call,
		setToolCallResult,
		pendingToolRequests,
		clearPendingToolRequests,

		runAgent, // run a chat completion with tool, systemPrompt and nextStepPrompt

		onReset,
	};
};

export default useSimpleChat;

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

const useSimpleChat = ( { apiKey, service, model, temperature, feature } ) => {
	const [ started, setStarted ] = useState( false );
	const [ running, setRunning ] = useState( false );
	const [ error, setError ] = useState();
	const [ pendingToolCalls, setPendingToolCalls ] = useState( [] );
	const [ history, setHistory ] = useState( [] );
	const [ enabled, setEnabled ] = useState( true );
	const [ assistantMessage, setAssistantMessage ] = useState();
	const runningRef = useRef( false );
	const chatModel = useChatModel( { apiKey, service, feature } );

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
		setPendingToolCalls( ( toolCalls ) => [
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

	const setToolCallResult = useCallback(
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
				pendingToolCalls
			);
			setPendingToolCalls( ( toolCalls ) =>
				toolCalls.filter( ( toolCall ) => toolCall.id !== toolCallId )
			);
		},
		[ pendingToolCalls ]
	);

	const setToolResult = useCallback(
		( toolCallId, result ) => {
			console.log( '🤖 Resolve Tool Call Result', toolCallId );
			// check if result is a Promise
			if ( result instanceof Promise ) {
				result.then( ( value ) => {
					setToolCallResult( toolCallId, value );
				} );
			} else {
				setToolCallResult( toolCallId, result );
			}
		},
		[ setToolCallResult ]
	);

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

	const runChat = useCallback(
		( tools, instructions, additionalInstructions ) => {
			if (
				! chatModel || // no Chat Model
				! enabled || // disabled
				running || // already running
				error || // error
				runningRef.current || // also already running
				! history.length > 0 || // nothing to process
				pendingToolCalls.length > 0 || // waiting on tool calls
				assistantMessage // the assistant has a question for the user
			) {
				// console.warn( 'not running agent', {
				// 	chatModel,
				// 	error,
				// 	enabled,
				// 	running,
				// 	messages,
				// 	pendingToolRequests,
				// 	assistantMessage,
				// 	feature,
				// } );
				return;
			}

			runningRef.current = true;
			setRunning( true );
			chatModel
				.run( {
					model,
					messages: history,
					tools,
					instructions,
					additionalInstructions,
					temperature,
				} )
				.then( ( message ) => {
					runningRef.current = false;
					setRunning( false );
					console.log( '🤖 Assistant Message', message );
					setAssistantMessage( message.content );
					setHistory( ( hist ) => [ ...hist, message ] );
					if ( message.tool_calls ) {
						setPendingToolCalls( ( toolCalls ) => [
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
			history,
			assistantMessage,
			enabled,
			error,
			chatModel,
			model,
			pendingToolCalls,
			running,
			temperature,
		]
	);

	const onReset = useCallback( () => {
		clearMessages();
		setError( null );
	}, [ clearMessages ] );

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
		assistantMessage,

		// tools
		call,
		setToolResult,
		pendingToolCalls,

		runChat, // run a chat completion with tool, instructions and additionalInstructions

		onReset,
	};
};

export default useSimpleChat;

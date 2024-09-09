import { useEffect } from '@wordpress/element';
import useChat from '../components/chat-provider/use-chat.js';
import useAgents from '../components/agents-provider/use-agents.js';
import { deepEqual } from '../eval/evaluators/utils.js';

const useChatSettings = ( options ) => {
	const {
		apiKey,
		autoCreateAssistant,
		feature,
		service,
		model,
		baseUrl,
		assistantEnabled,
		setApiKey,
		setService,
		setFeature,
		setModel,
		setAssistantEnabled,
		setDefaultAssistantId,
		setBaseUrl,
		setAutoCreateAssistant,
		stream,
		setStream,
		setGraphConfig,
		graphConfig,
	} = useChat();
	const { activeAgentId, setActiveAgent } = useAgents();

	// if chat.apiKey !== apiKey, set it
	useEffect( () => {
		if ( options.apiKey && options.apiKey !== apiKey ) {
			setApiKey( options.apiKey );
		}
	}, [ apiKey, options.apiKey, setApiKey ] );

	// if chat.service !== service, set it
	useEffect( () => {
		if ( options.service && options.service !== service ) {
			setService( options.service );
		}
	}, [ options, service, setService ] );

	// if chat.stream !== stream, set it
	useEffect( () => {
		if ( options.stream !== undefined && options.stream !== stream ) {
			setStream( options.stream );
		}
	}, [ options, stream, setStream ] );

	// if chat.model !== model, set it
	useEffect( () => {
		if ( options.model && options.model !== model ) {
			setModel( options.model );
		}
	}, [ model, options, options.model, setModel ] );

	// if chat.feature !== feature, set it
	useEffect( () => {
		if ( options.feature && options.feature !== feature ) {
			setFeature( options.feature );
		}
	}, [ feature, options.feature, setFeature ] );

	// if assistantEnabled !== assistantEnabled, set it
	useEffect( () => {
		if (
			typeof options.assistantEnabled !== 'undefined' &&
			options.assistantEnabled !== assistantEnabled
		) {
			setAssistantEnabled( options.assistantEnabled );
		}
	}, [ assistantEnabled, options.assistantEnabled, setAssistantEnabled ] );

	// if autoCreateAssistant !== autoCreateAssistant, set it
	useEffect( () => {
		if (
			typeof options.autoCreateAssistant !== 'undefined' &&
			options.autoCreateAssistant !== autoCreateAssistant
		) {
			setAutoCreateAssistant( options.autoCreateAssistant );
		}
	}, [
		autoCreateAssistant,
		options.autoCreateAssistant,
		setAutoCreateAssistant,
	] );

	useEffect( () => {
		if ( options.initialAgentId && ! activeAgentId ) {
			setActiveAgent( options.initialAgentId );
		}
	}, [ activeAgentId, options.initialAgentId, setActiveAgent ] );

	useEffect( () => {
		if ( options.defaultAssistantId ) {
			setDefaultAssistantId( options.defaultAssistantId );
		}
	}, [ options.defaultAssistantId, setDefaultAssistantId ] );

	useEffect( () => {
		if ( options.baseUrl && options.baseUrl !== baseUrl ) {
			setBaseUrl( options.baseUrl );
		}
	}, [ baseUrl, options.baseUrl, setBaseUrl ] );

	useEffect( () => {
		if (
			options.graphConfig &&
			! deepEqual( options.graphConfig, graphConfig )
		) {
			setGraphConfig( options.graphConfig );
		}
	}, [ graphConfig, options.graphConfig, setGraphConfig ] );
};

export default useChatSettings;

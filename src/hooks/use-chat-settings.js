import { useEffect } from '@wordpress/element';
import useChat from '../components/chat-provider/use-chat';
import useAgents from '../components/agents-provider/use-agents.js';

const useChatSettings = ( options ) => {
	const {
		apiKey,
		feature,
		service,
		model,
		assistantEnabled,
		setApiKey,
		setService,
		setFeature,
		setModel,
		setAssistantEnabled,
		setDefaultAssistantId,
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

	// if chat.model !== model, set it
	useEffect( () => {
		if ( options.model && options.model !== model ) {
			console.warn( 'set model', {
				options,
				model,
			} );
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
};

export default useChatSettings;

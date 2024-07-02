import AgentsDemoUI from './chat-demo-ui.jsx';
import './agents-demo-page.scss';

const AgentsDemoPage = ( { apiKey } ) => {
	return (
		<div className="agents-demo-page">
			<AgentsDemoUI apiKey={ apiKey } />
		</div>
	);
};

export default AgentsDemoPage;

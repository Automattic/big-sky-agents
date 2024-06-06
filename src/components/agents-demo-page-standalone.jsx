import AgentsDemoUI from './agents-demo-ui.jsx';
import './agents-demo-page.scss';

const AgentsDemoPageStandalone = ( { token } ) => {
	return (
		<div className="agents-demo-page">
			<AgentsDemoUI token={ token } />
		</div>
	);
};

export default AgentsDemoPageStandalone;

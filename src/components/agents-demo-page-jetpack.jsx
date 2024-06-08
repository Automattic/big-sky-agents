import AgentsDemoUI from './agents-demo-ui.jsx';
import useJetpackToken from '../hooks/use-jetpack-token.js';
import './agents-demo-page.scss';

const AgentsDemoPageJetpack = () => {
	const { token } = useJetpackToken();
	return (
		<div className="agents-demo-page">
			{ token ? <AgentsDemoUI token={ token } /> : 'Loading...' }
		</div>
	);
};

export default AgentsDemoPageJetpack;

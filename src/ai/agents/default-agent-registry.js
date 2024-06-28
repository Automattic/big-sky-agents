import createAgentRegistry from './agent-registry';
import registerDefaultAgents from './default-agents';
const defaultAgentRegistry = createAgentRegistry();
registerDefaultAgents( defaultAgentRegistry );
export default defaultAgentRegistry;

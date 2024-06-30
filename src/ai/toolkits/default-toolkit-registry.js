import createToolkitRegistry from './toolkit-registry';
import registerDefaultToolkits from './default-toolkits';
const defaultToolkitRegistry = createToolkitRegistry();
registerDefaultToolkits( defaultToolkitRegistry );
export default defaultToolkitRegistry;

import useChatIcon from './use-chat-icon.js';

// based container
const ChatIcon = () => {
	const { RiveComponent } = useChatIcon();

	return <RiveComponent style={ { width: '32px', height: '32px' } } />;
};

export default {
	title: 'Components/useChatIcon',
	component: ChatIcon,
};

const Template = ( args ) => <ChatIcon { ...args } />;

export const ChatIconExample = Template.bind( {} );

/**
 * External dependencies
 */
import Markdown from 'react-markdown';

const MessageContent = ( { content } ) => {
	/**
	 * Formatted like this (OpenAI assistant style)
	 * "content": [
	 *    {
	 *      "type": "text",
	 *      "text": {
	 *        "value": "Hi! How can I help you today?",
	 *        "annotations": []
	 *      }
	 *    },
	 *    {
	 *      "type": "image_url",
	 *      "image_url": {
	 *        "url": "https://...",
	 *        "detail": "low" | "high" | "auto"
	 *      }
	 *    },
	 *    {
	 *      "type": "image_file",
	 *      "image_file": {
	 *        "file_id": "file-1234",
	 *        "detail": "low" | "high" | "auto"
	 *      }
	 *    }
	 *  ],
	 *
	 * OR like this (Chat Completion style)
	 *
	 * "content": [
	 *   {
	 *     "type": "text",
	 *     "text": "Hi! How can I help you today?"
	 *   }
	 * ]
	 *
	 * OR like this (old Chat Completion style)
	 *
	 * "content": "Hi! How can I help you today?"
	 */

	if ( typeof content === 'string' ) {
		return <Markdown>{ content }</Markdown>;
	}

	return content.map( ( part, index ) => {
		switch ( part.type ) {
			case 'text':
				const text = part.text.value ?? part.text;
				return <Markdown key={ index }>{ text }</Markdown>;
			case 'image_url':
				return (
					<img
						key={ index }
						src={ part.image_url.url }
						alt=""
						className="big-sky__agent-image"
					/>
				);
			case 'image_file':
				return <span>Image file { part.image_file.file_id }</span>;
			default:
				return 'Unknown content part type';
		}
	} );
};

export default MessageContent;

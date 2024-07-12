/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import QuestionToolkit from '../ai/toolkits/question-toolkit.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';

const useQuestionToolkit = () => {
	const { registerToolkit } = useToolkits();

	useEffect( () => {
		registerToolkit( QuestionToolkit );
	}, [ registerToolkit ] );
};

export default useQuestionToolkit;

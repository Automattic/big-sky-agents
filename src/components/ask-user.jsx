/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CheckboxControl,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from 'react';
import UserMessageInput from './user-message-input.jsx';
import { ASK_USER_TOOL_NAME } from '../ai/tools/ask-user.js';
import useAgents from './agents-provider/use-agents.js';
import withToolCall from './with-tool-call.jsx';

function UserChoices( { choices, multiChoice, onChange, onSubmit } ) {
	const [ selectedChoices, setSelectedChoices ] = useState( [] );
	const prevSelectedChoices = useRef( selectedChoices );

	const addChoice = ( choice ) => {
		if ( ! selectedChoices.includes( choice ) ) {
			setSelectedChoices( [ ...selectedChoices, choice ] );
		}
	};

	const removeChoice = ( choice ) => {
		setSelectedChoices( selectedChoices.filter( ( s ) => s !== choice ) );
	};

	useEffect( () => {
		if ( prevSelectedChoices.current !== selectedChoices ) {
			onChange( selectedChoices.join( ',' ) );
			prevSelectedChoices.current = selectedChoices;
		}
	}, [ selectedChoices, onChange ] );

	if ( multiChoice ) {
		return (
			<div className="big-sky__agent-input__choices">
				<VStack>
					{ choices.map( ( suggestion, index ) => (
						<CheckboxControl
							key={ index }
							__nextHasNoMarginBottom
							label={ suggestion }
							onChange={ ( isChecked ) => {
								if ( isChecked ) {
									addChoice( suggestion );
								} else {
									removeChoice( suggestion );
								}
							} }
						/>
					) ) }
					<CheckboxControl
						label="Select all"
						onChange={ ( isChecked ) => {
							if ( isChecked ) {
								setSelectedChoices( choices );
							} else {
								setSelectedChoices( [] );
							}
						} }
					/>
				</VStack>
			</div>
		);
	}

	// single choice
	return (
		<div className="big-sky__agent-input__choices">
			<ItemGroup isBordered isSeparated>
				{ choices.map( ( choice, index ) => (
					<Item
						key={ index }
						onClick={ () => {
							onSubmit( choice );
						} }
					>
						{ choice }
					</Item>
				) ) }
			</ItemGroup>
		</div>
	);
}

function AskUser( { args, respond } ) {
	const [ currentAnswer, setCurrentAnswer ] = useState( '' );
	const { setAgentThought: informUser } = useAgents();

	const onSubmit = useCallback(
		( answer ) => {
			informUser( '' );
			respond( answer, `The user answered: "${ answer }"` );
		},
		[ informUser, respond ]
	);

	const onCancel = useCallback( () => {
		informUser( '' );
		respond( 'User canceled' );
	}, [ informUser, respond ] );

	const submitCurrentAnswer = ( event ) => {
		event.preventDefault();
		if ( currentAnswer ) {
			onSubmit( currentAnswer );
		}
	};

	const { question, choices, placeholder, multiChoice } = args ?? {};

	if ( ! args ) {
		return null;
	}

	return (
		<div className="big-sky__agent-input">
			<Card size="medium">
				<CardBody>
					<UserMessageInput
						label={ question }
						placeholder={ placeholder }
						onSubmit={ onSubmit }
						onChange={ setCurrentAnswer }
						onCancel={ onCancel }
						fileUploadEnabled={ false }
					/>
					{ choices && choices.length > 0 && (
						<UserChoices
							choices={ choices }
							multiChoice={ multiChoice }
							onChange={ ( value ) => {
								setCurrentAnswer( value );
							} }
							onSubmit={ onSubmit }
						/>
					) }
				</CardBody>
				<CardFooter>
					{ onCancel && <Button onClick={ onCancel }>Cancel</Button> }
					<Button
						disabled={ ! currentAnswer }
						variant="primary"
						onClick={ submitCurrentAnswer }
					>
						Submit
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export default withToolCall( ASK_USER_TOOL_NAME, AskUser );

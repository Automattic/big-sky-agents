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
import { useEffect, useState } from 'react';
import UserMessageInput from './user-message-input';

function UserChoices( { choices, multiChoice, onChange, onSubmit } ) {
	const [ selectedChoices, setSelectedChoices ] = useState( [] );

	const addChoice = ( choice ) => {
		if ( ! selectedChoices.includes( choice ) ) {
			setSelectedChoices( [ ...selectedChoices, choice ] );
		}
	};

	const removeChoice = ( choice ) => {
		setSelectedChoices( selectedChoices.filter( ( s ) => s !== choice ) );
	};

	useEffect( () => {
		onChange( selectedChoices.join( ',' ) );
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

function AskUser( {
	onAnswer,
	onCancel,
	question,
	choices,
	placeholder,
	multiChoice,
} ) {
	const [ currentAnswer, setCurrentAnswer ] = useState( '' );

	const submitCurrentAnswer = ( event ) => {
		event.preventDefault();
		if ( currentAnswer ) {
			onAnswer( currentAnswer );
		}
	};

	return (
		<div className="big-sky__agent-input">
			<Card size="medium">
				<CardBody>
					<UserMessageInput
						label={ question }
						placeholder={ placeholder }
						onSubmit={ onAnswer }
						onChange={ setCurrentAnswer }
						fileUploadEnabled
					/>
					{ choices && choices.length > 0 && (
						<UserChoices
							choices={ choices }
							multiChoice={ multiChoice }
							onChange={ ( value ) => {
								setCurrentAnswer( value );
							} }
							onSubmit={ onAnswer }
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

export default AskUser;

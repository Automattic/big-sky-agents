/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	CheckboxControl,
	DropZone,
	__experimentalInputControl as InputControl,
	__experimentalItem as Item,
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { close } from '@wordpress/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';

function UserChoices( { choices, multiChoice, onChoice, onSubmit } ) {
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
		onChoice( selectedChoices.join( ',' ) );
	}, [ selectedChoices, onChoice ] );

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

const FilePreview = ( { name, url, onRemove } ) => {
	return (
		<>
			{ url && (
				<img
					width="50"
					height="50"
					style={ { verticalAlign: 'middle' } }
					alt={ name }
					src={ url }
				/>
			) }
			{ name } <Button size="small" icon={ close } onClick={ onRemove } />
		</>
	);
};

function AskUserQuestion( {
	onAnswer,
	onCancel,
	question,
	choices,
	placeholder,
	multiChoice,
} ) {
	const [ answer, setAnswer ] = useState( '' );
	const [ selectedChoice, setSelectedChoice ] = useState( '' );
	const [ files, setFiles ] = useState( [] );

	const handleSubmit = ( event ) => {
		event.preventDefault();
		onAnswer( answer || selectedChoice, files );
		setAnswer( '' );
		setSelectedChoice( '' );
	};

	const readFileAsDataURL = ( file ) => {
		return new Promise( ( resolve, reject ) => {
			// eslint-disable-next-line no-undef
			const reader = new FileReader();
			reader.onload = () => resolve( reader.result );
			reader.onerror = reject;
			reader.readAsDataURL( file );
		} );
	};

	const addFiles = useCallback(
		async ( newFiles ) => {
			const fileNamesAndUrls = await Promise.all(
				newFiles.map( async ( file ) => ( {
					name: file.name,
					url: await readFileAsDataURL( file ),
				} ) )
			);

			setFiles( [ ...files, ...fileNamesAndUrls ] );
		},
		[ files, setFiles ]
	);

	const removeFile = useCallback(
		( index ) => {
			setFiles( files.filter( ( file, i ) => i !== index ) );
		},
		[ files, setFiles ]
	);

	const submitDisabled = useMemo( () => {
		return ! answer && ! selectedChoice && files.length === 0;
	}, [ answer, selectedChoice, files ] );

	return (
		<div className="big-sky__agent-input">
			<Card size="medium">
				<CardBody>
					<InputControl
						size="__unstable-large"
						label={ question }
						placeholder={ placeholder }
						className="big-sky__agent-input__input"
						value={ answer }
						onChange={ ( value ) => setAnswer( value ) }
						onKeyDown={ ( event ) => {
							if ( event.key === 'Enter' ) {
								handleSubmit( event );
							}
						} }
					/>
					<DropZone onFilesDrop={ addFiles } />
					{ files && files.length > 0 && (
						<ItemGroup isBordered isSeparated>
							{ files.map( ( { name, url }, index ) => (
								<Item key={ index }>
									<FilePreview
										name={ name }
										url={ url }
										onRemove={ () => removeFile( index ) }
									/>
								</Item>
							) ) }
						</ItemGroup>
					) }
					{ choices && choices.length > 0 && (
						<UserChoices
							choices={ choices }
							multiChoice={ multiChoice }
							onChoice={ ( choice ) => {
								setSelectedChoice( choice );
							} }
							onSubmit={ ( choice ) => {
								onAnswer( choice, files );
							} }
						/>
					) }
				</CardBody>
				<CardFooter>
					{ onCancel && <Button onClick={ onCancel }>Cancel</Button> }
					<Button onClick={ () => onAnswer( '(no answer)', files ) }>
						Skip
					</Button>
					<Button
						variant="secondary"
						onClick={ () =>
							onAnswer(
								'Please fill this in for me with your best guess',
								files
							)
						}
					>
						Autofill
					</Button>
					<Button
						disabled={ submitDisabled }
						variant="primary"
						onClick={ handleSubmit }
					>
						Submit
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export default AskUserQuestion;

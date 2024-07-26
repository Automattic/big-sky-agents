/**
 * External dependencies
 */
import { FakeBrowser } from '@vtaits/react-fake-browser-ui';

/**
 * WordPress dependencies
 */
import { Card, CardBody } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
// import {
// 	BlockCanvas,
// 	BlockEditorProvider,
// 	RichText,
// } from '@wordpress/block-editor';
// import { createBlock, registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as siteSpecStore } from '../store/index.js';

// registerBlockType( 'big-sky/section', {
// 	title: 'Big Sky Page Section',
// 	icon: 'group',
// 	category: 'design',
// 	attributes: {
// 		category: {
// 			type: 'string',
// 			source: 'text',
// 			selector: 'h4',
// 		},
// 		description: {
// 			type: 'string',
// 			source: 'text',
// 			selector: 'p',
// 		},
// 	},
// 	edit: ( props ) => {
// 		const {
// 			attributes: { type, category, description },
// 			setAttributes,
// 		} = props;
// 		return (
// 			<>
// 				<div className="big-sky-placeholder-block">
// 					<RichText
// 						tagName="h4"
// 						value={ category }
// 						allowedFormats={ [] }
// 						onChange={ ( newCategory ) =>
// 							setAttributes( { category: newCategory } )
// 						}
// 						placeholder={ `${ type } category` }
// 					/>
// 					<RichText
// 						tagName="p"
// 						value={ description }
// 						allowedFormats={ [] }
// 						onChange={ ( newDescription ) =>
// 							setAttributes( { description: newDescription } )
// 						}
// 						placeholder={ `${ type } description` }
// 					/>
// 					<span>section</span>
// 				</div>
// 			</>
// 		);
// 	},
// 	save: ( props ) => {
// 		const {
// 			attributes: { category, description },
// 		} = props;
// 		return (
// 			<div className="big-sky-placeholder-block">
// 				<h4>{ category }</h4>
// 				<p>{ description }</p>
// 				<span>section</span>
// 			</div>
// 		);
// 	},
// } );

// registerBlockType( 'big-sky/page', {
// 	title: 'Big Sky Page',
// 	icon: 'page',
// 	category: 'design',
// 	attributes: {
// 		description: {
// 			type: 'string',
// 			source: 'text',
// 			selector: 'p',
// 		},
// 		type: {
// 			// 'about', 'contact', ...
// 			type: 'string',
// 			default: 'section',
// 			source: 'text',
// 			selector: 'span',
// 		},
// 	},
// 	edit: ( props ) => {
// 		const {
// 			attributes: { type, description },
// 			setAttributes,
// 		} = props;
// 		return (
// 			<>
// 				<div className="big-sky-placeholder-block">
// 					<RichText
// 						tagName="p"
// 						value={ description }
// 						allowedFormats={ [] }
// 						onChange={ ( newDescription ) =>
// 							setAttributes( { description: newDescription } )
// 						}
// 						placeholder={ `${ type } description` }
// 					/>
// 					<span>{ type } page</span>
// 				</div>
// 			</>
// 		);
// 	},
// 	save: ( props ) => {
// 		const {
// 			attributes: { type, description },
// 		} = props;
// 		return (
// 			<div className="big-sky-placeholder-block">
// 				<p>{ description }</p>
// 				<span>{ type } page</span>
// 			</div>
// 		);
// 	},
// } );

function PageSpecPreview( { disabled, pageId } ) {
	const { category, sections, title, description } = useSelect(
		( select ) => {
			return {
				description:
					select( siteSpecStore ).getPageDescription( pageId ),
				sections: select( siteSpecStore ).getPageSections( pageId ),
				title: select( siteSpecStore ).getPageTitle( pageId ),
				category: select( siteSpecStore ).getPageCategory( pageId ),
			};
		}
	);

	const [ blocks, setBlocks ] = useState( [] );

	useEffect( () => {
		if (
			sections &&
			sections.length > 0 &&
			blocks.length !== sections.length
		) {
			setBlocks(
				sections.map( ( section ) => {
					const block = section; // createBlock( 'big-sky/section', section );
					block.save = () => null;
					return block;
				} )
			);
		}
	}, [ blocks, sections ] );

	return (
		<div className="big-sky__agent-page-spec">
			<Card size="medium">
				<CardBody>
					<div className="big-sky__page-description">
						{ description || 'No description' } ( { category } )
					</div>

					<FakeBrowser
						currentAddress={ title }
						canMoveForward={ false }
						canMoveBack={ false }
						/* // refresh, // goBack, // goForward, // goTo */
					>
						<div className="big-sky__page-editor">
							{ ! disabled && blocks && blocks.length > 0 && (
								<>Blocks: { JSON.stringify( blocks ) }</>
								// <BlockEditorProvider
								// 	value={ blocks }
								// 	onChange={ setBlocks }
								// 	onInput={ setBlocks }
								// 	templateLock="all"
								// 	codeEditingEnabled={ false }
								// 	bodyPlaceholder="Please Wait..."
								// 	// hasPermissionsToManageWidgets={ false }
								// 	// focusMode={ true }
								// 	/* TODO */
								// 	/*colors: EditorColor[];
								// 	fontSizes: EditorFontSize[];
								// 	styles: EditorStyle[];*/
								// >
								// 	<BlockCanvas
								// 		shouldIframe={ true }
								// 		height="600px"
								// 	/>
								// </BlockEditorProvider>
							) }
						</div>
					</FakeBrowser>
				</CardBody>
			</Card>
		</div>
	);
}

export default PageSpecPreview;

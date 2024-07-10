/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as agentStore } from '../store/index.js';
import {
	AddPageSectionTool,
	AddSitePageTool,
	SetPageCategoryTool,
	SetPageDescriptionTool,
	SetPageSectionsTool,
	SetPageTitleTool,
	SetSiteColorsTool,
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSitePagesTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from '../ai/tools/site-tools.js';
import useToolkits from '../components/toolkits-provider/use-toolkits.js';

export const SITE_TOOLKIT_ID = 'site';

const useSiteToolkit = ( { pageId } ) => {
	const { registerToolkit } = useToolkits();

	const {
		setTextColor,
		setBackgroundColor,
		setAccentColor,
		setSiteTitle,
		setSiteDescription,
		setSiteTopic,
		setSiteType,
		setSiteLocation,
		setPages,
		addPage,
		setPageSections,
		addPageSection,
		setPageTitle,
		setPageCategory,
		setPageDescription,
	} = useDispatch( agentStore );

	// these are fed to the templating engine on each render of the system/after-call prompt
	const siteContext = useSelect(
		( select ) => ( {
			title: select( agentStore ).getSiteTitle(),
			description: select( agentStore ).getSiteDescription(),
			topic: select( agentStore ).getSiteTopic(),
			type: select( agentStore ).getSiteType(),
			location: select( agentStore ).getSiteLocation(),
		} ),
		[]
	);

	const designContext = useSelect(
		( select ) => ( {
			textColor: select( agentStore ).getTextColor(),
			backgroundColor: select( agentStore ).getBackgroundColor(),
			accentColor: select( agentStore ).getAccentColor(),
		} ),
		[]
	);

	const pagesContext = useSelect(
		( select ) => ( {
			pages: select( agentStore ).getPages(),
		} ),
		[]
	);

	const pageContext = useSelect(
		( select ) => ( {
			page: select( agentStore ).getPage( pageId ),
		} ),
		[ pageId ]
	);

	const context = useMemo(
		() => ( {
			site: siteContext,
			design: designContext,
			pages: pagesContext,
			page: pageContext,
		} ),
		[ siteContext, designContext, pagesContext, pageContext ]
	);

	const callbacks = useMemo( () => {
		return {
			[ SetSiteColorsTool.name ]: ( {
				textColor,
				backgroundColor,
				accentColor,
			} ) => {
				if ( textColor ) {
					setTextColor( textColor );
				}
				if ( backgroundColor ) {
					setBackgroundColor( backgroundColor );
				}
				if ( accentColor ) {
					setAccentColor( accentColor );
				}
				return 'Site colors updated';
			},
			[ SetSiteTitleTool.name ]: ( { value } ) => {
				setSiteTitle( value );
				return `Site title set to "${ value }"`;
			},
			[ SetSiteDescriptionTool.name ]: ( { value } ) => {
				setSiteDescription( value );
				return `Site description set to "${ value }"`;
			},
			[ SetSiteTopicTool.name ]: ( { value } ) => {
				setSiteTopic( value );
				return `Site topic set to "${ value }"`;
			},
			[ SetSiteTypeTool.name ]: ( { value } ) => {
				setSiteType( value );
				return `Site type set to "${ value }"`;
			},
			[ SetSiteLocationTool.name ]: ( { value } ) => {
				setSiteLocation( value );
				return `Site location set to "${ value }"`;
			},
			[ SetSitePagesTool.name ]: ( { pages } ) => {
				setPages( pages );
				return 'Site pages set';
			},
			[ AddSitePageTool.name ]: ( { category, title, description } ) => {
				addPage( { category, title, description } );
				return 'Adding site page';
			},
			[ SetPageSectionsTool.name ]: ( { sections } ) => {
				setPageSections( pageId, sections );
				return 'Set page sections';
			},
			[ AddPageSectionTool.name ]: ( { category, description } ) => {
				addPageSection( pageId, { category, description } );
				return 'Adding page section';
			},
			[ SetPageCategoryTool.name ]: ( { category } ) => {
				setPageCategory( pageId, category );
				return `Set page category to "${ category }"`;
			},
			[ SetPageDescriptionTool.name ]: ( { description } ) => {
				setPageDescription( pageId, description );
				return `Set page description to "${ description }"`;
			},
			[ SetPageTitleTool.name ]: ( { title } ) => {
				setPageTitle( pageId, title );
				return `Set page title to "${ title }"`;
			},
		};
	}, [
		setTextColor,
		setBackgroundColor,
		setAccentColor,
		setSiteTitle,
		setSiteDescription,
		setSiteTopic,
		setSiteType,
		setSiteLocation,
		setPages,
		addPage,
		setPageSections,
		addPageSection,
		setPageCategory,
		pageId,
		setPageDescription,
		setPageTitle,
	] );

	useEffect( () => {
		registerToolkit( {
			name: SITE_TOOLKIT_ID,
			tools: [
				// site
				SetSiteTitleTool,
				SetSiteDescriptionTool,
				SetSiteTopicTool,
				SetSiteLocationTool,
				SetSiteTypeTool,

				// design
				SetSiteColorsTool,

				// pages
				SetSitePagesTool,
				AddSitePageTool,
				SetPageCategoryTool,
				SetPageDescriptionTool,

				// page section
				SetPageSectionsTool,
				AddPageSectionTool,
			],
			callbacks,
			context,
		} );
	}, [ callbacks, context, registerToolkit ] );
};

export default useSiteToolkit;

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from 'react';

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
	SetSitePagesTool,
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from '../agents/tools/site-tools.js';

const useReduxSiteToolkit = ( { pageId } ) => {
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
	const values = useSelect(
		( select ) => ( {
			site: {
				title: select( agentStore ).getSiteTitle(),
				description: select( agentStore ).getSiteDescription(),
				topic: select( agentStore ).getSiteTopic(),
				type: select( agentStore ).getSiteType(),
				location: select( agentStore ).getSiteLocation(),
			},
			design: {
				textColor: select( agentStore ).getTextColor(),
				backgroundColor: select( agentStore ).getBackgroundColor(),
				accentColor: select( agentStore ).getAccentColor(),
			},
			pages: select( agentStore ).getPages(),
			pageId,
			page: select( agentStore ).getPage( pageId ),
			// TODO
			// pageSections: select( agentStore ).getPageSections(),
		} ),
		[ pageId ]
	);

	const callbacks = useMemo( () => {
		return {
			[ SetSiteColorsTool.function.name ]: ( {
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
			[ SetSiteTitleTool.function.name ]: ( { title } ) => {
				setSiteTitle( title );
				return `Site title set to "${ title }"`;
			},
			[ SetSiteDescriptionTool.function.name ]: ( { description } ) => {
				console.warn( 'setSiteDescription', { description } );
				setSiteDescription( description );
				return `Site description set to "${ description }"`;
			},
			[ SetSiteTopicTool.function.name ]: ( { topic } ) => {
				setSiteTopic( topic );
				return `Site topic set to "${ topic }"`;
			},
			[ SetSiteTypeTool.function.name ]: ( { siteType } ) => {
				setSiteType( siteType );
				return `Site type set to "${ siteType }"`;
			},
			[ SetSiteLocationTool.function.name ]: ( { location } ) => {
				setSiteLocation( location );
				return `Site location set to "${ location }"`;
			},
			[ SetSitePagesTool.function.name ]: ( { pages } ) => {
				setPages( pages );
				return 'Site pages set';
			},
			[ AddSitePageTool.function.name ]: ( {
				category,
				title,
				description,
			} ) => {
				addPage( { category, title, description } );
				return 'Adding site page';
			},
			[ SetPageSectionsTool.function.name ]: ( { sections } ) => {
				setPageSections( sections );
				return 'Set page sections';
			},
			[ AddPageSectionTool.function.name ]: ( {
				category,
				description,
			} ) => {
				addPageSection( { category, description } );
				return 'Adding page section';
			},
			[ SetPageCategoryTool.function.name ]: ( { category } ) => {
				setPageCategory( pageId, category );
				return `Set page category to "${ category }"`;
			},
			[ SetPageDescriptionTool.function.name ]: ( { description } ) => {
				setPageDescription( pageId, description );
				return `Set page description to "${ description }"`;
			},
			[ SetPageTitleTool.function.name ]: ( { title } ) => {
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

	const tools = useMemo( () => {
		return [
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
		];
	}, [] );

	const onReset = useMemo( () => {
		return () => {
			// TODO
		};
	}, [] );

	return {
		onReset,
		tools,
		values,
		callbacks,
	};
};

export default useReduxSiteToolkit;

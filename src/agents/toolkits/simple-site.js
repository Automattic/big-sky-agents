import Toolkit from './toolkit.js';
import {
	AddSitePageTool,
	SetSiteColorsTool,
	SetSiteDescriptionTool,
	SetSiteLocationTool,
	SetSitePagesTool,
	SetSiteTitleTool,
	SetSiteTopicTool,
	SetSiteTypeTool,
} from '../tools/site-tools.js';
import uuidv4 from '../../utils/uuid.js';

const INITIAL_STATE = {
	textColor: undefined,
	backgroundColor: undefined,
	accentColor: undefined,
	siteTitle: undefined,
	siteDescription: undefined,
	siteTopic: undefined,
	siteType: undefined,
	siteLocation: undefined,
	pages: [],
};

class SimpleSiteToolkit extends Toolkit {
	constructor( props ) {
		super( props, INITIAL_STATE );

		this.tools = this.getTools();
	}

	setSiteColors = ( { textColor, backgroundColor, accentColor } ) => {
		if ( textColor ) {
			this.setState( { textColor } );
		}
		if ( backgroundColor ) {
			this.setState( { backgroundColor } );
		}
		if ( accentColor ) {
			this.setState( { accentColor } );
		}
		return 'Site colors updated';
	};

	setSiteTitle = ( { title } ) => {
		this.setState( { siteTitle: title } );
		return `Site title set to "${ title }"`;
	};

	setSiteDescription = ( { description } ) => {
		console.warn( 'setSiteDescription', { description } );
		this.setState( { siteDescription: description } );
		return `Site description set to "${ description }"`;
	};

	setSiteTopic = ( { topic } ) => {
		this.setState( { siteTopic: topic } );
		return `Site topic set to "${ topic }"`;
	};

	setSiteType = ( { siteType } ) => {
		this.setState( { siteType } );
		return `Site type set to "${ siteType }"`;
	};

	setSiteLocation = ( { location } ) => {
		this.setState( { siteLocation: location } );
		return `Site location set to "${ location }"`;
	};

	setSitePages = ( { pages: newPages } ) => {
		this.setState( { pages: newPages } );
		return 'Site pages set';
	};

	addSitePage = ( { category, title, description } ) => {
		const { pages } = this.state;
		const newPage = {
			id: uuidv4(),
			category,
			title,
			description,
		};
		this.setState( { pages: [ ...pages, newPage ] } );
		return 'Adding site page';
	};

	onReset = () => {
		this.setState( INITIAL_STATE );
	};

	getTools = () => [
		SetSiteTitleTool,
		SetSiteDescriptionTool,
		SetSiteTopicTool,
		SetSiteLocationTool,
		SetSiteTypeTool,
		SetSiteColorsTool,
		SetSitePagesTool,
		AddSitePageTool,
	];

	getValues = () => {
		return {
			site: {
				title: this.state.siteTitle,
				description: this.state.siteDescription,
				topic: this.state.siteTopic,
				type: this.state.siteType,
				location: this.state.siteLocation,
			},
			design: {
				textColor: this.state.textColor,
				backgroundColor: this.state.backgroundColor,
				accentColor: this.state.accentColor,
			},
			pages: this.state.pages,
		};
	};

	getCallbacks = () => {
		return {
			[ SetSiteColorsTool.function.name ]: this.setSiteColors,
			[ SetSiteTitleTool.function.name ]: this.setSiteTitle,
			[ SetSiteDescriptionTool.function.name ]: this.setSiteDescription,
			[ SetSiteTopicTool.function.name ]: this.setSiteTopic,
			[ SetSiteTypeTool.function.name ]: this.setSiteType,
			[ SetSiteLocationTool.function.name ]: this.setSiteLocation,
			[ SetSitePagesTool.function.name ]: this.setSitePages,
			[ AddSitePageTool.function.name ]: this.addSitePage,
		};
	};
}

export default SimpleSiteToolkit;

import OpenAI from 'openai';
import readline from 'readline';

const openai = new OpenAI();

class Agent {
	constructor( id, processFunc, inputMode = 'all' ) {
		this.id = id;
		this.processFunc = processFunc;
		this.inputMode = inputMode; // 'all' = must wait for all incoming steps to complete or 'any' = can start processing after any incoming step completes
		this.inputCount = 0;
		this.receivedInputs = 0;
		this.inputs = [];
		this.events = {};
	}
	// The agent listens for the 'completed' event for all or any incoming steps.
	on( event, listener ) {
		if ( ! this.events[ event ] ) {
			this.events[ event ] = [];
		}
		this.events[ event ].push( listener );
	}

	emit( event, data ) {
		if ( this.events[ event ] ) {
			this.events[ event ].forEach( ( listener ) => listener( data ) );
		}
	}
	setInputCount( count ) {
		this.inputCount = count;
	}

	async process( input ) {
		this.receivedInputs++;
		this.inputs.push( input );

		if (
			this.inputMode === 'any' ||
			this.receivedInputs === this.inputCount
		) {
			const output = await this.processFunc( this.inputs );
			this.emit( 'completed', output );
			this.inputs = [];
			this.receivedInputs = 0;
		}
	}
}

class Plan {
	constructor() {
		this.agents = new Map();
		this.steps = new Map();
	}

	addAgent( id, processFunc, inputMode = 'all' ) {
		const agent = new Agent( id, processFunc, inputMode );
		this.agents.set( id, agent );
		this.steps.set( id, [] );
	}

	addStep( fromAgentId, toAgentId ) {
		if (
			! this.agents.has( fromAgentId ) ||
			! this.agents.has( toAgentId )
		) {
			throw new Error(
				`Agent ${ fromAgentId } or ${ toAgentId } does not exist`
			);
		}
		this.steps.get( fromAgentId ).push( toAgentId );
	}

	async execute( startAgentId, initialInput ) {
		for ( const [ agentId, agent ] of this.agents ) {
			const inputCount = [ ...this.steps.values() ].filter( ( steps ) =>
				steps.includes( agentId )
			).length;
			agent.setInputCount( inputCount || 1 );
		}

		const results = new Map();
		const processingPromise = new Promise( ( resolve ) => {
			for ( const [ agentId, agent ] of this.agents ) {
				agent.on( 'completed', ( output ) => {
					results.set( agentId, output );
					for ( const nextAgentId of this.steps.get( agentId ) ) {
						this.agents.get( nextAgentId ).process( output );
					}
					if ( results.size === this.agents.size ) {
						resolve();
					}
				} );
			}
		} );

		await this.agents.get( startAgentId ).process( initialInput );

		await processingPromise;

		return Object.fromEntries( results );
	}
}

// Helper function for user input
function askQuestion( query ) {
	const rl = readline.createInterface( {
		input: process.stdin,
		output: process.stdout,
	} );

	return new Promise( ( resolve ) =>
		rl.question( query, ( ans ) => {
			rl.close();
			resolve( ans );
		} )
	);
}

const websiteAnalystAgent = async () => {
	const initialPrompt = `You are a website design analyst. Your task is to ask the user questions about their website requirements. Ask one question at a time. You need to gather information about the site type, name, description, and business location if relevant. Once you have all the necessary information, respond with 'ANALYSIS COMPLETE' followed by a summary of the gathered information.`;
	const conversation = [ { role: 'system', content: initialPrompt } ];

	while ( true ) {
		const completion = await openai.chat.completions.create( {
			model: 'gpt-3.5-turbo',
			messages: conversation,
		} );

		const aiMessage = completion.choices[ 0 ].message.content;

		if ( aiMessage.includes( 'ANALYSIS COMPLETE' ) ) {
			console.log( aiMessage );
			return aiMessage;
		}

		console.log( 'Analyst:', aiMessage );
		const userResponse = await askQuestion( 'Your response: ' );

		conversation.push( { role: 'assistant', content: aiMessage } );
		conversation.push( { role: 'user', content: userResponse } );
	}
};

const designAgent = async ( inputs ) => {
	console.log( 'Running design agent' );
	const [ analysisResult ] = inputs;
	const prompt = `Based on this website analysis: "${ analysisResult }", suggest an appropriate color scheme and font selection for the website. Provide specific color hex codes and font names.`;

	const completion = await openai.chat.completions.create( {
		model: 'gpt-3.5-turbo',
		messages: [ { role: 'user', content: prompt } ],
	} );

	return completion.choices[ 0 ].message.content;
};

const structureAgent = async ( inputs ) => {
	console.log( 'Running structure agent' );
	const [ analysisResult ] = inputs;
	const prompt = `Based on this website analysis: "${ analysisResult }", suggest an appropriate structure for the website, including necessary pages and sections.`;

	const completion = await openai.chat.completions.create( {
		model: 'gpt-3.5-turbo',
		messages: [ { role: 'user', content: prompt } ],
	} );

	return completion.choices[ 0 ].message.content;
};

const buildAgent = async ( inputs ) => {
	console.log(
		'Running build agent based on inputs from design and structure agent',
		inputs
	);
	const [ analysisResult ] = inputs;
	const prompt = `Based on this website analysis: "${ analysisResult }", provide the html for the homepage.`;

	const completion = await openai.chat.completions.create( {
		model: 'gpt-3.5-turbo',
		messages: [ { role: 'user', content: prompt } ],
	} );

	return completion.choices[ 0 ].message.content;
};

// Create plan and add agents
const plan = new Plan();
plan.addAgent( 'analyst', websiteAnalystAgent );
plan.addAgent( 'design', designAgent );
plan.addAgent( 'structure', structureAgent );
plan.addAgent( 'build', buildAgent );

// Add steps to create the flow
plan.addStep( 'analyst', 'design' );
plan.addStep( 'analyst', 'structure' );
plan.addStep( 'design', 'build' );
plan.addStep( 'structure', 'build' );

// Process the flow
console.time( 'Website Design Analysis Time' );
plan.execute( 'analyst', 'Start website design analysis' )
	.then( ( results ) => {
		console.log( '\nFinal Results:' );
		console.log( 'Website build:', results.build );
		console.timeEnd( 'Website Design Analysis Time' );
	} )
	.catch( ( error ) =>
		console.error( 'Error in website design analysis:', error )
	);

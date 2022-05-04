'use strict';
/**
 * Manage step functions
 */

const BbPromise = require('bluebird');
const _ = require('lodash');
const utils = require('../utils');

module.exports = function(currentTemplate, aliasStackTemplates, currentAliasStackTemplate) {

	const stageStack = this._serverless.service.provider.compiledCloudFormationTemplate;
	const aliasStack = this._serverless.service.provider.compiledCloudFormationAliasTemplate;

	const stepFunctions = _.assign({}, _.pickBy(_.get(stageStack, 'Resources', {}), [ 'Type', 'AWS::StepFunctions::StateMachine' ]));

	this.options.verbose && this._serverless.cli.log('Processing step functions');

	// Loop step functions
	_.forOwn(stepFunctions, (stepFunction, name) => {

		// Get all referenced functions
		const refs = _.get(stepFunction, 'Properties.DefinitionString.Fn::Sub[1]');

		_.forEach(utils.findAllReferences(refs), ref => {
			const functionName = _.replace(ref.ref, /LambdaFunction$/, '');
			if (_.isEmpty(functionName)) {
				// FIXME: Can this happen at all?
				this._serverless.cli.log(`Strange thing: No function name defined for ${name}`);
				return;
			}

			_.set(refs, ref.path, { Ref: `${functionName}Alias` });
			stepFunction.DependsOn.push(`${functionName}Alias`);
		});

		// Find role name
		const resourceRef = utils.findAllReferences(_.get(stepFunction, 'Properties.RoleArn'));
		const resourceRefName = _.get(resourceRef, '[0].ref');

		// Remove mapping from stage stack
		delete stageStack.Resources[name];

		// Remove step function from output
		const resourceArn = _.replace(resourceRefName, /Role$/, "Arn");
		delete stageStack.Outputs[resourceArn];

		// Move step function to alias stack
		aliasStack.Resources[name] = stepFunction;

		// Update role definition to use aliases
		const role = stageStack.Resources[resourceRefName];
		const roleRefs = _.get(role, 'Properties.Policies[0].PolicyDocument.Statement');

		_.forEach(utils.findAllReferences(roleRefs), ref => {
			const functionName = _.replace(ref.ref, /LambdaFunction$/, '');
			if (_.isEmpty(functionName)) {
				// FIXME: Can this happen at all?
				this._serverless.cli.log(`Strange thing: No function name defined for ${name}`);
				return;
			}

			_.set(roleRefs, ref.path, { Ref: `${functionName}Alias` });
		});

		// Move role definition
		aliasStack.Resources[resourceRefName] = role;
		delete stageStack.Resources[resourceRefName];
	});

	// Forward inputs to the promise chain
	return BbPromise.resolve([ currentTemplate, aliasStackTemplates, currentAliasStackTemplate ]);
};

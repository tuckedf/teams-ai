/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { KernelConfig } from "./Configuration";
import { Verify } from "./Diagnostics";
import { IKernel } from "./IKernal";
import { CaseInsensitiveMap } from "./Internals";
import { ILogger, NullLogger } from "./Logger";
import { ContextVariables, ISKFunction, SKContext, SKFunctionExtensions } from "./Orchestration";
import { FunctionRegistry, IFunctionRegistry, IFunctionRegistryReader } from "./Registry";
import { ISemanticFunctionConfig } from "./SemanticFunctions";
import { IPromptTemplateEngine, PromptTemplateEngine } from "./TemplateEngine";


/**
 * Semantic kernel class.
 * The kernel provides a registry to define native and semantic functions, an orchestrator to execute a list of functions.
 * Semantic functions are automatically rendered and executed using an internal prompt template rendering engine.
 * Future versions will allow to:
 * * customize the rendering engine
 * * include branching logic in the functions pipeline
 * * persist execution state for long running pipelines
 * * distribute pipelines over a network
 * * RPC functions and secure environments, e.g. sandboxing and credentials management
 * * auto-generate pipelines given a higher level goal
 */
export class Kernel implements IKernel {
    private readonly _log: ILogger;
    private readonly _config: KernelConfig;
    private readonly _functionRegistry: IFunctionRegistry;
    private readonly _promptTemplateEngine: PromptTemplateEngine;

    constructor(config: KernelConfig, log?: ILogger) {
        this._log = log ?? new NullLogger();

        this._config = config;
        this._promptTemplateEngine = new PromptTemplateEngine(this._log);
        this._functionRegistry = new FunctionRegistry(this._log);
    }

    public config: KernelConfig;
    
    public log: ILogger;
    
    public promptTemplateEngine: IPromptTemplateEngine;
    
    public functionRegistryReader: IFunctionRegistryReader;
  
    /**
     * Provide an instance of the kernel, with the given configuration settings.
     * The constructor is hidden on purpose to force a dependency on the kernel interface as opposed to this specific
     * implementation, to ease the integration with future custom kernels.
     *
     * @param config Configuration to use.
     * @param log Optional. Application logger to use.
     * @returns An instance of Semantic Kernel
     */
    public static build(config: KernelConfig, log?: ILogger): IKernel {
        return new Kernel(config, log);
    }
  
  
    public registerSemanticFunction(functionName: string, functionConfig: ISemanticFunctionConfig): ISKFunction;
    public registerSemanticFunction(skillName: string, functionName: string, functionConfig: ISemanticFunctionConfig): ISKFunction;
    public registerSemanticFunction(skillName: string, functionName: string|ISemanticFunctionConfig, functionConfig?: ISemanticFunctionConfig): ISKFunction {
        if (typeof functionName == 'object') {
            functionConfig = functionName;
            functionName = skillName;
            skillName = FunctionRegistry.GlobalSkill;
        }

        // Future-proofing the name not to contain special chars
        Verify.validSkillName(skillName);
        Verify.validFunctionName(functionName);
    
        const fn = this.createSemanticFunction(skillName, functionName, functionConfig);
        this._functionRegistry.registerSemanticFunction(fn);
    
        return fn;
    }
    
    public importSkill(skillInstance: object, skillName = ""): CaseInsensitiveMap<string, ISKFunction> {
      if (!skillName) {
        skillName = FunctionRegistry.GlobalSkill;
        this._log.trace(`Importing skill into the global namespace`);
      } else {
        this._log.trace(`Importing skill ${skillName}`);
      }
  
      const skill = new CaseInsensitiveMap<string, ISKFunction>();
      const functions = ImportSkill(skillInstance, skillName, this._log);
      for (const f of functions) {
        f.SetDefaultFunctionRegistry(this.FunctionRegistryReader);
        this._functionRegistry.RegisterNativeFunction(f);
        skill.Add(f.Name, f);
      }
  
      return skill;
    }
  
    public async run(variables: ContextVariables, ...pipeline: ISKFunction[]): Promise<SKContext> {
      let executionContext = new SKContext(variables, this._functionRegistry.functionRegistryReader, this._log, cancellationToken);
  
      let pipelineStepCount = -1;
      for (const f of pipeline) {
        if (executionContext.ErrorOccurred) {
          this._log.LogError(
            executionContext.LastException,
            "Something went wrong in pipeline step {0}:'{1}'", pipelineStepCount, executionContext.LastErrorDescription);
          return executionContext;
        }
  
        pipelineStepCount++;
  
        try {
          cancellationToken.ThrowIfCancellationRequested();
          executionContext = await f.InvokeAsync(executionContext);
  
          if (executionContext.ErrorOccurred) {
            this._log.LogError("Function call fail during pipeline step {0}: {1}.{2}", pipelineStepCount, f.SkillName, f.Name);
            return executionContext;
          }
        } catch (e) {
          if (!e.IsCriticalException()) {
            this._log.LogError(e, "Something went wrong in pipeline step {0}: {1}.{2}. Error: {3}", pipelineStepCount, f.SkillName, f.Name, e.Message);
            executionContext.Fail(e.Message, e);
            return executionContext;
          }
        }
      }
  
      return executionContext;
    }

    public func(skillName: string, functionName: string): ISKFunction {
        if (this.functionRegistryReader.hasNativeFunction(skillName, functionName)) {
            return this.functionRegistryReader.getNativeFunction(skillName, functionName);
        }

        return this.functionRegistryReader.getSemanticFunction(skillName, functionName);
    }

    private CreateSemanticFunction(
        skillName: string,
        functionName: string,
        functionConfig: ISemanticFunctionConfig
    ): ISKFunction {
        // TODO: add support for embeddings
        if (functionConfig.promptTemplateConfig.type.toLowerCase() != "completion") {
            throw new Error(`Function type not supported: ${functionConfig.promptTemplateConfig}`);
        }

        const func: ISKFunction = SKFunctionExtensions.FromSemanticConfig(skillName, functionName, functionConfig);
        func.RequestSettings.UpdateFromCompletionConfig(functionConfig.PromptTemplateConfig.Completion);

        // Connect the function to the current kernel registry, in case the function
        // is invoked manually without a context and without a way to find other functions.
        func.SetDefaultFunctionRegistry(this.FunctionRegistryReader);

        // TODO: allow to postpone this, so that semantic functions can be created without a default backend
        const backend = this._config.GetCompletionBackend(functionConfig.PromptTemplateConfig.DefaultBackends[0]);

        func.SetAIConfiguration(CompleteRequestSettings.FromCompletionConfig(functionConfig.PromptTemplateConfig.Completion));

        switch (backend.BackendType) {
            case BackendTypes.AzureOpenAI:
                Verify.NotNull(backend.AzureOpenAI, "Azure OpenAI configuration is missing");
                func.SetAIBackend(() => new AzureTextCompletion(
                    backend.AzureOpenAI.DeploymentName,
                    backend.AzureOpenAI.Endpoint,
                    backend.AzureOpenAI.APIKey,
                    backend.AzureOpenAI.APIVersion,
                    this._log
                ));
                break;

            case BackendTypes.OpenAI:
                Verify.NotNull(backend.OpenAI, "OpenAI configuration is missing");
                func.SetAIBackend(() => new OpenAITextCompletion(
                    backend.OpenAI.ModelId,
                    backend.OpenAI.APIKey,
                    backend.OpenAI.OrgId,
                    this._log
                ));
                break;

            default:
                throw new AIException(
                    AIException.ErrorCodes.InvalidConfiguration,
                    `Unknown/unsupported backend type ${backend.BackendType}, unable to prepare semantic function. ` +
                    `Function description: ${functionConfig.PromptTemplateConfig.Description}`
                );
        }

        return func;
    }

    private static ImportSkill(skillInstance: any, skillName: string, log: ILogger): ISKFunction[] {
        log.LogTrace("Importing skill: {0}", skillName);
        const methods: MethodInfo[] = skillInstance.constructor
            .getMethods(BindingFlags.Static | BindingFlags.Instance | BindingFlags.Public | BindingFlags.InvokeMethod);
        log.LogTrace("Methods found {0}", methods.length);

        // Filter out null functions
        const functions: ISKFunction[] = methods.map(method => SKFunction.FromNativeMethod(method, skillInstance, skillName, log));
        const result: ISKFunction[] = functions.filter(function => function !== null);

        // Fail if two functions have the same name
        const uniquenessCheck: Set<string> = new Set(result.map(x => x.Name), StringComparer.OrdinalIgnoreCase);
        if (result.length > uniquenessCheck.size) {
            throw new KernelException(
                KernelException.ErrorCodes.FunctionOverloadNotSupported,
                "Function overloads are not supported, please differentiate function names"
            );
        }

        return result;
    }
}
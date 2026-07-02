const RUNTIME_PUBLIC_PATH = "server/chunks/[turbopack]_runtime.js";
const RELATIVE_ROOT_PATH = "..";
const ASSET_PREFIX = "/";
const WORKER_FORWARDED_GLOBALS = ["NEXT_DEPLOYMENT_ID","NEXT_CLIENT_ASSET_SUFFIX"];
// Apply forwarded globals from workerData if running in a worker thread
if (typeof require !== 'undefined') {
    try {
        const { workerData } = require('worker_threads');
        if (workerData?.__turbopack_globals__) {
            Object.assign(globalThis, workerData.__turbopack_globals__);
            // Remove internal data so it's not visible to user code
            delete workerData.__turbopack_globals__;
        }
    } catch (_) {
        // Not in a worker thread context, ignore
    }
}
/**
 * This file contains runtime types and functions that are shared between all
 * TurboPack ECMAScript runtimes.
 *
 * It will be prepended to the runtime code of each runtime.
 */ /* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-types.d.ts" />
/**
 * Describes why a module was instantiated.
 * Shared between browser and Node.js runtimes.
 */ var SourceType = /*#__PURE__*/ function(SourceType) {
    /**
   * The module was instantiated because it was included in an evaluated chunk's
   * runtime.
   * SourceData is a ChunkPath.
   */ SourceType[SourceType["Runtime"] = 0] = "Runtime";
    /**
   * The module was instantiated because a parent module imported it.
   * SourceData is a ModuleId.
   */ SourceType[SourceType["Parent"] = 1] = "Parent";
    /**
   * The module was instantiated because it was included in a chunk's hot module
   * update.
   * SourceData is an array of ModuleIds or undefined.
   */ SourceType[SourceType["Update"] = 2] = "Update";
    return SourceType;
}(SourceType || {});
/**
 * Flag indicating which module object type to create when a module is merged. Set to `true`
 * by each runtime that uses ModuleWithDirection (browser dev-base.ts, nodejs dev-base.ts,
 * nodejs build-base.ts). Browser production (build-base.ts) leaves it as `false` since it
 * uses plain Module objects.
 */ let createModuleWithDirectionFlag = false;
const REEXPORTED_OBJECTS = new WeakMap();
/**
 * Constructs the `__turbopack_context__` object for a module.
 */ function Context(module, exports) {
    this.m = module;
    // We need to store this here instead of accessing it from the module object to:
    // 1. Make it available to factories directly, since we rewrite `this` to
    //    `__turbopack_context__.e` in CJS modules.
    // 2. Support async modules which rewrite `module.exports` to a promise, so we
    //    can still access the original exports object from functions like
    //    `esmExport`
    // Ideally we could find a new approach for async modules and drop this property altogether.
    this.e = exports;
}
const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;
function defineProp(obj, name, options) {
    if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}
function getOverwrittenModule(moduleCache, id) {
    let module = moduleCache[id];
    if (!module) {
        if (createModuleWithDirectionFlag) {
            // set in development modes for hmr support
            module = createModuleWithDirection(id);
        } else {
            module = createModuleObject(id);
        }
        moduleCache[id] = module;
    }
    return module;
}
/**
 * Creates the module object. Only done here to ensure all module objects have the same shape.
 */ function createModuleObject(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined
    };
}
function createModuleWithDirection(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined,
        parents: [],
        children: []
    };
}
const BindingTag_Value = 0;
/**
 * Adds the getters to the exports object.
 */ function esm(exports, bindings) {
    defineProp(exports, '__esModule', {
        value: true
    });
    if (toStringTag) defineProp(exports, toStringTag, {
        value: 'Module'
    });
    let i = 0;
    while(i < bindings.length){
        const propName = bindings[i++];
        const tagOrFunction = bindings[i++];
        if (typeof tagOrFunction === 'number') {
            if (tagOrFunction === BindingTag_Value) {
                defineProp(exports, propName, {
                    value: bindings[i++],
                    enumerable: true,
                    writable: false
                });
            } else {
                throw new Error(`unexpected tag: ${tagOrFunction}`);
            }
        } else {
            const getterFn = tagOrFunction;
            if (typeof bindings[i] === 'function') {
                const setterFn = bindings[i++];
                defineProp(exports, propName, {
                    get: getterFn,
                    set: setterFn,
                    enumerable: true
                });
            } else {
                defineProp(exports, propName, {
                    get: getterFn,
                    enumerable: true
                });
            }
        }
    }
    Object.seal(exports);
}
/**
 * Makes the module an ESM with exports
 */ function esmExport(bindings, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    module.namespaceObject = exports;
    esm(exports, bindings);
}
contextPrototype.s = esmExport;
function ensureDynamicExports(module, exports) {
    let reexportedObjects = REEXPORTED_OBJECTS.get(module);
    if (!reexportedObjects) {
        REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
        module.exports = module.namespaceObject = new Proxy(exports, {
            get (target, prop) {
                if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
                    return Reflect.get(target, prop);
                }
                for (const obj of reexportedObjects){
                    const value = Reflect.get(obj, prop);
                    if (value !== undefined) return value;
                }
                return undefined;
            },
            ownKeys (target) {
                const keys = Reflect.ownKeys(target);
                for (const obj of reexportedObjects){
                    for (const key of Reflect.ownKeys(obj)){
                        if (key !== 'default' && !keys.includes(key)) keys.push(key);
                    }
                }
                return keys;
            }
        });
    }
    return reexportedObjects;
}
/**
 * Dynamically exports properties from an object
 */ function dynamicExport(object, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    const reexportedObjects = ensureDynamicExports(module, exports);
    if (typeof object === 'object' && object !== null) {
        reexportedObjects.push(object);
    }
}
contextPrototype.j = dynamicExport;
function exportValue(value, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = value;
}
contextPrototype.v = exportValue;
function exportNamespace(namespace, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;
function createGetter(obj, key) {
    return ()=>obj[key];
}
/**
 * @returns prototype of the object
 */ const getProto = Object.getPrototypeOf ? (obj)=>Object.getPrototypeOf(obj) : (obj)=>obj.__proto__;
/** Prototypes that are not expanded for exports */ const LEAF_PROTOTYPES = [
    null,
    getProto({}),
    getProto([]),
    getProto(getProto)
];
/**
 * @param raw
 * @param ns
 * @param allowExportDefault
 *   * `false`: will have the raw module as default export
 *   * `true`: will have the default property as default export
 */ function interopEsm(raw, ns, allowExportDefault) {
    const bindings = [];
    let defaultLocation = -1;
    for(let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)){
        for (const key of Object.getOwnPropertyNames(current)){
            bindings.push(key, createGetter(raw, key));
            if (defaultLocation === -1 && key === 'default') {
                defaultLocation = bindings.length - 1;
            }
        }
    }
    // this is not really correct
    // we should set the `default` getter if the imported module is a `.cjs file`
    if (!(allowExportDefault && defaultLocation >= 0)) {
        // Replace the binding with one for the namespace itself in order to preserve iteration order.
        if (defaultLocation >= 0) {
            // Replace the getter with the value
            bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
        } else {
            bindings.push('default', BindingTag_Value, raw);
        }
    }
    esm(ns, bindings);
    return ns;
}
function createNS(raw) {
    if (typeof raw === 'function') {
        return function(...args) {
            return raw.apply(this, args);
        };
    } else {
        return Object.create(null);
    }
}
function esmImport(id) {
    const module = getOrInstantiateModuleFromParent(id, this.m);
    // any ES module has to have `module.namespaceObject` defined.
    if (module.namespaceObject) return module.namespaceObject;
    // only ESM can be an async module, so we don't need to worry about exports being a promise here.
    const raw = module.exports;
    return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;
function asyncLoader(moduleId) {
    const loader = this.r(moduleId);
    return loader(esmImport.bind(this));
}
contextPrototype.A = asyncLoader;
// Add a simple runtime require so that environments without one can still pass
// `typeof require` CommonJS checks so that exports are correctly registered.
const runtimeRequire = // @ts-ignore
typeof require === 'function' ? require : function require1() {
    throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;
function commonJsRequire(id) {
    return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;
/**
 * Remove fragments and query parameters since they are never part of the context map keys
 *
 * This matches how we parse patterns at resolving time.  Arguably we should only do this for
 * strings passed to `import` but the resolve does it for `import` and `require` and so we do
 * here as well.
 */ function parseRequest(request) {
    // Per the URI spec fragments can contain `?` characters, so we should trim it off first
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.5
    const hashIndex = request.indexOf('#');
    if (hashIndex !== -1) {
        request = request.substring(0, hashIndex);
    }
    const queryIndex = request.indexOf('?');
    if (queryIndex !== -1) {
        request = request.substring(0, queryIndex);
    }
    return request;
}
/**
 * `require.context` and require/import expression runtime.
 */ function moduleContext(map) {
    function moduleContext(id) {
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].module();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    }
    moduleContext.keys = ()=>{
        return Object.keys(map);
    };
    moduleContext.resolve = (id)=>{
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].id();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    };
    moduleContext.import = async (id)=>{
        return await moduleContext(id);
    };
    return moduleContext;
}
contextPrototype.f = moduleContext;
/**
 * Returns the path of a chunk defined by its data.
 */ function getChunkPath(chunkData) {
    return typeof chunkData === 'string' ? chunkData : chunkData.path;
}
function isPromise(maybePromise) {
    return maybePromise != null && typeof maybePromise === 'object' && 'then' in maybePromise && typeof maybePromise.then === 'function';
}
function isAsyncModuleExt(obj) {
    return turbopackQueues in obj;
}
function createPromise() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        reject = rej;
        resolve = res;
    });
    return {
        promise,
        resolve: resolve,
        reject: reject
    };
}
// Load the CompressedmoduleFactories of a chunk into the `moduleFactories` Map.
// The CompressedModuleFactories format is
// - 1 or more module ids
// - a module factory function
// So walking this is a little complex but the flat structure is also fast to
// traverse, we can use `typeof` operators to distinguish the two cases.
function installCompressedModuleFactories(chunkModules, offset, moduleFactories, newModuleId) {
    let i = offset;
    while(i < chunkModules.length){
        let end = i + 1;
        // Find our factory function
        while(end < chunkModules.length && typeof chunkModules[end] !== 'function'){
            end++;
        }
        if (end === chunkModules.length) {
            throw new Error('malformed chunk format, expected a factory function');
        }
        // Install the factory for each module ID that doesn't already have one.
        // When some IDs in this group already have a factory, reuse that existing
        // group factory for the missing IDs to keep all IDs in the group consistent.
        // Otherwise, install the factory from this chunk.
        const moduleFactoryFn = chunkModules[end];
        let existingGroupFactory = undefined;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            const existingFactory = moduleFactories.get(id);
            if (existingFactory) {
                existingGroupFactory = existingFactory;
                break;
            }
        }
        const factoryToInstall = existingGroupFactory ?? moduleFactoryFn;
        let didInstallFactory = false;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            if (!moduleFactories.has(id)) {
                if (!didInstallFactory) {
                    if (factoryToInstall === moduleFactoryFn) {
                        applyModuleFactoryName(moduleFactoryFn);
                    }
                    didInstallFactory = true;
                }
                moduleFactories.set(id, factoryToInstall);
                newModuleId?.(id);
            }
        }
        i = end + 1; // end is pointing at the last factory advance to the next id or the end of the array.
    }
}
// everything below is adapted from webpack
// https://github.com/webpack/webpack/blob/6be4065ade1e252c1d8dcba4af0f43e32af1bdc1/lib/runtime/AsyncModuleRuntimeModule.js#L13
const turbopackQueues = Symbol('turbopack queues');
const turbopackExports = Symbol('turbopack exports');
const turbopackError = Symbol('turbopack error');
function resolveQueue(queue) {
    if (queue && queue.status !== 1) {
        queue.status = 1;
        queue.forEach((fn)=>fn.queueCount--);
        queue.forEach((fn)=>fn.queueCount-- ? fn.queueCount++ : fn());
    }
}
function wrapDeps(deps) {
    return deps.map((dep)=>{
        if (dep !== null && typeof dep === 'object') {
            if (isAsyncModuleExt(dep)) return dep;
            if (isPromise(dep)) {
                const queue = Object.assign([], {
                    status: 0
                });
                const obj = {
                    [turbopackExports]: {},
                    [turbopackQueues]: (fn)=>fn(queue)
                };
                dep.then((res)=>{
                    obj[turbopackExports] = res;
                    resolveQueue(queue);
                }, (err)=>{
                    obj[turbopackError] = err;
                    resolveQueue(queue);
                });
                return obj;
            }
        }
        return {
            [turbopackExports]: dep,
            [turbopackQueues]: ()=>{}
        };
    });
}
function asyncModule(body, hasAwait) {
    const module = this.m;
    const queue = hasAwait ? Object.assign([], {
        status: -1
    }) : undefined;
    const depQueues = new Set();
    const { resolve, reject, promise: rawPromise } = createPromise();
    const promise = Object.assign(rawPromise, {
        [turbopackExports]: module.exports,
        [turbopackQueues]: (fn)=>{
            queue && fn(queue);
            depQueues.forEach(fn);
            promise['catch'](()=>{});
        }
    });
    const attributes = {
        get () {
            return promise;
        },
        set (v) {
            // Calling `esmExport` leads to this.
            if (v !== promise) {
                promise[turbopackExports] = v;
            }
        }
    };
    Object.defineProperty(module, 'exports', attributes);
    Object.defineProperty(module, 'namespaceObject', attributes);
    function handleAsyncDependencies(deps) {
        const currentDeps = wrapDeps(deps);
        const getResult = ()=>currentDeps.map((d)=>{
                if (d[turbopackError]) throw d[turbopackError];
                return d[turbopackExports];
            });
        const { promise, resolve } = createPromise();
        const fn = Object.assign(()=>resolve(getResult), {
            queueCount: 0
        });
        function fnQueue(q) {
            if (q !== queue && !depQueues.has(q)) {
                depQueues.add(q);
                if (q && q.status === 0) {
                    fn.queueCount++;
                    q.push(fn);
                }
            }
        }
        currentDeps.map((dep)=>dep[turbopackQueues](fnQueue));
        return fn.queueCount ? promise : getResult();
    }
    function asyncResult(err) {
        if (err) {
            reject(promise[turbopackError] = err);
        } else {
            resolve(promise[turbopackExports]);
        }
        resolveQueue(queue);
    }
    body(handleAsyncDependencies, asyncResult);
    if (queue && queue.status === -1) {
        queue.status = 0;
    }
}
contextPrototype.a = asyncModule;
/**
 * A pseudo "fake" URL object to resolve to its relative path.
 *
 * When UrlRewriteBehavior is set to relative, calls to the `new URL()` will construct url without base using this
 * runtime function to generate context-agnostic urls between different rendering context, i.e ssr / client to avoid
 * hydration mismatch.
 *
 * This is based on webpack's existing implementation:
 * https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/RelativeUrlRuntimeModule.js
 */ const relativeURL = function relativeURL(inputUrl) {
    const realUrl = new URL(inputUrl, 'x:/');
    const values = {};
    for(const key in realUrl)values[key] = realUrl[key];
    values.href = inputUrl;
    values.pathname = inputUrl.replace(/[?#].*/, '');
    values.origin = values.protocol = '';
    values.toString = values.toJSON = (..._args)=>inputUrl;
    for(const key in values)Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        value: values[key]
    });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;
/**
 * Utility function to ensure all variants of an enum are handled.
 */ function invariant(never, computeMessage) {
    throw new Error(`Invariant: ${computeMessage(never)}`);
}
/**
 * Constructs an error message for when a module factory is not available.
 */ function factoryNotAvailableMessage(moduleId, sourceType, sourceData) {
    let instantiationReason;
    switch(sourceType){
        case 0:
            instantiationReason = `as a runtime entry of chunk ${sourceData}`;
            break;
        case 1:
            instantiationReason = `because it was required from module ${sourceData}`;
            break;
        case 2:
            instantiationReason = 'because of an HMR update';
            break;
        default:
            invariant(sourceType, (sourceType)=>`Unknown source type: ${sourceType}`);
    }
    return `Module ${moduleId} was instantiated ${instantiationReason}, but the module factory is not available.`;
}
/**
 * A stub function to make `require` available but non-functional in ESM.
 */ function requireStub(_moduleId) {
    throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;
// Make `globalThis` available to the module in a way that cannot be shadowed by a local variable.
contextPrototype.g = globalThis;
function applyModuleFactoryName(factory) {
    // Give the module factory a nice name to improve stack traces.
    Object.defineProperty(factory, 'name', {
        value: 'module evaluation'
    });
}
/// <reference path="../shared/runtime/runtime-utils.ts" />
/// A 'base' utilities to support runtime can have externals.
/// Currently this is for node.js / edge runtime both.
/// If a fn requires node.js specific behavior, it should be placed in `node-external-utils` instead.
async function externalImport(id) {
    let raw;
    try {
        switch (id) {
  case "next/dist/compiled/@vercel/og/index.node.js":
    raw = await import("next/dist/compiled/@vercel/og/index.edge.js");
    break;
  default:
    raw = await import(id);
};
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
        return interopEsm(raw.default, createNS(raw), true);
    }
    return raw;
}
contextPrototype.y = externalImport;
function externalRequire(id, thunk, esm = false) {
    let raw;
    try {
        raw = thunk();
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (!esm || raw.__esModule) {
        return raw;
    }
    return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options)=>{
    return require.resolve(id, options);
};
contextPrototype.x = externalRequire;
/* eslint-disable @typescript-eslint/no-unused-vars */ const path = require('path');
const relativePathToRuntimeRoot = path.relative(RUNTIME_PUBLIC_PATH, '.');
// Compute the relative path to the `distDir`.
const relativePathToDistRoot = path.join(relativePathToRuntimeRoot, RELATIVE_ROOT_PATH);
const RUNTIME_ROOT = path.resolve(__filename, relativePathToRuntimeRoot);
// Compute the absolute path to the root, by stripping distDir from the absolute path to this file.
const ABSOLUTE_ROOT = path.resolve(__filename, relativePathToDistRoot);
/**
 * Returns an absolute path to the given module path.
 * Module path should be relative, either path to a file or a directory.
 *
 * This fn allows to calculate an absolute path for some global static values, such as
 * `__dirname` or `import.meta.url` that Turbopack will not embeds in compile time.
 * See ImportMetaBinding::code_generation for the usage.
 */ function resolveAbsolutePath(modulePath) {
    if (modulePath) {
        return path.join(ABSOLUTE_ROOT, modulePath);
    }
    return ABSOLUTE_ROOT;
}
Context.prototype.P = resolveAbsolutePath;
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../shared/runtime/runtime-utils.ts" />
function readWebAssemblyAsResponse(path) {
    const { createReadStream } = require('fs');
    const { Readable } = require('stream');
    const stream = createReadStream(path);
    // @ts-ignore unfortunately there's a slight type mismatch with the stream.
    return new Response(Readable.toWeb(stream), {
        headers: {
            'content-type': 'application/wasm'
        }
    });
}
async function compileWebAssemblyFromPath(path) {
    const response = readWebAssemblyAsResponse(path);
    return await WebAssembly.compileStreaming(response);
}
async function instantiateWebAssemblyFromPath(path, importsObj) {
    const response = readWebAssemblyAsResponse(path);
    const { instance } = await WebAssembly.instantiateStreaming(response, importsObj);
    return instance.exports;
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../../shared/runtime/runtime-utils.ts" />
/// <reference path="../../shared-node/base-externals-utils.ts" />
/// <reference path="../../shared-node/node-externals-utils.ts" />
/// <reference path="../../shared-node/node-wasm-utils.ts" />
/// <reference path="./nodejs-globals.d.ts" />
/**
 * Base Node.js runtime shared between production and development.
 * Contains chunk loading, module caching, and other non-HMR functionality.
 */ process.env.TURBOPACK = '1';
const url = require('url');
const moduleFactories = new Map();
const moduleCache = Object.create(null);
/**
 * Returns an absolute path to the given module's id.
 */ function resolvePathFromModule(moduleId) {
    const exported = this.r(moduleId);
    const exportedPath = exported?.default ?? exported;
    if (typeof exportedPath !== 'string') {
        return exported;
    }
    const strippedAssetPrefix = exportedPath.slice(ASSET_PREFIX.length);
    const resolved = path.resolve(RUNTIME_ROOT, strippedAssetPrefix);
    return url.pathToFileURL(resolved).href;
}
/**
 * Exports a URL value. No suffix is added in Node.js runtime.
 */ function exportUrl(urlValue, id) {
    exportValue.call(this, urlValue, id);
}
function loadRuntimeChunk(sourcePath, chunkData) {
    if (typeof chunkData === 'string') {
        loadRuntimeChunkPath(sourcePath, chunkData);
    } else {
        loadRuntimeChunkPath(sourcePath, chunkData.path);
    }
}
const loadedChunks = new Set();
const unsupportedLoadChunk = Promise.resolve(undefined);
const loadedChunk = Promise.resolve(undefined);
const chunkCache = new Map();
function clearChunkCache() {
    chunkCache.clear();
    loadedChunks.clear();
}
function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return;
    }
    if (loadedChunks.has(chunkPath)) {
        return;
    }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = requireChunk(chunkPath);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (cause) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        const error = new Error(errorMessage, {
            cause
        });
        error.name = 'ChunkLoadError';
        throw error;
    }
}
function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return unsupportedLoadChunk;
    }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            // resolve to an absolute path to simplify `require` handling
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            // TODO: consider switching to `import()` to enable concurrent chunk loading and async file io
            // However this is incompatible with hot reloading (since `import` doesn't use the require cache)
            const chunkModules = requireChunk(chunkPath);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (cause) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            const error = new Error(errorMessage, {
                cause
            });
            error.name = 'ChunkLoadError';
            // Cache the failure promise, future requests will also get this same rejection
            entry = Promise.reject(error);
        }
        chunkCache.set(chunkPath, entry);
    }
    // TODO: Return an instrumented Promise that React can use instead of relying on referential equality.
    return entry;
}
contextPrototype.l = loadChunkAsync;
function loadChunkAsyncByUrl(chunkUrl) {
    const path1 = url.fileURLToPath(new URL(chunkUrl, RUNTIME_ROOT));
    return loadChunkAsync.call(this, path1);
}
contextPrototype.L = loadChunkAsyncByUrl;
async function loadWebAssembly(chunkPath, _edgeModule, imports) {
  const mod = await loadWasmChunk(chunkPath);
  const { exports } = await WebAssembly.instantiate(mod, imports);
  return exports;
}
contextPrototype.w = loadWebAssembly;
function loadWebAssemblyModule(chunkPath, _edgeModule) {
  return loadWasmChunk(chunkPath);
}
contextPrototype.u = loadWebAssemblyModule;
/**
 * Creates a Node.js worker thread by instantiating the given WorkerConstructor
 * with the appropriate path and options, including forwarded globals.
 *
 * @param WorkerConstructor The Worker constructor from worker_threads
 * @param workerPath Path to the worker entry chunk
 * @param workerOptions options to pass to the Worker constructor (optional)
 */ function createWorker(WorkerConstructor, workerPath, workerOptions) {
    // Build the forwarded globals object
    const forwardedGlobals = {};
    for (const name of WORKER_FORWARDED_GLOBALS){
        forwardedGlobals[name] = globalThis[name];
    }
    // Merge workerData with forwarded globals
    const existingWorkerData = workerOptions?.workerData || {};
    const options = {
        ...workerOptions,
        workerData: {
            ...typeof existingWorkerData === 'object' ? existingWorkerData : {},
            __turbopack_globals__: forwardedGlobals
        }
    };
    return new WorkerConstructor(workerPath, options);
}
const regexJsUrl = /\.js(?:\?[^#]*)?(?:#.*)?$/;
/**
 * Checks if a given path/URL ends with .js, optionally followed by ?query or #fragment.
 */ function isJs(chunkUrlOrPath) {
    return regexJsUrl.test(chunkUrlOrPath);
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-base.ts" />
/**
 * Production Node.js runtime.
 * Uses ModuleWithDirection and simple module instantiation without HMR support.
 */ // moduleCache and moduleFactories are declared in runtime-base.ts
// this is read in runtime-utils.ts so it creates a module with direction for hmr
createModuleWithDirectionFlag = true;
const nodeContextPrototype = Context.prototype;
nodeContextPrototype.q = exportUrl;
nodeContextPrototype.M = moduleFactories;
// Cast moduleCache to ModuleWithDirection for production mode
nodeContextPrototype.c = moduleCache;
nodeContextPrototype.R = resolvePathFromModule;
nodeContextPrototype.b = createWorker;
nodeContextPrototype.C = clearChunkCache;
function instantiateModule(id, sourceType, sourceData) {
    const moduleFactory = moduleFactories.get(id);
    if (typeof moduleFactory !== 'function') {
        // This can happen if modules incorrectly handle HMR disposes/updates,
        // e.g. when they keep a `setTimeout` around which still executes old code
        // and contains e.g. a `require("something")` call.
        throw new Error(factoryNotAvailableMessage(id, sourceType, sourceData));
    }
    const module1 = createModuleWithDirection(id);
    const exports = module1.exports;
    moduleCache[id] = module1;
    const context = new Context(module1, exports);
    // NOTE(alexkirsz) This can fail when the module encounters a runtime error.
    try {
        moduleFactory(context, module1, exports);
    } catch (error) {
        module1.error = error;
        throw error;
    }
    ;
    module1.loaded = true;
    if (module1.namespaceObject && module1.exports !== module1.namespaceObject) {
        // in case of a circular dependency: cjs1 -> esm2 -> cjs1
        interopEsm(module1.exports, module1.namespaceObject);
    }
    return module1;
}
/**
 * Retrieves a module from the cache, or instantiate it if it is not cached.
 */ // @ts-ignore
function getOrInstantiateModuleFromParent(id, sourceModule) {
    const module1 = moduleCache[id];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateModule(id, SourceType.Parent, sourceModule.id);
}
/**
 * Instantiates a runtime module.
 */ function instantiateRuntimeModule(chunkPath, moduleId) {
    return instantiateModule(moduleId, SourceType.Runtime, chunkPath);
}
/**
 * Retrieves a module from the cache, or instantiate it as a runtime module if it is not cached.
 */ // @ts-ignore TypeScript doesn't separate this module space from the browser runtime
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
    const module1 = moduleCache[moduleId];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateRuntimeModule(chunkPath, moduleId);
}
module.exports = (sourcePath)=>({
        m: (id)=>getOrInstantiateRuntimeModule(sourcePath, id),
        c: (chunkData)=>loadRuntimeChunk(sourcePath, chunkData)
    });


//# sourceMappingURL=%5Bturbopack%5D_runtime.js.map

  function requireChunk(chunkPath) {
    switch(chunkPath) {
      case "server/chunks/ssr/[root-of-the-server]__040ojbq._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__040ojbq._.js");
      case "server/chunks/ssr/[root-of-the-server]__0_wvthf._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0_wvthf._.js");
      case "server/chunks/ssr/[root-of-the-server]__0fw3mdu._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0fw3mdu._.js");
      case "server/chunks/ssr/[root-of-the-server]__0q_zrza._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0q_zrza._.js");
      case "server/chunks/ssr/[root-of-the-server]__1v-of3u._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1v-of3u._.js");
      case "server/chunks/ssr/[turbopack]_runtime.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js");
      case "server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yr.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yr.js");
      case "server/chunks/ssr/node_modules_0h91jdk._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0h91jdk._.js");
      case "server/chunks/ssr/node_modules_next_dist_0gqiype._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0gqiype._.js");
      case "server/chunks/ssr/node_modules_next_dist_0uboya6._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0uboya6._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j3._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j3._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0x.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0x.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0048lj3.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0048lj3.js");
      case "server/chunks/ssr/[root-of-the-server]__1irm0ke._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1irm0ke._.js");
      case "server/chunks/ssr/_1a-0c_d._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_1a-0c_d._.js");
      case "server/chunks/ssr/_next-internal_server_app_(auth)_login_page_actions_1jr42c1.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(auth)_login_page_actions_1jr42c1.js");
      case "server/chunks/ssr/app_(auth)_login_page_tsx_1jx1-tw._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/app_(auth)_login_page_tsx_1jx1-tw._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0-o-goa.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0-o-goa.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1vbgfas.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1vbgfas.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_ash_page_actions_0fo4vbo.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_ash_page_actions_0fo4vbo.js");
      case "server/chunks/ssr/[root-of-the-server]__0qskjqm._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0qskjqm._.js");
      case "server/chunks/ssr/_0_8dzy0._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_0_8dzy0._.js");
      case "server/chunks/ssr/_0j68hu4._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_0j68hu4._.js");
      case "server/chunks/ssr/_0vmfri-._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_0vmfri-._.js");
      case "server/chunks/ssr/_0wti1ee._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_0wti1ee._.js");
      case "server/chunks/ssr/components_layout_0ef_prk._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_layout_0ef_prk._.js");
      case "server/chunks/ssr/components_modules_AshModule_tsx_18gdr03._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_AshModule_tsx_18gdr03._.js");
      case "server/chunks/ssr/node_modules_next_1iemwhs._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_1iemwhs._.js");
      case "server/chunks/ssr/node_modules_next_dist_11-hlb7._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_11-hlb7._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0f4p9fx.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0f4p9fx.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_cast_page_actions_1fhbr8s.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_cast_page_actions_1fhbr8s.js");
      case "server/chunks/ssr/[root-of-the-server]__0-5hb58._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0-5hb58._.js");
      case "server/chunks/ssr/components_modules_CastModule_tsx_18y-omw._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_CastModule_tsx_18y-omw._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1mvxw80.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1mvxw80.js");
      case "server/chunks/ssr/1jng_app_(workspace)_[workspaceSlug]_[projectId]_materials_page_actions_1hdywxl.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1jng_app_(workspace)_[workspaceSlug]_[projectId]_materials_page_actions_1hdywxl.js");
      case "server/chunks/ssr/[root-of-the-server]__179j1ua._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__179j1ua._.js");
      case "server/chunks/ssr/components_modules_MaterialsModule_tsx_0dc9jl4._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_MaterialsModule_tsx_0dc9jl4._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0zt8cjb.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0zt8cjb.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_page_actions_00_-xjz.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_page_actions_00_-xjz.js");
      case "server/chunks/ssr/[root-of-the-server]__0zq86m-._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0zq86m-._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1dx7rmj.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1dx7rmj.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_qa_page_actions_0wl0aqj.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_qa_page_actions_0wl0aqj.js");
      case "server/chunks/ssr/[root-of-the-server]__0jza8_n._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0jza8_n._.js");
      case "server/chunks/ssr/components_modules_QAModule_tsx_06duuc4._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_QAModule_tsx_06duuc4._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0yjgkxg.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0yjgkxg.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_quake_page_actions_0ieo2qn.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_quake_page_actions_0ieo2qn.js");
      case "server/chunks/ssr/[root-of-the-server]__0dvaob_._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0dvaob_._.js");
      case "server/chunks/ssr/components_modules_QuakeModule_tsx_178e_sa._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_QuakeModule_tsx_178e_sa._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1q_rhjs.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1q_rhjs.js");
      case "server/chunks/ssr/1jng_app_(workspace)_[workspaceSlug]_[projectId]_relations_page_actions_0-yjukz.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1jng_app_(workspace)_[workspaceSlug]_[projectId]_relations_page_actions_0-yjukz.js");
      case "server/chunks/ssr/[root-of-the-server]__1dqkgf1._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1dqkgf1._.js");
      case "server/chunks/ssr/components_modules_RelationsModule_tsx_1_g721o._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_RelationsModule_tsx_1_g721o._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0vxwu96.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0vxwu96.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_scroll_page_actions_0k8buec.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_scroll_page_actions_0k8buec.js");
      case "server/chunks/ssr/[root-of-the-server]__0dnjvzw._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0dnjvzw._.js");
      case "server/chunks/ssr/components_modules_ScrollModule_tsx_1fy7mbv._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_ScrollModule_tsx_1fy7mbv._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_13ju-tm.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_13ju-tm.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_spark_page_actions_169xkyw.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_spark_page_actions_169xkyw.js");
      case "server/chunks/ssr/[root-of-the-server]__0b44884._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0b44884._.js");
      case "server/chunks/ssr/components_modules_SparkModule_tsx_0mkzum9._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_SparkModule_tsx_0mkzum9._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_19wg4hi.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_19wg4hi.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_thread_page_actions_081k8ma.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_thread_page_actions_081k8ma.js");
      case "server/chunks/ssr/[root-of-the-server]__02q84cl._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__02q84cl._.js");
      case "server/chunks/ssr/components_modules_ThreadModule_tsx_0khdl1x._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_ThreadModule_tsx_0khdl1x._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0hess-p.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0hess-p.js");
      case "server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_write_page_actions_09z64vg.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_(workspace)_[workspaceSlug]_[projectId]_write_page_actions_09z64vg.js");
      case "server/chunks/ssr/[root-of-the-server]__0e3vb-4._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0e3vb-4._.js");
      case "server/chunks/ssr/components_modules_WriteModule_tsx_15y9svy._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_modules_WriteModule_tsx_15y9svy._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0-fh-le.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0-fh-le.js");
      case "server/chunks/ssr/[root-of-the-server]__0te2t9r._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0te2t9r._.js");
      case "server/chunks/ssr/_next-internal_server_app_(workspace)_[workspaceSlug]_new_page_actions_0hwaes9.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(workspace)_[workspaceSlug]_new_page_actions_0hwaes9.js");
      case "server/chunks/ssr/components_forms_NewProjectForm_tsx_0fb25u9._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/components_forms_NewProjectForm_tsx_0fb25u9._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0djfqe4.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0djfqe4.js");
      case "server/chunks/ssr/[root-of-the-server]__0dl568x._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0dl568x._.js");
      case "server/chunks/ssr/_next-internal_server_app_(workspace)_[workspaceSlug]_page_actions_1xr7ayr.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_(workspace)_[workspaceSlug]_page_actions_1xr7ayr.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_16hn8ss.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_16hn8ss.js");
      case "server/chunks/ssr/[root-of-the-server]__0j820ik._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0j820ik._.js");
      case "server/chunks/ssr/[root-of-the-server]__172704f._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__172704f._.js");
      case "server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_13q04th.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_13q04th.js");
      case "server/chunks/[root-of-the-server]__0domq1v._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0domq1v._.js");
      case "server/chunks/[root-of-the-server]__1003hei._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1003hei._.js");
      case "server/chunks/[turbopack]_runtime.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/[turbopack]_runtime.js");
      case "server/chunks/_11yum5t._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/_11yum5t._.js");
      case "server/chunks/_next-internal_server_app_api_whoami_route_actions_0a8agha.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_whoami_route_actions_0a8agha.js");
      case "server/chunks/[root-of-the-server]__0ivs1d8._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0ivs1d8._.js");
      case "server/chunks/_next-internal_server_app_auth_callback_route_actions_0gq6cy0.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_auth_callback_route_actions_0gq6cy0.js");
      case "server/chunks/[externals]_next_dist_0iuj5m_._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/[externals]_next_dist_0iuj5m_._.js");
      case "server/chunks/[root-of-the-server]__0xuaoik._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0xuaoik._.js");
      case "server/chunks/_next-internal_server_app_favicon_ico_route_actions_0g2jjls.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_favicon_ico_route_actions_0g2jjls.js");
      case "server/chunks/node_modules_next_dist_esm_build_templates_app-route_1n41rqb.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/node_modules_next_dist_esm_build_templates_app-route_1n41rqb.js");
      case "server/chunks/ssr/[root-of-the-server]__0nk0brc._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0nk0brc._.js");
      case "server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1j.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1j.js");
      case "server/chunks/ssr/node_modules_0bfyf2o._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0bfyf2o._.js");
      case "server/chunks/ssr/node_modules_next_dist_1knwlsz._.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1knwlsz._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_04tpgk4.js": return require("/Users/dianalangton/prod/nexu-ember/apps/web/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_04tpgk4.js");
      default:
        throw new Error(`Not found ${chunkPath}`);
    }
  }


  async function loadWasmChunk(chunkPath) {
    switch (chunkPath) {

      default:
        throw new Error(`Unknown wasm chunk: ${chunkPath}`);
    }
  }

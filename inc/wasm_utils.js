function init_module_with_memory(moduleOrBytes, memory) {
    const env = { memory: memory };
    return WebAssembly.instantiate(moduleOrBytes, { env: env })
        .then(output => {
            // Check if 'module' property exists, indicating raw bytes were used
            if (output.module) {
                return output.instance;  // Return instance when raw bytes are used
            } else {
                return output;  // Return the instance directly when a module is used
            }
        })
        .catch(error => {
            console.error('WASM instantiate error:', error);
            throw error;
        });
}

function load_module_and_instantiate(path) {
    return fetch(path)
        .then(res => res.arrayBuffer())
        .then(wasmBytes => {
            'use strict';

            // Convert to Uint8Array
            wasmBytes = new Uint8Array(wasmBytes);
            let wasmHeapBase = 65536; // Default base if not found in the module

            // Assume a fixed memory size for simplicity
            const wasmMemSize = Math.ceil((wasmHeapBase + 65535) / 65536);
            const memory = new WebAssembly.Memory({ initial: wasmMemSize, maximum: wasmMemSize })

            // Instantiate the WASM module
            return init_module_with_memory(wasmBytes, memory);
        })
        .catch(error => {
            console.error('WASM instantiate error:', error);
            throw error;
        });
}

function load_module_and_compile(path) {
    return fetch(path)
        .then(res => res.arrayBuffer())
        .then(wasmBytes => {
            'use strict';

            // Convert to Uint8Array
            wasmBytes = new Uint8Array(wasmBytes);

            console.log('Compiling wasm module', path);

            // Instantiate the WASM module
            return WebAssembly.compile(wasmBytes);
        })
        .catch(error => {
            console.error('WASM compile error:', error);
            throw error;
        });
}
importScripts('wasm_utils.js');

let worker_module;

function isPromise() {
    return Boolean(worker_module && typeof worker_module.then === 'function');
}

self.onmessage = async function (e) {
    const { type, data } = e.data;

    if (type === 'init') {
        // Initialize WebAssembly instance

        console.log('Worker started with data:', e.data);

        memory = new WebAssembly.Memory({ initial: 10, maximum: 10 });

        worker_module = init_module_with_memory(data.compiled_module, memory).then(wasm_instance => {
            worker_module = wasm_instance;
            console.log('Module initialized:', wasm_instance);

            new Uint8Array(worker_module.exports.memory.buffer).set(data.subsets_memory, worker_module.exports.get_subsets());
            worker_module.exports.set_subsets_count(data.subsets_count);
            let results_count = worker_module.exports.get_result_count();

            // Send memory buffer back to the main thread
            const memory_buffer = new Uint8Array(worker_module.exports.memory.buffer);
            self.postMessage({ memory_buffer, results_count });
        }).catch(error => {
            console.error('WASM instantiate error:', error);
        });
    } else if (type === 'init_mem') {
        // Initialize instance with cloned memory
        memory = new WebAssembly.Memory({ initial: 10, maximum: 10 });

        worker_module = init_module_with_memory(data.compiled_module, memory).then(wasm_instance => {
            worker_module = wasm_instance;
            new Uint8Array(worker_module.exports.memory.buffer).set(data.memory_buffer);
            console.log('Module initialized:', wasm_instance);
        }).catch(error => {
            console.error('WASM instantiate error:', error);
        });
    } else if (type === 'run') {
        if (isPromise()) {
            await worker_module;
        }

        let thread_idx = data.thread_idx;
        let thread_count = data.thread_count;
        console.log('starting thread:', thread_idx, thread_count);
        worker_module.exports.run(thread_idx, thread_count);

        let results = [];
        var result_count = worker_module.exports.get_result_count();
        for (var i = 0; i < result_count; ++i) {
            results.push({ comp: worker_module.exports.get_result_comp(i), value: worker_module.exports.get_result_value(i) });
            //console.log("worker %d, comp: %d value: %f", thread_idx, worker_module.exports.get_result_comp(i), worker_module.exports.get_result_value(i));
        }
        self.postMessage({ results, thread_idx });
    }
}
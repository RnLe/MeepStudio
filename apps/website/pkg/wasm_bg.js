let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_4.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}
/**
 * Calculates lattice points within a viewport
 * b1x, b1y: first basis vector
 * b2x, b2y: second basis vector
 * viewport_width, viewport_height: size of the viewport in screen coordinates
 * scale: current zoom scale
 * offset_x, offset_y: pan offset
 * @param {number} b1x
 * @param {number} b1y
 * @param {number} b2x
 * @param {number} b2y
 * @param {number} viewport_width
 * @param {number} viewport_height
 * @param {number} scale
 * @param {number} offset_x
 * @param {number} offset_y
 * @returns {any}
 */
export function calculate_lattice_points(b1x, b1y, b2x, b2y, viewport_width, viewport_height, scale, offset_x, offset_y) {
    const ret = wasm.calculate_lattice_points(b1x, b1y, b2x, b2y, viewport_width, viewport_height, scale, offset_x, offset_y);
    return ret;
}

/**
 * Calculate the minimum scale needed to show n lattice points
 * Returns the scale factor that would show approximately n points
 * @param {number} b1x
 * @param {number} b1y
 * @param {number} b2x
 * @param {number} b2y
 * @param {number} viewport_width
 * @param {number} viewport_height
 * @param {number} target_points
 * @returns {number}
 */
export function calculate_min_scale_for_points(b1x, b1y, b2x, b2y, viewport_width, viewport_height, target_points) {
    const ret = wasm.calculate_min_scale_for_points(b1x, b1y, b2x, b2y, viewport_width, viewport_height, target_points);
    return ret;
}

/**
 * Calculate all lattice points that fill a bounding box
 * The number of points is determined by fixing 100 points along the shorter axis
 * @param {number} b1x
 * @param {number} b1y
 * @param {number} b2x
 * @param {number} b2y
 * @returns {any}
 */
export function calculate_all_lattice_points(b1x, b1y, b2x, b2y) {
    const ret = wasm.calculate_all_lattice_points(b1x, b1y, b2x, b2y);
    return ret;
}

/**
 * Generate a centred square of lattice points:
 * – create a dense ±100×100 grid,
 * – find the distance at which `target_count` distinct x or y columns are reached,
 * – keep every point with |x|,|y| ≤ cutoff (square window).
 * @param {number} b1x
 * @param {number} b1y
 * @param {number} b2x
 * @param {number} b2y
 * @param {number} target_count
 * @returns {any}
 */
export function calculate_square_lattice_points(b1x, b1y, b2x, b2y, target_count) {
    const ret = wasm.calculate_square_lattice_points(b1x, b1y, b2x, b2y, target_count);
    return ret;
}

/**
 * Advanced separation by computing polygon difference using line intersections.
 * @param {any} raw
 * @returns {any}
 */
export function separate_brillouin_zones(raw) {
    const ret = wasm.separate_brillouin_zones(raw);
    return ret;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_4.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * WASM-exported function to calculate Brillouin zones
 * @param {number} a1_x
 * @param {number} a1_y
 * @param {number} a2_x
 * @param {number} a2_y
 * @param {number} max_zone
 * @returns {BrillouinZonesResult}
 */
export function calculate_brillouin_zones(a1_x, a1_y, a2_x, a2_y, max_zone) {
    const ret = wasm.calculate_brillouin_zones(a1_x, a1_y, a2_x, a2_y, max_zone);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return BrillouinZonesResult.__wrap(ret[0]);
}

/**
 * Adds two 32-bit integers.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function add(a, b) {
    const ret = wasm.add(a, b);
    return ret;
}

/**
 * Calculate the inverse of a 2x2 matrix
 * @param {number} a11
 * @param {number} a12
 * @param {number} a21
 * @param {number} a22
 * @returns {any}
 */
export function invert_matrix_2x2(a11, a12, a21, a22) {
    const ret = wasm.invert_matrix_2x2(a11, a12, a21, a22);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Calculate the inverse of a 3x3 matrix
 * @param {number} a11
 * @param {number} a12
 * @param {number} a13
 * @param {number} a21
 * @param {number} a22
 * @param {number} a23
 * @param {number} a31
 * @param {number} a32
 * @param {number} a33
 * @returns {any}
 */
export function invert_matrix_3x3(a11, a12, a13, a21, a22, a23, a31, a32, a33) {
    const ret = wasm.invert_matrix_3x3(a11, a12, a13, a21, a22, a23, a31, a32, a33);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Multiply two 2x2 matrices
 * @param {number} a11
 * @param {number} a12
 * @param {number} a21
 * @param {number} a22
 * @param {number} b11
 * @param {number} b12
 * @param {number} b21
 * @param {number} b22
 * @returns {any}
 */
export function multiply_matrix_2x2(a11, a12, a21, a22, b11, b12, b21, b22) {
    const ret = wasm.multiply_matrix_2x2(a11, a12, a21, a22, b11, b12, b21, b22);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Multiply two 3x3 matrices
 * @param {number} a11
 * @param {number} a12
 * @param {number} a13
 * @param {number} a21
 * @param {number} a22
 * @param {number} a23
 * @param {number} a31
 * @param {number} a32
 * @param {number} a33
 * @param {number} b11
 * @param {number} b12
 * @param {number} b13
 * @param {number} b21
 * @param {number} b22
 * @param {number} b23
 * @param {number} b31
 * @param {number} b32
 * @param {number} b33
 * @returns {any}
 */
export function multiply_matrix_3x3(a11, a12, a13, a21, a22, a23, a31, a32, a33, b11, b12, b13, b21, b22, b23, b31, b32, b33) {
    const ret = wasm.multiply_matrix_3x3(a11, a12, a13, a21, a22, a23, a31, a32, a33, b11, b12, b13, b21, b22, b23, b31, b32, b33);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Calculate transformation matrices for a 2D lattice
 * @param {number} a1x
 * @param {number} a1y
 * @param {number} a2x
 * @param {number} a2y
 * @param {number} b1x
 * @param {number} b1y
 * @param {number} b2x
 * @param {number} b2y
 * @returns {any}
 */
export function calculate_lattice_transformations(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y) {
    const ret = wasm.calculate_lattice_transformations(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

const BrillouinZonesResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_brillouinzonesresult_free(ptr >>> 0, 1));
/**
 * WASM-exported structure for returning zones
 */
export class BrillouinZonesResult {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BrillouinZonesResult.prototype);
        obj.__wbg_ptr = ptr;
        BrillouinZonesResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BrillouinZonesResultFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_brillouinzonesresult_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    get zones() {
        const ret = wasm.brillouinzonesresult_zones(this.__wbg_ptr);
        return ret;
    }
}

export function __wbg_String_8f0eb39a4a4c2f66(arg0, arg1) {
    const ret = String(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_buffer_609cc3eee51ed158(arg0) {
    const ret = arg0.buffer;
    return ret;
};

export function __wbg_call_672a4d21634d4a24() { return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
}, arguments) };

export function __wbg_done_769e5ede4b31c67b(arg0) {
    const ret = arg0.done;
    return ret;
};

export function __wbg_get_67b2ba62fc30de12() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_get_b9b93047fe3cf45b(arg0, arg1) {
    const ret = arg0[arg1 >>> 0];
    return ret;
};

export function __wbg_getwithrefkey_1dc361bd10053bfe(arg0, arg1) {
    const ret = arg0[arg1];
    return ret;
};

export function __wbg_instanceof_ArrayBuffer_e14585432e3737fc(arg0) {
    let result;
    try {
        result = arg0 instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Uint8Array_17156bcf118086a9(arg0) {
    let result;
    try {
        result = arg0 instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_isArray_a1eab7e0d067391b(arg0) {
    const ret = Array.isArray(arg0);
    return ret;
};

export function __wbg_iterator_9a24c88df860dc65() {
    const ret = Symbol.iterator;
    return ret;
};

export function __wbg_length_a446193dc22c12f8(arg0) {
    const ret = arg0.length;
    return ret;
};

export function __wbg_length_e2d2a49132c1b256(arg0) {
    const ret = arg0.length;
    return ret;
};

export function __wbg_new_405e22f390576ce2() {
    const ret = new Object();
    return ret;
};

export function __wbg_new_78feb108b6472713() {
    const ret = new Array();
    return ret;
};

export function __wbg_new_a12002a7f91c75be(arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
};

export function __wbg_next_25feadfc0913fea9(arg0) {
    const ret = arg0.next;
    return ret;
};

export function __wbg_next_6574e1a8a62d1055() { return handleError(function (arg0) {
    const ret = arg0.next();
    return ret;
}, arguments) };

export function __wbg_set_37837023f3d740e8(arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2;
};

export function __wbg_set_3f1d0b984ed272ed(arg0, arg1, arg2) {
    arg0[arg1] = arg2;
};

export function __wbg_set_65595bdd868b3009(arg0, arg1, arg2) {
    arg0.set(arg1, arg2 >>> 0);
};

export function __wbg_value_cd1ffa7b1ab794f1(arg0) {
    const ret = arg0.value;
    return ret;
};

export function __wbindgen_boolean_get(arg0) {
    const v = arg0;
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbindgen_in(arg0, arg1) {
    const ret = arg0 in arg1;
    return ret;
};

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_export_4;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(arg0) === 'function';
    return ret;
};

export function __wbindgen_is_object(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = arg0 === undefined;
    return ret;
};

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = arg0 == arg1;
    return ret;
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return ret;
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};


// some math functions     
var abs = Math.abs,
    ceil = Math.ceil,
    floor = Math.floor,
    round = Math.round,
    min = Math.min,
    max = Math.max,
    pow = Math.pow,
    sqrt = Math.sqrt,
    log = Math.log,
    sin = Math.sin,
    asin = Math.asin,
    cos = Math.cos,
    acos = Math.acos,
    tan = Math.tan,
    atan = Math.atan,
    atan2 = Math.atan2,
    
    // detected commonjs implementation
    isCommonJS = typeof module !== 'undefined' && module.exports,
    
    // some type references
    typeUndefined = 'undefined',
    typeString = 'string',
    typeNumber = 'number',
    
    // type references for internal types
    typeDrawable = 'drawable',
    typeLayer = 'layer',
    
    // shortcuts to the registry functions
    reg = Registry.register,
    regCreate = Registry.create,
    regGet = Registry.get,
    
    drawableCounter = 0,
    layerCounter = 0,
    
    reDelimitedSplit = /[\,\s]+/;
(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext("webgl");
    if (gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
})();
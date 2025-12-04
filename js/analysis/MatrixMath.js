// ============================================================
// V8 NEURAL HELIX - Matrix and Vector Math Utilities
// Column-major 4x4 matrices for WebGL compatibility
// ============================================================

const MatrixMath = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // VECTOR 3 OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    function vec3Create(x = 0, y = 0, z = 0) {
        return { x, y, z };
    }

    function vec3FromArray(arr) {
        return { x: arr[0], y: arr[1], z: arr[2] };
    }

    function vec3ToArray(v) {
        return [v.x, v.y, v.z];
    }

    function vec3Add(a, b) {
        return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    }

    function vec3Subtract(a, b) {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    }

    function vec3Scale(v, s) {
        return { x: v.x * s, y: v.y * s, z: v.z * s };
    }

    function vec3Dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    function vec3Cross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }

    function vec3Length(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    function vec3Normalize(v) {
        const len = vec3Length(v);
        if (len === 0) return { x: 0, y: 0, z: 0 };
        return { x: v.x / len, y: v.y / len, z: v.z / len };
    }

    function vec3Lerp(a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            z: a.z + (b.z - a.z) * t
        };
    }

    function vec3Distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function vec3Negate(v) {
        return { x: -v.x, y: -v.y, z: -v.z };
    }

    // ═══════════════════════════════════════════════════════════════
    // MATRIX 4x4 OPERATIONS (Column-Major for WebGL)
    // ═══════════════════════════════════════════════════════════════

    function mat4Create() {
        return new Float32Array(16);
    }

    function mat4Identity(out) {
        out = out || mat4Create();
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
    }

    function mat4Copy(out, a) {
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
        return out;
    }

    function mat4Multiply(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        return out;
    }

    // ═══════════════════════════════════════════════════════════════
    // TRANSFORMATION MATRICES
    // ═══════════════════════════════════════════════════════════════

    function mat4Translate(out, v) {
        mat4Identity(out);
        out[12] = v.x;
        out[13] = v.y;
        out[14] = v.z;
        return out;
    }

    function mat4Scale(out, v) {
        mat4Identity(out);
        out[0] = v.x;
        out[5] = v.y;
        out[10] = v.z;
        return out;
    }

    function mat4RotateX(out, angle) {
        mat4Identity(out);
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        out[5] = c;
        out[6] = s;
        out[9] = -s;
        out[10] = c;
        return out;
    }

    function mat4RotateY(out, angle) {
        mat4Identity(out);
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        out[0] = c;
        out[2] = -s;
        out[8] = s;
        out[10] = c;
        return out;
    }

    function mat4RotateZ(out, angle) {
        mat4Identity(out);
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        out[0] = c;
        out[1] = s;
        out[4] = -s;
        out[5] = c;
        return out;
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW MATRIX (lookAt)
    // ═══════════════════════════════════════════════════════════════

    function mat4LookAt(out, eye, center, up) {
        // Calculate Z axis (forward) = normalize(eye - center)
        const zAxis = vec3Normalize(vec3Subtract(eye, center));

        // Calculate X axis (right) = normalize(cross(up, zAxis))
        const xAxis = vec3Normalize(vec3Cross(up, zAxis));

        // Calculate Y axis (up) = cross(zAxis, xAxis)
        const yAxis = vec3Cross(zAxis, xAxis);

        // Build view matrix (column-major)
        out[0] = xAxis.x;
        out[1] = yAxis.x;
        out[2] = zAxis.x;
        out[3] = 0;

        out[4] = xAxis.y;
        out[5] = yAxis.y;
        out[6] = zAxis.y;
        out[7] = 0;

        out[8] = xAxis.z;
        out[9] = yAxis.z;
        out[10] = zAxis.z;
        out[11] = 0;

        out[12] = -vec3Dot(xAxis, eye);
        out[13] = -vec3Dot(yAxis, eye);
        out[14] = -vec3Dot(zAxis, eye);
        out[15] = 1;

        return out;
    }

    // ═══════════════════════════════════════════════════════════════
    // PROJECTION MATRICES
    // ═══════════════════════════════════════════════════════════════

    function mat4Perspective(out, fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;

        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;

        out[12] = 0;
        out[13] = 0;
        out[14] = 2 * far * near * nf;
        out[15] = 0;

        return out;
    }

    function mat4Orthographic(out, left, right, bottom, top, near, far) {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        out[0] = -2 * lr;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;

        out[4] = 0;
        out[5] = -2 * bt;
        out[6] = 0;
        out[7] = 0;

        out[8] = 0;
        out[9] = 0;
        out[10] = 2 * nf;
        out[11] = 0;

        out[12] = (left + right) * lr;
        out[13] = (top + bottom) * bt;
        out[14] = (far + near) * nf;
        out[15] = 1;

        return out;
    }

    // ═══════════════════════════════════════════════════════════════
    // MATRIX INVERSION
    // ═══════════════════════════════════════════════════════════════

    function mat4Invert(out, a) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;

        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
            return null;
        }
        det = 1.0 / det;

        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

        return out;
    }

    // ═══════════════════════════════════════════════════════════════
    // TRANSFORM VECTOR BY MATRIX
    // ═══════════════════════════════════════════════════════════════

    function mat4TransformVec3(out, m, v) {
        const x = v.x, y = v.y, z = v.z;
        const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1.0;

        out.x = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
        out.y = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
        out.z = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;

        return out;
    }

    function mat4TransformVec4(out, m, v) {
        const x = v[0], y = v[1], z = v[2], w = v[3];

        out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
        out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
        out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
        out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;

        return out;
    }

    // Project 3D point to screen coordinates (NDC -1 to 1)
    function projectToNDC(point, mvpMatrix) {
        const clipPos = [0, 0, 0, 0];
        mat4TransformVec4(clipPos, mvpMatrix, [point.x, point.y, point.z, 1.0]);

        // Perspective divide
        if (clipPos[3] !== 0) {
            return {
                x: clipPos[0] / clipPos[3],
                y: clipPos[1] / clipPos[3],
                z: clipPos[2] / clipPos[3],
                w: clipPos[3]
            };
        }
        return { x: 0, y: 0, z: 0, w: 1 };
    }

    // Unproject screen coordinates (NDC) to 3D ray
    function unprojectRay(ndcX, ndcY, invViewProj) {
        const nearPoint = { x: 0, y: 0, z: 0 };
        const farPoint = { x: 0, y: 0, z: 0 };

        // Near plane point
        const nearClip = [ndcX, ndcY, -1, 1];
        const nearWorld = [0, 0, 0, 0];
        mat4TransformVec4(nearWorld, invViewProj, nearClip);
        if (nearWorld[3] !== 0) {
            nearPoint.x = nearWorld[0] / nearWorld[3];
            nearPoint.y = nearWorld[1] / nearWorld[3];
            nearPoint.z = nearWorld[2] / nearWorld[3];
        }

        // Far plane point
        const farClip = [ndcX, ndcY, 1, 1];
        const farWorld = [0, 0, 0, 0];
        mat4TransformVec4(farWorld, invViewProj, farClip);
        if (farWorld[3] !== 0) {
            farPoint.x = farWorld[0] / farWorld[3];
            farPoint.y = farWorld[1] / farWorld[3];
            farPoint.z = farWorld[2] / farWorld[3];
        }

        return {
            origin: nearPoint,
            direction: vec3Normalize(vec3Subtract(farPoint, nearPoint))
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function smoothstep(edge0, edge1, x) {
        const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    function radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        // Vector 3
        vec3: {
            create: vec3Create,
            fromArray: vec3FromArray,
            toArray: vec3ToArray,
            add: vec3Add,
            subtract: vec3Subtract,
            scale: vec3Scale,
            dot: vec3Dot,
            cross: vec3Cross,
            length: vec3Length,
            normalize: vec3Normalize,
            lerp: vec3Lerp,
            distance: vec3Distance,
            negate: vec3Negate
        },

        // Matrix 4x4
        mat4: {
            create: mat4Create,
            identity: mat4Identity,
            copy: mat4Copy,
            multiply: mat4Multiply,
            translate: mat4Translate,
            scale: mat4Scale,
            rotateX: mat4RotateX,
            rotateY: mat4RotateY,
            rotateZ: mat4RotateZ,
            lookAt: mat4LookAt,
            perspective: mat4Perspective,
            orthographic: mat4Orthographic,
            invert: mat4Invert,
            transformVec3: mat4TransformVec3,
            transformVec4: mat4TransformVec4
        },

        // Projection helpers
        projectToNDC,
        unprojectRay,

        // Utilities
        clamp,
        lerp,
        smoothstep,
        degToRad,
        radToDeg
    };
})();

// Export for global access
window.MatrixMath = MatrixMath;

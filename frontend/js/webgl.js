// WebGL Particle Effect
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!this.gl) {
      console.warn('WebGL not supported');
      return;
    }
    
    this.particles = [];
    this.numParticles = 150;
    this.mouse = { x: 0, y: 0 };
    
    this.init();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }
  
  init() {
    this.resize();
    
    // Create particles
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
    
    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      attribute float a_size;
      attribute float a_alpha;
      varying float v_alpha;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        gl_PointSize = a_size;
        v_alpha = a_alpha;
      }
    `;
    
    // Fragment shader
    const fsSource = `
      precision mediump float;
      varying float v_alpha;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = v_alpha * (1.0 - dist * 2.0);
        gl_FragColor = vec4(0.78, 0.63, 0.31, alpha);
      }
    `;
    
    // Compile shaders
    const vs = this.compileShader(vsSource, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(fsSource, this.gl.FRAGMENT_SHADER);
    
    // Create program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);
    
    // Get locations
    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.sizeLocation = this.gl.getAttribLocation(this.program, 'a_size');
    this.alphaLocation = this.gl.getAttribLocation(this.program, 'a_alpha');
    
    // Create buffers
    this.positionBuffer = this.gl.createBuffer();
    this.sizeBuffer = this.gl.createBuffer();
    this.alphaBuffer = this.gl.createBuffer();
    
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }
  
  compileShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  animate() {
    if (!this.gl) return;
    
    // Update particles
    const positions = [];
    const sizes = [];
    const alphas = [];
    
    this.particles.forEach(p => {
      // Move towards mouse slightly
      p.vx += (this.mouse.x - p.x) * 0.00005;
      p.vy += (this.mouse.y - p.y) * 0.00005;
      
      p.x += p.vx;
      p.y += p.vy;
      
      // Wrap around
      if (p.x > 1.2) p.x = -1.2;
      if (p.x < -1.2) p.x = 1.2;
      if (p.y > 1.2) p.y = -1.2;
      if (p.y < -1.2) p.y = 1.2;
      
      positions.push(p.x, p.y);
      sizes.push(p.size);
      alphas.push(p.alpha);
    });
    
    // Clear
    this.gl.clearColor(0.05, 0.11, 0.16, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Draw
    this.gl.useProgram(this.program);
    
    // Positions
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    // Sizes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.sizeLocation);
    this.gl.vertexAttribPointer(this.sizeLocation, 1, this.gl.FLOAT, false, 0, 0);
    
    // Alphas
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.alphaBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(alphas), this.gl.DYNAMIC_DRAW);
    this.gl.enableVertexAttribArray(this.alphaLocation);
    this.gl.vertexAttribPointer(this.alphaLocation, 1, this.gl.FLOAT, false, 0, 0);
    
    this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length);
    
    // Draw connections
    this.drawConnections();
    
    requestAnimationFrame(() => this.animate());
  }
  
  drawConnections() {
    // Draw lines between nearby particles
    const linePositions = [];
    const threshold = 0.25;
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < threshold) {
          linePositions.push(
            this.particles[i].x, this.particles[i].y,
            this.particles[j].x, this.particles[j].y
          );
        }
      }
    }
    
    if (linePositions.length > 0) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(linePositions), this.gl.DYNAMIC_DRAW);
      this.gl.drawArrays(this.gl.LINES, 0, linePositions.length / 2);
    }
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('webgl-canvas');
  if (canvas) {
    new ParticleSystem(canvas);
  }
});

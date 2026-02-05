// Input buffering system for responsive controls
// Queues inputs to handle them even if they arrive between frames

export interface BufferedInput {
  action: 'jump' | 'dash' | 'down';
  timestamp: number;
  consumed: boolean;
}

export class InputBuffer {
  private buffer: BufferedInput[] = [];
  private readonly bufferWindow: number; // How long to keep buffered inputs (ms)
  private readonly maxBufferSize = 10;

  constructor(bufferWindow: number = 100) {
    this.bufferWindow = bufferWindow;
  }

  // Add an input to the buffer
  push(action: 'jump' | 'dash' | 'down'): void {
    // Prevent duplicate consecutive actions
    const lastInput = this.buffer[this.buffer.length - 1];
    if (lastInput && lastInput.action === action && !lastInput.consumed) {
      return;
    }

    this.buffer.push({
      action,
      timestamp: performance.now(),
      consumed: false
    });

    // Limit buffer size
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  // Try to consume a buffered input of a specific type
  // Returns true if a valid buffered input was found and consumed
  consume(action: 'jump' | 'dash' | 'down'): boolean {
    const now = performance.now();
    
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      const input = this.buffer[i];
      
      // Skip if too old
      if (now - input.timestamp > this.bufferWindow) {
        continue;
      }
      
      // Skip if already consumed
      if (input.consumed) {
        continue;
      }
      
      // Found a matching valid input
      if (input.action === action) {
        input.consumed = true;
        return true;
      }
    }
    
    return false;
  }

  // Check if there's a buffered input without consuming it
  peek(action: 'jump' | 'dash' | 'down'): boolean {
    const now = performance.now();
    
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      const input = this.buffer[i];
      
      if (now - input.timestamp > this.bufferWindow) {
        continue;
      }
      
      if (input.consumed) {
        continue;
      }
      
      if (input.action === action) {
        return true;
      }
    }
    
    return false;
  }

  // Clean up old inputs (call this periodically)
  cleanup(): void {
    const now = performance.now();
    const cutoff = now - this.bufferWindow * 2;
    
    this.buffer = this.buffer.filter(input => input.timestamp > cutoff);
  }

  // Get time since last input of a type (for coyote time, etc.)
  timeSinceLastInput(action: 'jump' | 'dash' | 'down'): number {
    const now = performance.now();
    
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      if (this.buffer[i].action === action) {
        return now - this.buffer[i].timestamp;
      }
    }
    
    return Infinity;
  }

  // Clear all buffered inputs
  clear(): void {
    this.buffer = [];
  }

  // Get buffer size (for debugging)
  getBufferSize(): number {
    return this.buffer.length;
  }

  // Set buffer window
  setBufferWindow(ms: number): void {
    (this as { bufferWindow: number }).bufferWindow = ms;
  }
}

// Singleton instance
let inputBufferInstance: InputBuffer | null = null;

export function getInputBuffer(): InputBuffer {
  if (!inputBufferInstance) {
    inputBufferInstance = new InputBuffer(100); // 100ms buffer window
  }
  return inputBufferInstance;
}

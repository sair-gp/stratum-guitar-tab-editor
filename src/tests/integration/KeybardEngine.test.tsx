/**
 * @file KeybardEngine.test.tsx
 * @description Bulletproof constructable mocks for Tone.js.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// TACTICAL HOISTING: Use traditional functions for constructability
vi.mock('tone', () => {
  function MockFilter() {
    return {
      toDestination: vi.fn().mockReturnThis(),
      connect: vi.fn().mockReturnThis(),
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() }
    };
  }

  function MockVibrato() {
    return {
      connect: vi.fn().mockReturnThis(),
      depth: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }
    };
  }

  function MockSampler() {
    return {
      connect: vi.fn().mockReturnThis(),
      triggerAttackRelease: vi.fn()
    };
  }

  return {
    start: vi.fn().mockResolvedValue(undefined),
    loaded: vi.fn().mockResolvedValue(undefined),
    now: vi.fn(() => 0),
    context: { state: 'suspended' },
    Filter: vi.fn().mockImplementation(MockFilter),
    Vibrato: vi.fn().mockImplementation(MockVibrato),
    Sampler: vi.fn().mockImplementation(MockSampler),
    Frequency: vi.fn().mockImplementation(() => ({
      transpose: vi.fn().mockReturnThis(),
      toNote: vi.fn(() => 'E2')
    })),
    Time: vi.fn().mockImplementation(() => ({
      toSeconds: vi.fn(() => 0.1)
    }))
  };
});

import { renderHook, act } from '@testing-library/react';
import { TabProvider, useTab } from '../../store/TabContext';
import { ShortcutProvider } from '../../store/ShortcutContext';
import { useKeyboardEngine } from '../../hooks/useKeyboardEngine';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TabProvider>
    <ShortcutProvider>
      {children}
    </ShortcutProvider>
  </TabProvider>
);

describe('Stratum Keyboard Engine Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.setAttribute('data-editor-input', 'true');
  });

  it('verifies ArrowRight moves the cursor', () => {
    renderHook(() => useKeyboardEngine(), { wrapper });
    const { result } = renderHook(() => useTab(), { wrapper });

    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'ArrowRight', 
        bubbles: true 
      }));
    });

    expect(result.current.cursor.columnIndex).toBe(1);
  });

  it('verifies numeric input updates the tab note', () => {
    renderHook(() => useKeyboardEngine(), { wrapper });
    const { result } = renderHook(() => useTab(), { wrapper });

    act(() => {
      result.current.setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
    });

    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { 
        key: '5', 
        bubbles: true 
      }));
    });

    const { rowIndex, columnIndex, stringIndex } = result.current.cursor;
    expect(result.current.tabSheet.rows[rowIndex].columns[columnIndex].notes[stringIndex]).toBe('5');
  });
});
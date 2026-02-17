import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TabProvider, useTab } from '../../store/TabContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TabProvider>{children}</TabProvider>
);

describe('TabContext Master Controller', () => {

  it('should initialize with a blank 32-column row', () => {
    const { result } = renderHook(() => useTab(), { wrapper });
    expect(result.current.tabSheet.rows[0].columns.length).toBe(32);
    expect(result.current.tabSheet.title).toBe('New Tab');
  });

  it('should handle multi-digit fret inputs (e.g., "1" then "2" = "12")', () => {
    const { result } = renderHook(() => useTab(), { wrapper });

    act(() => { result.current.updateNote('1'); });
    expect(result.current.tabSheet.rows[0].columns[0].notes[0]).toBe('1');

    act(() => { result.current.updateNote('2'); });
    expect(result.current.tabSheet.rows[0].columns[0].notes[0]).toBe('12');
  });

  it('should prevent frets higher than 24', () => {
    const { result } = renderHook(() => useTab(), { wrapper });

    act(() => { result.current.updateNote('2'); });
    act(() => { result.current.updateNote('5'); }); // 25 is invalid
    
    // Should reset to the last input or keep it within limits
    expect(result.current.tabSheet.rows[0].columns[0].notes[0]).toBe('5');
  });

  it('should toggle harmonic brackets without destroying the note', () => {
    const { result } = renderHook(() => useTab(), { wrapper });

    act(() => { result.current.updateNote('7'); });
    act(() => { result.current.updateNote('harmonic'); });
    expect(result.current.tabSheet.rows[0].columns[0].notes[0]).toBe('<7>');

    act(() => { result.current.updateNote('harmonic'); });
    expect(result.current.tabSheet.rows[0].columns[0].notes[0]).toBe('7');
  });

  it('should correctly handle Undo/Redo cycles', () => {
    const { result } = renderHook(() => useTab(), { wrapper });

    act(() => { result.current.updateNote('5'); });
    expect(result.current.tabSheet.rows[0].columns[0].notes[0]).toBe('5');

    act(() => { result.current.undo(); });
    expect(result.current.tabSheet.rows[0].columns[0].notes[0]).toBe('');

    act(() => { result.current.redo(); });
    expect(result.current.tabSheet.rows[0].columns[0].notes[0]).toBe('5');
  });

});
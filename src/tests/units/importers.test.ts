import { describe, it, expect } from 'vitest';
import { parseAsciiToTab } from '../../utils/asciiImport';


describe('Import Orchestrator', () => {
  it('identifies # STRATUM_PROTOCOL_V1 and uses Precision Scanner', () => {
    const protocolTab = `# STRATUM_PROTOCOL_V1\nTest - Artist\nTempo: 120 BPM\n\nStaff 1\nE |---0---|`;
    const result = parseAsciiToTab(protocolTab);
    
    // If it used Precision Scanner, it found the Title correctly
    expect(result.title).toBe('Test');
    expect(result.artist).toBe('Artist');
  });

  it('identifies non-protocol text and routes to Universal Wash', () => {
    const sewerTab = `e|---7---7---|\nB|---8---8---|`; // No Protocol Tag
    const result = parseAsciiToTab(sewerTab);
    
    // The Washer defaults to 'Washed Import' or scavenges
    expect(result.artist).toBe('Universal Salvage'); 
  });
});
import { colorText, boldText, colorBoldText, getThemeColors } from '../../utils/color';

describe('colorText', () => {
  it('should apply color to text', () => {
    expect(colorText('red', 'test')).toContain('test');
  });
});

describe('boldText', () => {
  it('should apply bold formatting', () => {
    expect(boldText('test')).toContain('test');
  });
});

describe('colorBoldText', () => {
  it('should apply color and bold formatting', () => {
    expect(colorBoldText('blue', 'test')).toContain('test');
  });
});

describe('getThemeColors', () => {
  it('should return theme colors for default', () => {
    const colors = getThemeColors('default');
    expect(colors.primary).toBeDefined();
  });
  it('should return theme colors for light', () => {
    const colors = getThemeColors('light');
    expect(colors.primary).toBe('blue');
  });
}); 
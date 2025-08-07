/**
 * Color and formatting utilities for the welcome message system
 */
import chalk from 'chalk';
import { ColorTheme } from '../types/config';

export type ColorName = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';

/**
 * Get chalk color function based on color name
 */
const getColorFn = (colorName: ColorName) => {
  switch (colorName) {
    case 'black': return chalk.black;
    case 'red': return chalk.red;
    case 'green': return chalk.green;
    case 'yellow': return chalk.yellow;
    case 'blue': return chalk.blue;
    case 'magenta': return chalk.magenta;
    case 'cyan': return chalk.cyan;
    case 'white': return chalk.white;
    default: return chalk.white;
  }
};

/**
 * Apply color to text
 */
export const colorText = (color: ColorName, text: string): string => {
  const colorFn = getColorFn(color);
  return colorFn(text);
};

/**
 * Apply bold formatting to text
 */
export const boldText = (text: string): string => {
  return chalk.bold(text);
};

/**
 * Apply both color and bold formatting to text
 */
export const colorBoldText = (color: ColorName, text: string): string => {
  const colorFn = getColorFn(color);
  return colorFn.bold(text);
};

/**
 * Get theme-specific colors based on the selected theme
 */
export const getThemeColors = (theme: ColorTheme) => {
  switch (theme) {
    case 'light':
      return {
        primary: 'blue',
        secondary: 'cyan',
        accent: 'magenta',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        info: 'blue',
        muted: 'black'
      } as const;
    
    case 'dark':
      return {
        primary: 'cyan',
        secondary: 'blue',
        accent: 'magenta',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        info: 'cyan',
        muted: 'white'
      } as const;
    
    case 'pastel':
      return {
        primary: 'magenta',
        secondary: 'cyan',
        accent: 'yellow',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        info: 'blue',
        muted: 'black'
      } as const;
    
    case 'default':
    default:
      return {
        primary: 'blue',
        secondary: 'green',
        accent: 'yellow',
        success: 'green',
        warning: 'yellow',
        error: 'red',
        info: 'cyan',
        muted: 'white'
      } as const;
  }
};

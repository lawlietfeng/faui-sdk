import { BaseComponentConfig, ActionConfig } from '../schema';

export interface CalendarComponentConfig extends BaseComponentConfig {
  component: 'calendar';
  
  // Appearance
  fullscreen?: boolean | string;
  mode?: 'month' | 'year' | string;
  
  // Date format string when saving to dataModel (default: YYYY-MM-DD)
  format?: string;

  // Custom events
  on_panel_change?: ActionConfig;
}

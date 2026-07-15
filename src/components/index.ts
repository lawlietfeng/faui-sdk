import React from 'react';
import type { Component, ComponentType, ExtractComponent } from '../types/schema';
import { Form } from './Form';
import { Flex } from './Flex';
import { Row, Col } from './Grid';
import { Space } from './Space';
import { Layout, Header, Sider, Content, Footer } from './Layout';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Empty } from './Empty';
import { Statistic } from './Statistic';
import { Timeline } from './Timeline';
import { QRCode } from './QRCode';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { Watermark } from './Watermark';
import { Skeleton } from './Skeleton';
import { Box } from './Box';
import { Text } from './Text';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { Radio } from './Radio';
import { Checkbox } from './Checkbox';
import { DatePicker } from './DatePicker';
import { Upload } from './Upload';
import { StepIndicator } from './StepIndicator';
import { List } from './List';
import { Table } from './Table';
import { Switch } from './Switch';
import { InputNumber } from './InputNumber';
import { Slider } from './Slider';
import { Rate } from './Rate';
import { Cascader } from './Cascader';
import { TreeSelect } from './TreeSelect';
import { TimePicker } from './TimePicker';
import { ColorPicker } from './ColorPicker';
import { Transfer } from './Transfer';
import { AutoComplete } from './AutoComplete';
import { Mentions } from './Mentions';
import { Card } from './Card';
import { Divider } from './Divider';
import { Collapse } from './Collapse';
import { Tag } from './Tag';
import { Image } from './Image';
import { Descriptions } from './Descriptions';
import { Alert } from './Alert';
import { Pagination } from './Pagination';
import { Progress } from './Progress';
import { Spin } from './Spin';
import { Tabs } from './Tabs';
import { Menu } from './Menu';
import { Segmented } from './Segmented';
import { Tree } from './Tree';
import { Calendar } from './Calendar';
import { Steps } from './Steps';
import { Carousel } from './Carousel';
import { Tour } from './Tour';
import { Modal } from './Modal';
import { Drawer } from './Drawer';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';
import { Popconfirm } from './Popconfirm';
import { Dropdown } from './Dropdown';
import { FloatButton } from './FloatButton';
import { Affix } from './Affix';
import { Anchor } from './Anchor';
import { Condition } from './Condition';
import { Repeater } from './Repeater';
import { Chart } from './Chart';

export interface ComponentProps<T extends ComponentType | any = any> {
  config: T extends ComponentType ? ExtractComponent<T> : Component;
  componentMap: Map<string, Component>;
}

export type ComponentRegistry = Record<string, React.FC<ComponentProps<any>>>;

export const ComponentRegistry: ComponentRegistry = {
  form: Form,
  flex: Flex,
  grid: Row, // Mapping grid component to Row to fix Unknown component type: grid
  row: Row,
  col: Col,
  space: Space,
  layout: Layout,
  header: Header,
  sider: Sider,
  content: Content,
  footer: Footer,
  avatar: Avatar,
  badge: Badge,
  empty: Empty,
  statistic: Statistic,
  timeline: Timeline,
  qrcode: QRCode,
  typography: Typography,
  icon: Icon,
  watermark: Watermark,
  skeleton: Skeleton,
  box: Box,
  text: Text,
  button: Button,
  input: Input,
  textarea: Textarea,
  select: Select,
  radio: Radio,
  checkbox: Checkbox,
  datepicker: DatePicker,
  upload: Upload,
  stepindicator: StepIndicator,
  list: List,
  table: Table,
  switch: Switch,
  inputnumber: InputNumber,
  slider: Slider,
  rate: Rate,
  cascader: Cascader,
  treeselect: TreeSelect,
  timepicker: TimePicker,
  colorpicker: ColorPicker,
  transfer: Transfer,
  autocomplete: AutoComplete,
  mentions: Mentions,
  card: Card,
  divider: Divider,
  collapse: Collapse,
  tag: Tag,
  image: Image,
  descriptions: Descriptions,
  alert: Alert,
  pagination: Pagination,
  progress: Progress,
  spin: Spin,
  tabs: Tabs,
  menu: Menu,
  segmented: Segmented,
  tree: Tree,
  calendar: Calendar,
  steps: Steps,
  carousel: Carousel,
  tour: Tour,
  modal: Modal,
  drawer: Drawer,
  popover: Popover,
  tooltip: Tooltip,
  popconfirm: Popconfirm,
  dropdown: Dropdown,
  float_button: FloatButton,
  affix: Affix,
  anchor: Anchor,
  condition: Condition,
  repeater: Repeater,
  chart: Chart,
};

export function registerComponent(
  type: ComponentType,
  component: React.FC<ComponentProps<any>>
): void {
  ComponentRegistry[type] = component;
}

export function createExtendedRegistry(
  customComponents: Record<string, React.FC<ComponentProps<any>>>
): ComponentRegistry {
  return { ...ComponentRegistry, ...customComponents };
}

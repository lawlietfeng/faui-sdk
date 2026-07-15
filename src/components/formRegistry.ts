import React from 'react';
import type { ComponentProps } from './index';
import { Form } from './Form';
import { Flex } from './Flex';
import { Row, Col } from './Grid';
import { Space } from './Space';
import { Layout, Header, Sider, Content, Footer } from './Layout';
import { Box } from './Box';
import { Divider } from './Divider';
import { Text } from './Text';
import { Button } from './Button';
import { Icon } from './Icon';
import { Typography } from './Typography';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { Radio } from './Radio';
import { Checkbox } from './Checkbox';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { Upload } from './Upload';
import { Switch } from './Switch';
import { InputNumber } from './InputNumber';
import { Slider } from './Slider';
import { Rate } from './Rate';
import { Cascader } from './Cascader';
import { TreeSelect } from './TreeSelect';
import { ColorPicker } from './ColorPicker';
import { Transfer } from './Transfer';
import { AutoComplete } from './AutoComplete';
import { Mentions } from './Mentions';
import { Calendar } from './Calendar';
import { Segmented } from './Segmented';
import { Alert } from './Alert';
import { Tag } from './Tag';
import { Spin } from './Spin';
import { Skeleton } from './Skeleton';
import { Progress } from './Progress';
import { Modal } from './Modal';
import { Drawer } from './Drawer';
import { Tooltip } from './Tooltip';
import { Popover } from './Popover';
import { Popconfirm } from './Popconfirm';
import { Condition } from './Condition';
import { Repeater } from './Repeater';

export type FormComponentRegistryType = Record<string, React.FC<ComponentProps>>;

export const FormComponentRegistry: FormComponentRegistryType = {
  // Layout
  box: Box,
  flex: Flex,
  grid: Row,
  row: Row,
  col: Col,
  space: Space,
  layout: Layout,
  header: Header,
  sider: Sider,
  content: Content,
  footer: Footer,
  divider: Divider,

  // Form inputs
  form: Form,
  input: Input,
  textarea: Textarea,
  select: Select,
  radio: Radio,
  checkbox: Checkbox,
  datepicker: DatePicker,
  timepicker: TimePicker,
  upload: Upload,
  switch: Switch,
  inputnumber: InputNumber,
  slider: Slider,
  rate: Rate,
  cascader: Cascader,
  treeselect: TreeSelect,
  colorpicker: ColorPicker,
  transfer: Transfer,
  autocomplete: AutoComplete,
  mentions: Mentions,
  button: Button,
  calendar: Calendar,
  segmented: Segmented,

  // Helpers
  text: Text,
  icon: Icon,
  typography: Typography,
  alert: Alert,
  tag: Tag,
  spin: Spin,
  skeleton: Skeleton,
  progress: Progress,
  modal: Modal,
  drawer: Drawer,
  tooltip: Tooltip,
  popover: Popover,
  popconfirm: Popconfirm,
  condition: Condition,
  repeater: Repeater,
};

import React, { Component, useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';
import { ConfigProvider, Switch, theme } from 'antd';
import { ActionRegistry, ComponentRegistry, Renderer, SchemaRenderer, evaluateExpression } from '../src/full';
import type {
  ActionConfig,
  Activity,
  ActivitySnapshot,
  DataModel,
  HttpRequestConfig,
  RendererHandle,
  SubmitResult,
  ValidationResult,
} from '../src/full';

const schemaModules = import.meta.glob('./schemas/*.json', { eager: true }) as Record<
  string,
  { default: Activity[] }
>;
const schemaOptions = Object.entries(schemaModules)
  .map(([filePath, module]) => {
    const fileName = filePath.split('/').pop()?.replace('.json', '') ?? filePath;
    return {
      key: fileName,
      label: fileName,
      schema: module.default,
    };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

const MOCK_USERS = [
  { id: 'u1', name: '王欣', department: '研发部', role: '前端工程师', status: '在职' },
  { id: 'u2', name: '李楠', department: '产品部', role: '产品经理', status: '在职' },
  { id: 'u3', name: '张磊', department: '设计部', role: 'UI 设计师', status: '试用' },
];

const httpRequest = async (config: HttpRequestConfig) => {
  console.log('HTTP Request:', config);

  if (config.url.startsWith('/api/mock/')) {
    const route = config.url.replace('/api/mock/', '');
    if (route === 'users') {
      await new Promise(r => setTimeout(r, 1500));
      return { success: true, data: MOCK_USERS, total: MOCK_USERS.length };
    }
    if (route === 'fail') {
      await new Promise(r => setTimeout(r, 1000));
      throw new Error('服务器内部错误 (500): 模拟请求失败');
    }
    if (route === 'chart-data') {
      await new Promise(r => setTimeout(r, 800));
      return {
        success: true,
        data: {
          monthly: [
            { month: '1月', revenue: 4200, cost: 2800, profit: 1400 },
            { month: '2月', revenue: 3800, cost: 2600, profit: 1200 },
            { month: '3月', revenue: 5100, cost: 3200, profit: 1900 },
            { month: '4月', revenue: 4700, cost: 2900, profit: 1800 },
            { month: '5月', revenue: 6200, cost: 3500, profit: 2700 },
            { month: '6月', revenue: 5800, cost: 3300, profit: 2500 },
          ],
          categories: [
            { name: '电子产品', value: 4500 },
            { name: '服装', value: 3200 },
            { name: '食品', value: 2800 },
            { name: '家居', value: 2100 },
            { name: '其他', value: 1400 },
          ],
        },
      };
    }
  }

  const response = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
  });
  return response.json();
};

interface DemoActionExecutor {
  updateData: (path: string, value: unknown) => void;
  context: {
    $root: Record<string, unknown>;
    $current?: unknown;
    $parent?: unknown;
    [key: string]: unknown;
  };
}

function evaluateInContext(value: unknown, context: DemoActionExecutor['context']): unknown {
  if (typeof value === 'string') {
    return evaluateExpression(value, context);
  }
  return value;
}

function registerDemoExtendedActions() {
  ActionRegistry.copy = async (action: ActionConfig, executor: DemoActionExecutor) => {
    const text = evaluateInContext((action.payload as any)?.text ?? '', executor.context);
    const normalized = String(text ?? '');

    if (!normalized) {
      console.warn('copy action requires payload.text');
      return;
    }

    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalized);
      console.log('[copy] copied to clipboard:', normalized);
    } else {
      window.prompt('请手动复制以下内容：', normalized);
    }
  };

  ActionRegistry.send_prompt = async (action: ActionConfig, executor: DemoActionExecutor) => {
    const promptText = evaluateInContext((action.payload as any)?.prompt ?? '', executor.context);
    const channel = evaluateInContext((action.payload as any)?.channel ?? 'default', executor.context);
    console.log('[send_prompt] channel:', channel, 'prompt:', promptText);
    window.alert(`send_prompt 已接管\nchannel: ${channel}\nprompt: ${promptText}`);
  };

  ActionRegistry.mcp_tool_call = async (action: ActionConfig, executor: DemoActionExecutor) => {
    const tool = evaluateInContext((action.payload as any)?.tool ?? 'unknown', executor.context);
    const args = evaluateInContext((action.payload as any)?.arguments ?? {}, executor.context);
    console.log('[mcp_tool_call] tool:', tool, 'arguments:', args);
    window.alert(`mcp_tool_call 已接管\ntool: ${tool}\narguments: ${JSON.stringify(args)}`);
  };

  ActionRegistry.input_prompt = async (action: ActionConfig, executor: DemoActionExecutor) => {
    const payload = (action.payload || {}) as Record<string, unknown>;
    const title = String(evaluateInContext(payload.title ?? '请输入内容', executor.context));
    const placeholder = String(evaluateInContext(payload.placeholder ?? '', executor.context));
    const defaultValue = String(evaluateInContext(payload.defaultValue ?? '', executor.context));
    const resultPath = payload.resultPath ? String(payload.resultPath) : undefined;

    const result = window.prompt(`${title}${placeholder ? `\n${placeholder}` : ''}`, defaultValue);
    if (resultPath && result !== null) {
      executor.updateData(resultPath, result);
    }
    console.log('[input_prompt] result:', result, 'resultPath:', resultPath);
  };
}

interface RendererErrorBoundaryProps {
  schemaKey: string;
  children: ReactNode;
}

interface RendererErrorBoundaryState {
  errorMessage: string;
}

class RendererErrorBoundary extends Component<
  RendererErrorBoundaryProps,
  RendererErrorBoundaryState
> {
  state: RendererErrorBoundaryState = { errorMessage: '' };

  static getDerivedStateFromError(error: Error): RendererErrorBoundaryState {
    return { errorMessage: error.message || '数据结构有问题，渲染失败' };
  }

  componentDidUpdate(prevProps: RendererErrorBoundaryProps) {
    if (prevProps.schemaKey !== this.props.schemaKey && this.state.errorMessage) {
      this.setState({ errorMessage: '' });
    }
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div style={{ color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: 12 }}>
          数据结构有问题，渲染失败：{this.state.errorMessage}
        </div>
      );
    }
    return this.props.children;
  }
}

const BAR_HEIGHT = 48;
const EXTERNAL_SUBMIT_SCHEMA_KEY = '19-外部提交演示';
const EXTERNAL_SUBMIT_FORM_ID = 'external-submit-form';

interface ExternalSubmitDemoState {
  status: string;
  data?: DataModel;
  validation?: ValidationResult;
  error?: string;
}

interface ResultPanelProps {
  title: string;
  value: unknown;
  colors: {
    panelBorder: string;
    textMuted: string;
    inputBg: string;
    text: string;
  };
}

const ResultPanel: React.FC<ResultPanelProps> = ({ title, value, colors }) => (
  <div style={{ border: `1px solid ${colors.panelBorder}`, borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ padding: '6px 10px', color: colors.textMuted, fontSize: 12 }}>{title}</div>
    <pre style={{
      margin: 0, padding: 10, minHeight: 64,
      background: colors.inputBg, color: colors.text,
      fontSize: 11, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
    }}>
      {value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
    </pre>
  </div>
);

export default function App() {
  useEffect(() => {
    registerDemoExtendedActions();
  }, []);

  const initialOption = schemaOptions[0];
  const [selectedKey, setSelectedKey] = useState(initialOption?.key ?? '');
  const [isDark, setIsDark] = useState(false);
  const [renderMode, setRenderMode] = useState<'lifecycle' | 'pure'>('lifecycle');
  const [showJson, setShowJson] = useState(false);
  const rendererRef = useRef<RendererHandle>(null);
  const [simulateSubmitFailure, setSimulateSubmitFailure] = useState(false);
  const [externalSubmitState, setExternalSubmitState] = useState<ExternalSubmitDemoState>({
    status: '等待操作',
  });

  const selectedOption = useMemo(
    () => schemaOptions.find(option => option.key === selectedKey) ?? initialOption,
    [initialOption, selectedKey]
  );

  const getFormattedSchemaForMode = (schema: Activity[], mode: 'lifecycle' | 'pure') => {
    if (mode === 'lifecycle') return schema;
    const snapshot = schema.find(s => s.type === 'ACTIVITY_SNAPSHOT') as ActivitySnapshot | undefined;
    return snapshot?.content || { components: [], dataModel: {} };
  };

  const [editorValue, setEditorValue] = useState(
    selectedOption ? JSON.stringify(getFormattedSchemaForMode(selectedOption.schema, renderMode), null, 2) : '[]'
  );

  const [activeSchema, setActiveSchema] = useState<any>(
    selectedOption ? getFormattedSchemaForMode(selectedOption.schema, renderMode) : []
  );

  const [deltaStep, setDeltaStep] = useState(0);
  const totalDeltas = useMemo(() => {
    if (!selectedOption || renderMode !== 'lifecycle') return 0;
    return selectedOption.schema.filter(s => s.type === 'ACTIVITY_DELTA').length;
  }, [selectedOption, renderMode]);

  const [schemaRevision, setSchemaRevision] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedOption || renderMode !== 'lifecycle') return;

    try {
      const fullSchema = selectedOption.schema;
      const snapshot = fullSchema.find(s => s.type === 'ACTIVITY_SNAPSHOT');
      const deltas = fullSchema.filter(s => s.type === 'ACTIVITY_DELTA');

      const currentSchema = [snapshot, ...deltas.slice(0, deltaStep)].filter(Boolean);

      setEditorValue(JSON.stringify(currentSchema, null, 2));
      setActiveSchema(currentSchema);
      setSchemaRevision(value => value + 1);
    } catch (err) {
      console.error('Failed to apply delta step', err);
    }
  }, [deltaStep, selectedOption, renderMode]);

  const handleModeChange = useCallback((checked: boolean) => {
    const newMode = checked ? 'lifecycle' : 'pure';
    setRenderMode(newMode);

    try {
      const parsed = JSON.parse(editorValue);
      let newSchema: any;

      if (newMode === 'lifecycle') {
        newSchema = [{ type: 'ACTIVITY_SNAPSHOT', content: parsed }];
      } else {
        const snapshot = Array.isArray(parsed) ? parsed.find(s => s.type === 'ACTIVITY_SNAPSHOT') : null;
        newSchema = snapshot?.content || { components: [], dataModel: {} };
      }

      setEditorValue(JSON.stringify(newSchema, null, 2));
      setActiveSchema(newSchema);
      setSchemaRevision(value => value + 1);
      setError('');
    } catch {
      if (selectedOption) {
        const fallbackSchema = getFormattedSchemaForMode(selectedOption.schema, newMode);
        setEditorValue(JSON.stringify(fallbackSchema, null, 2));
        setActiveSchema(fallbackSchema);
        setSchemaRevision(value => value + 1);
        setError('');
      }
    }
  }, [editorValue, selectedOption]);

  const handleSelectChange = useCallback((key: string) => {
    const nextOption = schemaOptions.find(option => option.key === key);
    if (!nextOption) return;
    setSelectedKey(key);
    setDeltaStep(0);
    const newSchema = getFormattedSchemaForMode(nextOption.schema, renderMode);
    const formatted = JSON.stringify(newSchema, null, 2);
    setEditorValue(formatted);
    setActiveSchema(newSchema);
    setSchemaRevision(value => value + 1);
    setError('');
  }, [renderMode]);

  const handleApplyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(editorValue);
      if (renderMode === 'lifecycle' && Array.isArray(parsed)) {
        const deltasCount = parsed.filter(s => s.type === 'ACTIVITY_DELTA').length;
        setDeltaStep(deltasCount);
      }
      setActiveSchema(parsed);
      setSchemaRevision(value => value + 1);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON 解析失败');
    }
  }, [editorValue, renderMode]);

  const handleReset = useCallback(() => {
    if (!selectedOption) {
      setEditorValue('[]');
      setActiveSchema([]);
      setError('');
      return;
    }
    setDeltaStep(0);
    const newSchema = getFormattedSchemaForMode(selectedOption.schema, renderMode);
    const formatted = JSON.stringify(newSchema, null, 2);
    setEditorValue(formatted);
    setActiveSchema(newSchema);
    setSchemaRevision(value => value + 1);
    setError('');
  }, [selectedOption, renderMode]);

  // Close drawer on Escape
  useEffect(() => {
    if (!showJson) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowJson(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showJson]);

  const rendererKey = `${selectedKey}:${schemaRevision}`;
  const isExternalSubmitDemo = selectedKey === EXTERNAL_SUBMIT_SCHEMA_KEY;

  useEffect(() => {
    setExternalSubmitState({ status: '等待操作' });
    setSimulateSubmitFailure(false);
  }, [selectedKey, renderMode]);

  const handleDemoValidate = useCallback(async () => {
    setExternalSubmitState({ status: '校验中' });
    const result = await rendererRef.current?.validate(EXTERNAL_SUBMIT_FORM_ID);
    if (!result) {
      setExternalSubmitState({ status: '校验失败', error: 'Renderer ref 尚未就绪' });
      return;
    }
    setExternalSubmitState({
      status: result.valid ? '校验通过，未执行提交' : '校验未通过',
      data: result.data,
      validation: result,
    });
  }, []);

  const handleDemoSubmit = useCallback(async (validate: boolean) => {
    setExternalSubmitState(previous => ({ ...previous, status: validate ? '校验并提交中' : '跳过校验提交中', error: undefined }));
    const result: SubmitResult | undefined = await rendererRef.current?.submit(
      EXTERNAL_SUBMIT_FORM_ID,
      { validate },
    );
    if (!result) {
      setExternalSubmitState({ status: '提交失败', error: 'Renderer ref 尚未就绪' });
      return;
    }
    setExternalSubmitState({
      status: result.status,
      data: result.data,
      validation: result.validation,
      error: result.error instanceof Error ? result.error.message : result.error ? String(result.error) : undefined,
    });
  }, []);

  const handleDemoCustomValidate = useCallback(async (
    data: DataModel,
    context: { formId: string },
  ): Promise<ValidationResult> => {
    const profile = data.profile as Record<string, unknown> | undefined;
    const blocked = profile?.name === 'blocked';
    return {
      valid: !blocked,
      formId: context.formId,
      data,
      errors: blocked ? { 'profile-name': '姓名 blocked 被自定义校验拒绝' } : {},
    };
  }, []);

  const handleDemoOnSubmit = useCallback(async (data: DataModel, context: { formId: string }) => {
    setExternalSubmitState({
      status: 'onSubmit 请求处理中',
      data,
    });
    await new Promise(resolve => setTimeout(resolve, 800));
    if (simulateSubmitFailure) {
      throw new Error('模拟外部提交请求失败');
    }
    console.log('[External Submit Demo]', {
      formId: context.formId,
      data,
    });
  }, [simulateSubmitFailure]);

  const colors = useMemo(
    () =>
      isDark
        ? {
            appBg: '#0f111a',
            barBg: 'rgba(22,27,34,0.88)',
            panelBg: '#161b22',
            panelBorder: '#2d3748',
            text: '#e2e8f0',
            textMuted: '#8b949e',
            inputBg: '#0d1117',
            inputBorder: '#30363d',
            error: '#f87171',
            accent: '#58a6ff',
          }
        : {
            appBg: '#f8fafc',
            barBg: 'rgba(255,255,255,0.88)',
            panelBg: '#ffffff',
            panelBorder: '#e2e8f0',
            text: '#1e293b',
            textMuted: '#64748b',
            inputBg: '#ffffff',
            inputBorder: '#cbd5e1',
            error: '#ef4444',
            accent: '#3b82f6',
          },
    [isDark]
  );

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    height: 30,
    padding: '0 10px',
    border: `1px solid ${active ? colors.accent : colors.inputBorder}`,
    borderRadius: 6,
    background: active ? colors.accent : 'transparent',
    color: active ? '#fff' : colors.text,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
  });

  const currentDeltaDesc = deltaStep > 0 && selectedOption?.schema
    ? (selectedOption.schema.filter((s: any) => s.type === 'ACTIVITY_DELTA')[deltaStep - 1] as any)?.description
    : null;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary: isDark ? '#ffffff' : '#000000' },
      }}
    >
      {/* ===== Fixed Top Bar ===== */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: BAR_HEIGHT,
        display: 'flex', alignItems: 'center', padding: '0 16px',
        background: colors.barBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.panelBorder}`,
        zIndex: 1000, gap: 10,
        color: colors.text,
        fontSize: 13,
      }}>
        {/* Left: Logo + Schema Selector */}
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1, marginRight: 4 }}>FAUI</span>
        <select
          value={selectedKey}
          onChange={e => handleSelectChange(e.target.value)}
          style={{
            height: 30, maxWidth: 260,
            background: colors.inputBg, color: colors.text,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: 6, fontSize: 12, padding: '0 8px',
          }}
          disabled={schemaOptions.length === 0}
        >
          {schemaOptions.length === 0 && <option value="">无可用 schema</option>}
          {schemaOptions.map(option => (
            <option key={option.key} value={option.key}>{option.label}</option>
          ))}
        </select>

        {/* Center: Delta Progress (only in lifecycle mode with deltas) */}
        {renderMode === 'lifecycle' && totalDeltas > 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: 'center', minWidth: 0,
          }}>
            <span style={{ fontSize: 12, color: colors.textMuted, flexShrink: 0 }}>Delta</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent, flexShrink: 0 }}>
              {deltaStep}/{totalDeltas}
            </span>
            <div style={{
              width: 100, height: 4, background: colors.inputBorder,
              borderRadius: 2, overflow: 'hidden', flexShrink: 0,
            }}>
              <div style={{
                height: '100%', background: colors.accent,
                width: `${(deltaStep / totalDeltas) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            {currentDeltaDesc && (
              <span style={{
                fontSize: 11, color: colors.textMuted, fontStyle: 'italic',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 200,
              }}>
                {currentDeltaDesc}
              </span>
            )}
            <button
              onClick={() => setDeltaStep(Math.min(totalDeltas, deltaStep + 1))}
              disabled={deltaStep >= totalDeltas}
              style={{
                ...btnStyle(),
                background: deltaStep >= totalDeltas ? colors.inputBg : colors.accent,
                color: deltaStep >= totalDeltas ? colors.textMuted : '#fff',
                border: 'none',
                opacity: deltaStep >= totalDeltas ? 0.5 : 1,
                cursor: deltaStep >= totalDeltas ? 'not-allowed' : 'pointer',
              }}
            >
              {deltaStep === 0 ? 'Apply Delta' : deltaStep >= totalDeltas ? 'Done' : 'Next'}
            </button>
          </div>
        )}

        {/* Spacer when no delta bar */}
        {!(renderMode === 'lifecycle' && totalDeltas > 0) && <div style={{ flex: 1 }} />}

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: colors.textMuted }}>
            {renderMode === 'lifecycle' ? 'Lifecycle' : 'Pure'}
          </span>
          <Switch
            size="small"
            checked={renderMode === 'lifecycle'}
            onChange={handleModeChange}
          />

          <div style={{ width: 1, height: 20, background: colors.panelBorder }} />

          <Switch
            size="small"
            checked={isDark}
            onChange={setIsDark}
            checkedChildren="D"
            unCheckedChildren="L"
          />

          <div style={{ width: 1, height: 20, background: colors.panelBorder }} />

          <button onClick={() => setShowJson(!showJson)} style={btnStyle(showJson)}>
            {'{ }'} JSON
          </button>
        </div>
      </div>

      {/* ===== Full-Width Render Area ===== */}
      <div style={{
        paddingTop: BAR_HEIGHT,
        minHeight: '100vh',
        background: colors.appBg,
      }}>
        {isExternalSubmitDemo && (
          <div style={{
            margin: '16px 24px 0', padding: 16,
            border: `1px solid ${colors.panelBorder}`,
            borderRadius: 10, background: colors.panelBg, color: colors.text,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <strong>宿主页面外部操作区</strong>
              <button onClick={handleDemoValidate} style={btnStyle()}>校验</button>
              <button onClick={() => handleDemoSubmit(true)} style={btnStyle(true)}>外部提交</button>
              <button onClick={() => handleDemoSubmit(false)} style={btnStyle()}>跳过校验提交</button>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={simulateSubmitFailure}
                  onChange={event => setSimulateSubmitFailure(event.target.checked)}
                />
                模拟请求失败
              </label>
              <span style={{ color: colors.accent, fontSize: 12 }}>
                状态：{externalSubmitState.status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 12 }}>
              <ResultPanel title="提交 data" value={externalSubmitState.data} colors={colors} />
              <ResultPanel title="validation" value={externalSubmitState.validation} colors={colors} />
              <ResultPanel title="error" value={externalSubmitState.error} colors={colors} />
            </div>
          </div>
        )}
        <RendererErrorBoundary schemaKey={rendererKey}>
          {renderMode === 'lifecycle' ? (
            <Renderer
              ref={rendererRef}
              key={rendererKey}
              schema={activeSchema}
              httpRequest={httpRequest}
              onValidate={isExternalSubmitDemo ? handleDemoCustomValidate : undefined}
              onSubmit={isExternalSubmitDemo ? handleDemoOnSubmit : undefined}
              onAction={(action, context) => {
                console.log('Action executed (Lifecycle):', action, context);
              }}
            />
          ) : (
            <SchemaRenderer
              rendererRef={rendererRef}
              key={rendererKey}
              schema={activeSchema}
              componentRegistry={ComponentRegistry}
              httpRequest={httpRequest}
              onValidate={isExternalSubmitDemo ? handleDemoCustomValidate : undefined}
              onSubmit={isExternalSubmitDemo ? handleDemoOnSubmit : undefined}
              onAction={(action, context) => {
                console.log('Action executed (Pure UI):', action, context);
              }}
            />
          )}
        </RendererErrorBoundary>
      </div>

      {/* ===== JSON Drawer (overlay) ===== */}
      {showJson && (
        <div
          onClick={() => setShowJson(false)}
          style={{
            position: 'fixed', top: BAR_HEIGHT, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.25)', zIndex: 1001,
          }}
        />
      )}
      <div style={{
        position: 'fixed', top: BAR_HEIGHT, right: 0, bottom: 0,
        width: 'min(520px, 90vw)',
        background: colors.panelBg, zIndex: 1002,
        display: 'flex', flexDirection: 'column',
        boxShadow: showJson ? '-4px 0 24px rgba(0,0,0,0.15)' : 'none',
        transform: showJson ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
      }}>
        {/* Drawer Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: `1px solid ${colors.panelBorder}`,
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>JSON Schema</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleApplyJson} style={btnStyle()}>
              Apply
            </button>
            <button onClick={handleReset} style={btnStyle()}>
              Reset
            </button>
            <button onClick={() => setShowJson(false)} style={{
              ...btnStyle(), border: 'none', fontSize: 16, padding: '0 6px',
            }}>
              ×
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '6px 16px', fontSize: 12, color: colors.error,
            background: isDark ? '#3b1111' : '#fef2f2',
          }}>
            {error}
          </div>
        )}

        {/* Editor */}
        <textarea
          value={editorValue}
          onChange={e => setEditorValue(e.target.value)}
          style={{
            flex: 1, margin: 0, padding: 16,
            fontFamily: 'Consolas, Menlo, Monaco, monospace',
            fontSize: 12, lineHeight: 1.6,
            border: 'none', outline: 'none', resize: 'none',
            background: colors.inputBg, color: colors.text,
          }}
        />
      </div>
    </ConfigProvider>
  );
}

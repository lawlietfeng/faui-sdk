# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Migrated the existing FAUI renderer, components, actions, hooks, documentation, and tooling into `@lawlietfeng/faui-sdk`.
- Retained the SDK lifecycle, path-aware data store, expression engine, and existing unit-test suite.

## [1.0.0] - 2026-05-01

### Added
- **DatePicker disabledDate**: support `before` / `after` constraints for date range validation
- **DatePicker auto fallback**: auto `update_data` when no `on_change` configured
- **Animation system**: framer-motion integration with 6 presets, spring physics, progressive enhancement
- **Responsive grid**: Row + Col with xs/sm/md/lg/xl/xxl breakpoints
- **ECharts chart component**: line, bar, pie, scatter, radar, heatmap
- **Condition & Repeater**: conditional rendering and data iteration components
- **CSS class injection**: `@layer faui` for component default styles
- **Expression engine**: `${expr}` syntax with `$root`, `$current`, `$parent` context variables, security sandbox
- **Component Error Boundary**: graceful error handling per component
- **Statistic countUp animation**: number rolling animation for statistic component
- **Dual-edition architecture**: Form Edition (~47 components) and Full Edition (67+ components)
- **ACTIVITY_DELTA**: JSON Patch incremental updates for high-performance UI updates
- **98 documentation files**: component docs, dev guides, animation system, form guide

### Fixed
- Chart container zero-size initialization failure
- Boolean field required validation in forms
- Animation wrapper width for flex layout support

### Changed
- Upgraded Ant Design to v6, migrated deprecated APIs (`destroyOnHidden`, `variant`)

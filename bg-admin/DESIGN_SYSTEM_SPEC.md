中控后台 / 列表页 设计规范

参考实现：`bg-admin/index.html` 会员列表（member-list-tpl）+ `bg-admin/styles.css`

★ 每次新建后台列表页前必读本文件，严格遵守，不另立样式。

---

一、技术栈

- Vue 3（全局构建版 / no build step）
- Element Plus 2.8+ （`element-plus.css` + `element-plus.full.min.js`）
- 图标：Element Plus Icons（Search / Refresh / Plus / Upload / Operation / RefreshRight / ArrowUp / ArrowDown / WarningFilled 等）
- 共用样式：`bg-admin/styles.css`（绝对路径引用，禁止页面内重复定义样式）

---

二、页面整体结构（必备 3 段）

```html
<div class="page xxx-page">

  <!-- ① 筛选区（可选） -->
  <el-card shadow="never" class="filter-card">
    <el-form :model="filters" label-position="right" label-width="auto" size="default" class="filter-form">
      <!-- 第一行（常驻 3-4 个核心字段） -->
      <el-row :gutter="12" class="filter-row">...</el-row>

      <!-- 展开后的更多行 -->
      <template v-if="expanded">
        <el-row :gutter="12" class="filter-row">...</el-row>
      </template>

      <!-- 操作行 -->
      <div class="filter-actions">
        <div class="quick-filter-wrap">...</div>
        <div class="filter-actions-right">
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
          <el-button type="success" :icon="Download" @click="exportData">导出</el-button>
          <el-button link type="primary" @click="expanded = !expanded">
            {{ expanded ? '收起' : '展开' }}
            <el-icon><ArrowUp v-if="expanded"/><ArrowDown v-else/></el-icon>
          </el-button>
        </div>
      </div>
    </el-form>
  </el-card>

  <!-- ② 表格卡片 -->
  <el-card shadow="never" class="table-card">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <!-- 批量操作按钮组 -->
      </div>
      <div class="toolbar-right">
        <!-- 新增 / 列设置 / 刷新 -->
      </div>
    </div>

    <el-table :data="tableData" border stripe style="width:100%">...</el-table>

    <div class="pagination-bar">
      <el-pagination ... />
    </div>
  </el-card>

  <!-- ③ 弹窗（按需） -->
</div>
```

---

三、设计 Token（颜色 / 尺寸 / 字号）

3.1 颜色系统

| 用途 | 颜色 | 备注 |
|------|------|------|
| 主色 | `#3b82f6` / `#409eff` | 链接、主按钮、聚焦边框 |
| 成功 | `#22c55e` | 正常状态、绿色 Tag |
| 警告 | `#f59e0b` | 警告、维护中 |
| 危险 | `#ef4444` | 禁用、风险、删除 |
| 文本主 | `#1f2937` | 标题、强字段 |
| 文本次 | `#374151` | 表格正文、表单值 |
| 文本辅助 | `#6b7280` | label、副信息 |
| 文本占位 | `#9ca3af` | 二级 label、提示 |
| 占位破折号 | `#d1d5db` | `—` 空数据展示 |
| 背景主 | `#f2f3f5` | 内容区 main 背景 |
| 背景卡片 | `#fff` | el-card 内白底 |
| 边框线 | `#e5e7eb` / `#dcdfe6` | 卡片、表格边框 |
| 分隔线轻 | `#f1f5f9` | filter-actions 顶部分隔 |
| 高亮背景 | `#eff6ff` | 选中态背景 |

3.2 字号 / 行高

| 用途 | 字号 | 行高 |
|------|------|------|
| 页面标题 / 弹窗标题 | 16px / 600 | 1.4 |
| 区块小标题 | 13px / 600 | 1.5 |
| 表单 label | 13px | 32px |
| 表格正文 | 12px | 1.7 |
| Tag / Label-辅助 | 11px | 1.5 |
| 列表链接 | 13px / 500 | 默认 |

3.3 尺寸 / 圆角

| 用途 | 值 |
|------|------|
| 控件高度（input / select / button） | 32px |
| 小按钮高度 | 28px |
| 卡片圆角 | 4px |
| 输入框 / 选择器圆角 | 4px |
| Tag 圆角 | 4px |
| 弹窗圆角 | 6px |
| 卡片间距（gap） | 12px |
| 表单行间距 | 10px |
| 工具栏间距 | 8px |

---

四、筛选区 `.filter-card`

4.1 基本规则

- 必须用 `el-card shadow="never" class="filter-card"` 包裹
- 内部 `el-form` 配置：`label-position="right" label-width="auto" size="default"`
- 每行用 `<el-row :gutter="12" class="filter-row">` 排版
- 每个字段用 `<el-col :span="...">` 控制宽度，4 字段一行用 `:span="6"`、3 字段一行用 `:span="8"`、混合按需

4.2 字段类型与控件选择

| 字段类型 | 控件 | 写法 |
|---------|------|------|
| 单行文本 | `el-input` | `<el-input v-model="filters.x" placeholder="..." clearable />` |
| 单选下拉（< 10 项） | 原生 `<select class="f-sel">` | 性能好、自带样式 |
| 单选下拉（> 10 项 / 远端搜索） | `el-select` | 自动应用 filter-form select 边框样式 |
| 日期范围 | `el-date-picker type="datetimerange"` | `range-separator="→"`，`value-format="YYYY-MM-DD HH:mm:ss"` |
| 数字范围 | 两个 `el-input-number` 或 `el-input` 拼起止 | label 标记起止 |
| 多选 | `el-select multiple` 或 `el-checkbox-group` | |

4.3 原生 `<select class="f-sel">` 写法（推荐用于固定枚举）

```html
<select v-model="filters.status" class="f-sel">
  <option value="">全部</option>
  <option value="enabled">启用</option>
  <option value="disabled">禁用</option>
</select>
```

样式由 `.f-sel` 类定义，高度 32px，含 SVG 下拉箭头，自带 hover / focus。

4.4 展开 / 收起

- 字段超过 4 个时强制提供「展开 / 收起」
- 常驻显示前 1 行（3-4 个最常用字段 + 操作行）
- 展开后追加多行字段
- 切换按钮文案：「展开 ▼」/「收起 ▲」，置于操作行最右侧
- 收起后保留已填值，不重置

4.5 操作行 `.filter-actions`

布局：左快速筛选 + 右操作按钮组，顶部一条 `1px #f1f5f9` 分隔线。

```html
<div class="filter-actions">
  <!-- 左：快速筛选（可选） -->
  <div class="quick-filter-wrap">
    <span class="quick-filter-label">快速筛选</span>
    <el-checkbox-group v-model="filters.quick" class="quick-filter-group">
      <el-checkbox-button value="a">A</el-checkbox-button>
      <el-checkbox-button value="b">B</el-checkbox-button>
    </el-checkbox-group>
  </div>
  <!-- 右：模糊查询 / 查询 / 重置 / 导出 / 展开 -->
  <div class="filter-actions-right">
    <el-checkbox v-model="filters.fuzzy">模糊查询</el-checkbox>
    <el-button type="primary" :icon="Search" @click="search">查询</el-button>
    <el-button :icon="Refresh" @click="reset">重置</el-button>
    <el-button type="success" :icon="Download" @click="exportData">导出</el-button>
    <el-button link type="primary" @click="expanded = !expanded">
      {{ expanded ? '收起' : '展开' }}
      <el-icon><ArrowUp v-if="expanded"/><ArrowDown v-else/></el-icon>
    </el-button>
  </div>
</div>
```

---

五、表格区 `.table-card`

5.1 工具栏 `.table-toolbar`

- 左侧 `.toolbar-left`：批量操作 / 整体配置按钮（plain 样式 + 下拉菜单分组）
- 右侧 `.toolbar-right`：**新增**（type=primary）/ 视图切换组 / 导入 / **列设置（circle 圆形）** / **刷新（circle 圆形）**

★ 强约束：
- **「新增」按钮统一放在工具栏右侧**，作为主操作占据右上角，便于运营固定记忆位置
- **不要使用「刷新缓存」按钮**，缓存刷新走系统级管理或后端自动失效；右侧 circle「刷新」按钮已能覆盖列表数据刷新

5.2 批量按钮规范

- 主操作（启用 / 删除）用 `plain` + `type="success/danger"`
- 多操作合并用 `el-dropdown` + `plain` 按钮，按钮内右侧加 `<span class="btn-arrow">▾</span>`
- 风险类（删除、风险标记）按钮强制 `type="danger"` 或 `type="warning"`，且配合二次确认弹窗

```html
<el-button type="success" plain @click="...">批量启用</el-button>
<el-button type="danger" plain @click="...">批量禁用</el-button>
<el-dropdown>
  <el-button plain>更多操作<span class="btn-arrow">▾</span></el-button>
  <template #dropdown>
    <el-dropdown-menu>
      <el-dropdown-item>...</el-dropdown-item>
      <el-dropdown-item divided>...</el-dropdown-item>
    </el-dropdown-menu>
  </template>
</el-dropdown>
```

5.3 表格属性

- 必带 `border stripe style="width:100%"`
- 第一列固定 42px 多选框（含表头全选 + 半选态）
- 字段列用 `v-for` 循环 `visibleColumns`（支持列设置控制显隐）
- `:min-width="col.width"` 替代 `:width`，自适应可伸缩
- `:align="col.align || 'left'"` + `:header-align`，金额数字列右对齐 `align: 'right'`
- `:show-overflow-tooltip="true"` 长文本自动 tooltip 截断
- 最后一列「操作」固定 140-170px，用 `width` 锁死

5.4 多行单元格 `.multi-cell`

复杂字段使用 label + value 多行展示：

```html
<div class="multi-cell">
  <div class="mc-row"><span class="mc-label">ID：</span><span class="mc-val">12345</span></div>
  <div class="mc-row"><span class="mc-label">账号：</span><span class="mc-val mc-sub">player001</span></div>
</div>
```

- `.mc-label`：11px / `#9ca3af` / nowrap
- `.mc-val`：12px / `#374151` / 主值
- `.mc-sub`：12px / `#6b7280` / 副值（如时间）

5.5 状态 Tag

```html
<el-tag size="small" :type="...">启用</el-tag>      <!-- 默认填充 -->
<el-tag size="small" effect="plain" :type="...">维护中</el-tag>  <!-- plain 浅色 -->
<el-tag size="small" effect="dark" type="danger">风险</el-tag>   <!-- dark 强调 -->
```

| type 值 | 颜色 | 适用 |
|---------|------|------|
| success | 绿 | 启用、正常、已结算 |
| info | 灰 | 离线、未读、未处理 |
| warning | 黄 | 维护中、待处理 |
| danger | 红 | 禁用、风险、失败 |
| primary | 蓝 | 默认强调 |

5.6 操作列 `.op-cell`

★ **强约束：操作按钮数量阈值**
- 操作总数 **≤ 3 个**：**全部直接展示**，不要用「更多 ▼」下拉
- 操作总数 **≥ 4 个**：保留前 1-2 个高频主操作直接展示，其余收到「更多 ▼」下拉里
- 全用 `link` 文字按钮 + `size="small"`
- 危险操作（删除）展示在最后，颜色 `type="danger"`

≤ 3 个操作写法（直接展示，无下拉）：

```html
<el-table-column label="操作" width="160" fixed="right" align="center">
  <template #default="{ row }">
    <div class="op-cell">
      <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
      <el-button link type="primary" size="small" @click="openConfig(row)">配置</el-button>
      <el-button link type="danger"  size="small" @click="doDelete(row)">删除</el-button>
    </div>
  </template>
</el-table-column>
```

≥ 4 个操作写法（带下拉）：

```html
<el-table-column label="操作" width="170" fixed="right" align="center">
  <template #default="{ row }">
    <div class="op-cell">
      <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
      <el-dropdown>
        <el-button link type="primary" size="small">
          更多<el-icon><ArrowDown/></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="action1">操作 1</el-dropdown-item>
            <el-dropdown-item @click="action2">操作 2</el-dropdown-item>
            <el-dropdown-item divided @click="doDelete(row)" style="color:#ef4444">删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </template>
</el-table-column>
```

5.7 占位

- 空数据用 `<span class="cell-dash">—</span>`
- 不要用 `null` / `'-'` / `'暂无'`

---

六、列设置组件

```html
<el-popover placement="bottom-end" :width="260" trigger="click">
  <template #reference>
    <el-button :icon="Operation" circle title="列设置" />
  </template>
  <div class="col-setting">
    <div class="col-setting-header">
      <el-checkbox :model-value="allColsVisible" :indeterminate="someColsVisible" @change="toggleAllCols">全选</el-checkbox>
    </div>
    <el-scrollbar max-height="360px">
      <el-checkbox v-for="col in columnOptions" :key="col.prop"
        v-model="col.visible" :disabled="col.required">{{ col.label }}</el-checkbox>
    </el-scrollbar>
  </div>
</el-popover>
```

- 表格列数 ≥ 8 必须提供列设置
- 主键 ID、操作列设为 `required: true`，不可关闭

---

七、分页 `.pagination-bar`

```html
<div class="pagination-bar">
  <el-pagination
    v-model:current-page="pagination.page"
    v-model:page-size="pagination.size"
    :total="pagination.total"
    :page-sizes="[10, 20, 50, 100]"
    layout="total, sizes, prev, pager, next, jumper"
    background
  />
</div>
```

- **统一 page-sizes：`[10, 20, 50, 100]`**
- 默认 20/页（线上后台默认 10 太碎）
- 右对齐布局，layout 包含 total / sizes / prev / pager / next / jumper

---

八、弹窗

8.1 通用弹窗

```html
<el-dialog v-model="dialog.visible" title="..." width="460px"
  align-center :close-on-click-modal="false">
  <el-form class="dlg-form" label-width="80px" label-position="right">
    <el-form-item label="..." required>...</el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="dialog.visible = false">取消</el-button>
    <el-button type="primary" @click="submit">确定</el-button>
  </template>
</el-dialog>
```

- 普通表单宽度 460px
- 复杂表单宽度 680px / 800px
- 大型配置（如游戏限制矩阵）宽度 1100px+
- 必须 `align-center` + `close-on-click-modal=false`（防误关）
- 表单 label-width 80px（中文 4-5 字）
- 按钮顺序：左「取消」（默认）/ 右「确定」（primary）

8.2 二次确认弹窗（破坏性操作必带）

```html
<el-dialog v-model="confirmDialog.visible" :title="confirmDialog.title" width="460px" align-center :close-on-click-modal="false">
  <el-form class="dlg-form" label-width="80px" label-position="right">
    <el-form-item label="影响对象">
      <el-input type="textarea" :rows="3" :model-value="selectionAccounts" disabled />
    </el-form-item>
  </el-form>
  <div class="confirm-body">
    <el-icon class="confirm-icon"><WarningFilled /></el-icon>
    <span class="confirm-msg">{{ confirmDialog.message }}</span>
  </div>
  <template #footer>
    <el-button @click="confirmDialog.visible = false">取消</el-button>
    <el-button type="primary" @click="doConfirm">确定</el-button>
  </template>
</el-dialog>
```

强制触发场景：删除、禁用、批量回收、全部打开/关闭、手动处理失败交易。

---

九、按钮规范

| 用途 | 写法 | 颜色 |
|------|------|------|
| 主操作（查询、确定、新增、提交） | `<el-button type="primary" :icon="...">` | 蓝 |
| 次操作（重置、取消） | `<el-button :icon="Refresh">` | 灰 |
| 成功（导出、启用、批量启用） | `<el-button type="success" :icon="Download">` | 绿 |
| 警告（风险管理） | `<el-button type="warning" plain>` | 黄 |
| 危险（删除、禁用） | `<el-button type="danger" plain>` | 红 |
| 文字按钮（表格内操作） | `<el-button link type="primary" size="small">` | 蓝 |
| 圆形图标按钮（列设置、刷新） | `<el-button :icon="..." circle title="..." />` | 灰 |
| 下拉合并 | `<el-button plain>X<span class="btn-arrow">▾</span></el-button>` | 灰底 |

★ 注意：
- 批量操作按钮一律 `plain`，不要用实色
- 圆形按钮必须有 `title` 属性提供 tooltip
- 危险操作按钮 + 二次确认弹窗 双重保护

---

九·补、输入控件对齐规范

9·补.0 说明类信息一律用 info icon + tooltip，禁止加横幅/提示带

★ 强约束：**禁止在原型上加任何"原型示例 / 只读模式提示 / mock 数据警告"之类的横幅、提示带、模式指示器。** 开发看到这些 UI 会以为是正式需要实现的页面元素。

PM 想要补充字段含义、数据源说明、交互注意点时，**只能用以下两种方式：**

1. **info icon + el-tooltip**（页面内最常用）
```html
<el-form-item>
  <template #label>
    字段名
    <el-tooltip content="字段含义、数据源、注意事项的简短说明" placement="top">
      <el-icon style="color:#9ca3af;cursor:help;font-size:13px;vertical-align:middle;">
        <InfoFilled />
      </el-icon>
    </el-tooltip>
  </template>
  <el-input v-model="..." />
</el-form-item>
```

2. **PRD / spec 文档**（设计意图、数据源、边界处理这些"开发要知道但用户不必看到"的内容）

❌ 禁止的反例：
- 顶部加橙色 banner "原型示例数据：xxx 由后台动态读取"
- 灰色虚线带 "🔒 当前为只读模式，点击右下角编辑可修改"
- 内嵌一段红色小字解释字段背景

这些东西**全部移到 PRD 文档或 tooltip 里**。原型只展示真实交互的 UI 元素。

---

9·补.1 placeholder 与输入内容统一左对齐

★ 强约束：所有输入类控件，placeholder 与已输入内容一律 **左对齐**。便于扫读、对齐 label，符合中文界面阅读习惯。

适用控件：
- `<el-input>` —— 默认左对齐（无需处理）
- `<el-input-number>` —— Element Plus 默认 `text-align: center`，**必须用 styles.css 全局覆盖为 left**
- `<el-input type="textarea">` —— 默认左上对齐
- `<el-select>` —— 默认左对齐
- `<el-date-picker>` —— 默认左对齐

styles.css 已有全局覆盖：
```css
.el-input-number .el-input__inner { text-align: left; }
```

❌ 禁止在单个组件上反向覆盖为居中或右对齐（金额表格列右对齐是表格层逻辑，与输入控件无关）。

---

十、KPI 统计区（订单类页面必备）

替代「红色纯文字 投注金额: 0」的旧样式，新规范：

```html
<div class="kpi-cards">
  <div class="kpi-card">
    <div class="kpi-label">投注金额</div>
    <div class="kpi-value">¥ 65,501</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">有效投注</div>
    <div class="kpi-value">¥ 65,600.52</div>
  </div>
  <!-- ... -->
</div>
```

样式（需补充到 styles.css）：
```css
.kpi-cards { display: flex; gap: 12px; margin-bottom: 12px; }
.kpi-card {
  flex: 1; padding: 12px 16px; background: #fff;
  border: 1px solid #e5e7eb; border-radius: 6px;
  display: flex; flex-direction: column; gap: 4px;
}
.kpi-label { font-size: 12px; color: #6b7280; }
.kpi-value { font-size: 18px; font-weight: 600; color: #1f2937; }
.kpi-value.neg { color: #ef4444; }
.kpi-value.pos { color: #22c55e; }
```

---

十一、模板代码骨架

每个新页面参照如下骨架开发：

```html
<!-- xxx-page-tpl -->
<template id="xxx-page-tpl">
<div class="page xxx-page">

  <!-- ① 筛选 -->
  <el-card shadow="never" class="filter-card">
    <el-form :model="filters" label-position="right" label-width="auto" size="default" class="filter-form">
      <el-row :gutter="12" class="filter-row">
        <!-- 常驻字段 -->
      </el-row>
      <template v-if="expanded">
        <!-- 更多字段 -->
      </template>
      <div class="filter-actions">
        <div></div>
        <div class="filter-actions-right">
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
          <el-button type="success" :icon="Download" @click="exportData">导出</el-button>
          <el-button link type="primary" @click="expanded = !expanded">
            {{ expanded ? '收起' : '展开' }}
          </el-button>
        </div>
      </div>
    </el-form>
  </el-card>

  <!-- ②（可选）KPI -->
  <div class="kpi-cards">...</div>

  <!-- ③ 表格 -->
  <el-card shadow="never" class="table-card">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增</el-button>
      </div>
      <div class="toolbar-right">
        <el-popover ...><!-- 列设置 --></el-popover>
        <el-button :icon="RefreshRight" circle @click="search" title="刷新" />
      </div>
    </div>

    <el-table :data="tableData" border stripe style="width:100%">
      <el-table-column type="selection" width="42" align="center" />
      <el-table-column v-for="col in visibleColumns" :key="col.prop"
        :prop="col.prop" :label="col.label"
        :min-width="col.width"
        :align="col.align || 'left'"
        :show-overflow-tooltip="col.tooltip !== false">
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <div class="op-cell">
            <el-button link type="primary" size="small">编辑</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>
  </el-card>

</div>
</template>
```

---

十二、严禁事项

- ❌ 不要使用页面内 `<style>` 定义全局样式，所有公共样式归并到 `styles.css`
- ❌ 不要重复定义 `.filter-card` / `.table-card` / `.filter-actions` 等已有类
- ❌ 不要用 `<button>` 原生标签，必须用 `<el-button>`
- ❌ 不要用 `<table>` 原生标签，必须用 `<el-table>`
- ❌ 不要在表格内嵌大段文字按钮，要收到「更多 ▼」下拉里
- ❌ 不要用红色纯文字展示统计数据，必须用 KPI 卡片
- ❌ 不要省略破坏性操作的二次确认弹窗
- ❌ 不要将列数 ≥ 8 的表格不带列设置
- ❌ 不要在 `el-input` 上挂自定义 CSS class 覆盖输入框高度（已统一 32px）
- ❌ 不要在筛选区超过 4 字段不提供「展开 / 收起」
- ❌ 不要把「新增」按钮放在 `.toolbar-left`，必须放在 `.toolbar-right` 第一位
- ❌ 不要保留任何「刷新缓存」按钮（旧后台遗留，已废弃）
- ❌ 操作列不要在「≤ 3 个操作」时仍然使用「更多 ▼」下拉，必须直接平铺展示
- ❌ 不要在原型里加 "原型示例 / mock 数据 / 只读模式" 之类的横幅或提示带（详见 §9·补.0），开发会误以为是需要实现的 UI 元素；说明信息一律用 info icon + tooltip 或放进 PRD 文档

---

十三、新建页面检查清单

- [ ] 引入 `styles.css`
- [ ] 顶层 div：`class="page xxx-page"`
- [ ] 筛选区用 `.filter-card`，操作行符合规范
- [ ] 筛选字段 > 4 个 → 必带展开/收起
- [ ] KPI 数据 → 必用卡片（如适用）
- [ ] 表格 ≥ 8 列 → 必带列设置
- [ ] 分页 `[10, 20, 50, 100]`，默认 20
- [ ] 破坏性操作 → 必带二次确认
- [ ] 操作列固定右侧 + 多按钮收纳到「更多 ▼」
- [ ] 颜色 / 字号 / 圆角 全部使用本规范

---

十四、嵌入式子页面（iframe 子页）★ 新增

有些页面以独立 HTML 存在、通过 iframe 嵌入主后台（参考本工程 `index.html` 的 `activity-claim`「领取与审核」、`ops-message`「消息管理」、`ops-feedback`「用户反馈」）。**这类子页同样是后台的一部分，必须 100% 遵循本规范**，绝不允许手写原生样式糊弄。

14.1 铁律

- ❌ **严禁手写原生 `<button>` / `<table>` / 自造 Element 仿样式**（class 名还会和 `element-plus.css` 撞）。一旦发现就是 bug。
- ✅ 子页必须引入与主后台**完全相同的两份样式**：`./element-plus.css` + `./styles.css`，并用**真 Element Plus 组件**（`el-card` / `el-form` / `el-table` / `el-button` / `el-pagination` / `el-dialog` / `el-tag`…）。
- ✅ 筛选区、表格、操作列、列设置、导出、分页、弹窗、二次确认 **全部按 §2 ～ §13 来**：`查询(primary+Search)` / `重置(Refresh)` / `导出(success+Download)`；工具栏右侧 `新增(primary+Plus)` / `列设置(Operation circle popover)` / `刷新(RefreshRight circle)`；`el-table border stripe`；`op-cell` 文字按钮 + 「更多 ▼」下拉；分页 `[10,20,50,100]`；破坏性操作走 `ElMessageBox.confirm` 二次确认。
- ✅ 子页是**纯内容页**：不带自己的侧栏 / 顶栏 / 面包屑（外壳由 `index.html` 统一提供），顶层用 `<div class="page xxx-page">`。

14.2 集成到主后台（与现有写法一致）

1. `index.html` 侧栏 `el-menu` 加 `el-menu-item index="xxx"`。
2. `app.js` 的 `menuLabel` 加 `'xxx': '菜单名'`（否则 `onMenuSelect` 直接 return、开不了 tab）。
3. `index.html` 视图链按 `activeTab` 加一行 iframe（与 `activity-claim` 同写法）：
```html
<template v-else-if="activeTab === 'xxx'">
  <iframe src="xxx.html" style="width:100%;height:calc(100vh - 110px);border:none;display:block;"></iframe>
</template>
```

14.3 独立子页骨架（直接套用）

```html
<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>页面名</title>
<link rel="stylesheet" href="./element-plus.css">
<link rel="stylesheet" href="./styles.css">
<style> body{background:#f0f2f5;margin:0;} #app{padding:16px;} [v-cloak]{display:none;} </style>
</head><body>
<div id="app" v-cloak>
  <div class="page xxx-page">
    <!-- filter-card / table-card / dialogs，照 §2 骨架 -->
  </div>
</div>
<script src="https://unpkg.com/vue@3.5.13/dist/vue.global.js"></script>
<script src="https://unpkg.com/element-plus@2.8.8/dist/index.full.js"></script>
<script src="https://unpkg.com/@element-plus/icons-vue@2.3.1"></script>
<script>
const { createApp, ref, reactive, computed } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
const app = createApp({ setup(){ const icons = ElementPlusIconsVue;
  /* filters / columnOptions / visibleColumns / pagination / search / reset / exportData … 同 member-list 范式 */
  return { /* …, */ Search:icons.Search, Refresh:icons.Refresh, Download:icons.Download, Operation:icons.Operation, RefreshRight:icons.RefreshRight, Plus:icons.Plus }; }});
for (const [k,c] of Object.entries(ElementPlusIconsVue)) app.component(k,c);  // 全局注册图标
app.use(ElementPlus);
app.mount('#app');
</script>
</body></html>
```

14.4 版本台账，CDN 版本与主后台对齐：Vue `3.5.13`、Element Plus `2.8.8`、icons `2.3.1`（与 `index.html` 保持一致，避免风格漂移）。

---

十五、页面 Tab / 子 Tab 规范 ★ 新增（全局统一）

后台有三类 Tab，务必分清、不要混用：

15.1 顶部多标签（框架级 · 浏览器式可关闭）

- 由 `index.html` 框架统一渲染：`<el-tabs type="card" closable>`（`.tabs-bar`）。
- **页面自己不要再造这一层**；点侧栏菜单 → `onMenuSelect` 自动开 tab。

15.2 页面级子 Tab（同一页切换平级列表 / 视图）★ 全局标准

适用：同一页里切换平级的列表 / 视图，例如 活动消息/系统消息/公告、VIP变更记录/奖金领取记录、自动层级/固定层级、活动列表/已关闭/优惠统计。

★ **统一用下划线 span Tab：`.qs-status-bar` + `.qs-status-tab`；禁止用默认 `<el-tabs>`**（默认 el-tabs 的基线、间距、字号与全站不一致，会产生割裂感——这正是「消息管理」之前的问题）。

标准 markup：
```html
<div class="qs-status-bar">
  <span class="qs-status-tab" :class="{ active: tab === 'a' }" @click="tab = 'a'">列表A</span>
  <span class="qs-status-tab" :class="{ active: tab === 'b' }" @click="tab = 'b'">列表B</span>
  <!-- 可选计数徽标 -->
  <span class="qs-status-tab" :class="{ active: tab === 'c' }" @click="tab = 'c'">列表C<span class="qs-status-badge">12</span></span>
</div>
```
样式由 `styles.css` 提供（勿重复定义）：13px；未选 `#6b7280`，选中 `#409eff` + 2px 下划线 + 字重 500；底部 1px 基线；白底；顶部圆角。

两种布局变体（二选一）：
- **独立式**（如 层级管理，**默认用这种**）：`.qs-status-bar` 单独一条，下方卡片正常间距。
- **连体式**（如 活动列表）：`.qs-status-bar` 加 `style="margin-bottom:0"`，紧随的 `el-card` 加 `style="border-radius:0 0 6px 6px;border-top:none;"`，让 Tab 与卡片拼成一个整体。注意用 `.page`（flex `gap:12px`）包裹时，连体式需再包一层无间距容器，否则会被 gap 拉开；嫌麻烦就用独立式。

15.3 弹窗内子 Tab

- 弹窗里的小 Tab（多语言 en/hi、会员详情 信息/财务/投注 等）可用既有自定义 span（`.lang-tab`、`.md-tab-item`…），视觉与 `.qs-status-tab` 保持一致即可。

15.4 历史遗留

- `.rd-tab-bar` / `.rd-tab`（VIP操作日志在用）是早期近似变体（14px、8px 圆角），同属下划线 Tab。**新页面一律用 `.qs-status-tab`**；旧页面可暂留，逐步收敛到 `.qs-status-tab`。

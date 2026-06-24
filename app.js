const { createApp, ref, reactive, computed, onMounted, onUnmounted, defineComponent, h } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

/* ========== 共享：佣金调整记录（代理列表「佣金修正」→ 佣金记录「佣金调整」Tab）========== */
const commissionAdjustRecords = reactive([
  { agentId:'140693891584', account:'u1htbokp34', type:'增加', amount:'50.00',  reason:'活动补偿：3 月排行榜结算遗漏', operator:'admin',     time:'2025-04-01 11:20:33' },
  { agentId:'144903381720', account:'uagt9xk221', type:'扣除', amount:'120.00', reason:'违规刷单，回收异常佣金',       operator:'michael',   time:'2025-03-28 16:42:07' },
]);

/* ========== 会员列表组件 ========== */
const MemberList = defineComponent({
  name: 'MemberList',
  template: '#member-list-tpl',
  setup() {
    const expanded = ref(false);

    const defaultFilters = () => ({
      searchType: 'memberIdOrAccount',
      searchValue: '',
      currency: 'INR',
      memberType: '',
      registerTime: [todayStart(), todayEnd()],
      bankCard: '', email: '',
      accountStatus: '', gameStatus: '', withdrawStatus: '', rebateStatus: '',
      depositStatus: '', hasRecharge: '', verified: '', onlineStatus: '',
      channel: '', channelName: '', registerSource: '', registerMethod: '',
      registerDevice: '', deviceSource: '', registerIp: '', loginIp: '',
      vipLevel: '', layer: '', hasParent: '', hasChild: '',
      rebatePlan: '', tags: [], balanceOrder: '', vaultOrder: '',
      firstDepositTime: [], onlineTime: [],
      risk: '', riskFree: '',
      remark: '',
      fuzzy: false,
      quickFilters: [],
    });

    const searchTypeMeta = {
      memberIdOrAccount: { label: '会员ID/账号', placeholder: '支持ID或账号模糊查询' },
      agentId:    { label: '代理ID',   placeholder: '请输入代理ID' },
      parentId:   { label: '上级ID',   placeholder: '请输入上级ID' },
      realName:   { label: '真实姓名', placeholder: '支持模糊查询' },
      phone:      { label: '手机号码', placeholder: '请输入手机号码' },
      bankCard:   { label: '银行卡号', placeholder: '请输入银行卡号' },
      email:      { label: '电子邮箱', placeholder: '请输入邮箱地址' },
      inviteCode: { label: '邀请码',   placeholder: '请输入邀请码' },
      registerIp: { label: '注册IP',   placeholder: '请输入注册IP' },
      loginIp:    { label: '登录IP',   placeholder: '请输入登录IP' },
    };
    const searchTypeLabel = computed(() =>
      searchTypeMeta[filters.searchType]?.label || '搜索'
    );
    const searchPlaceholder = computed(() =>
      searchTypeMeta[filters.searchType]?.placeholder || '请输入'
    );

    const filters = reactive(defaultFilters());

    /* 列定义 */
    const columnOptions = reactive([
      // ── 固定左侧 ──────────────────────────────────────────
      { prop: 'memberInfo',    label: '会员信息',    width: 190, visible: true,  required: true, slot: true, tooltip: false },
      // ── 默认显示 ──────────────────────────────────────────
      { prop: 'accountStatus', label: '账号状态',   width: 90,  visible: true,  slot: true },
      { prop: 'currency',      label: '币种',        width: 75,  visible: true },
      { prop: 'onlineStatus',  label: '在线',        width: 75,  visible: true,  slot: true },
      { prop: 'layer',         label: '层级',        width: 100, visible: true },
      { prop: 'vipLevel',      label: 'VIP',         width: 75,  visible: true },
      { prop: 'channel',       label: '渠道',        width: 200, visible: true,  slot: true, tooltip: false },
      { prop: 'balance',       label: '余额',        width: 120, visible: true, align: 'right' },
      { prop: 'vaultBalance',  label: '保险箱余额',  width: 120, visible: true, align: 'right' },
      // ── 默认隐藏 ──────────────────────────────────────────
      { prop: 'permissions',   label: '权限',        width: 175, visible: true, slot: true, tooltip: false },
      { prop: 'tags',          label: '会员标签',    width: 160, visible: true, slot: true, tooltip: false },
      { prop: 'hasRecharge',   label: '是否充值',    width: 90,  visible: true, slot: true },
      { prop: 'inviteCode',    label: '邀请码',      width: 130, visible: true },
      { prop: 'parentInfo',    label: '直属上级',    width: 160, visible: true, slot: true, tooltip: false },
      { prop: 'topParentInfo', label: '顶层上级',    width: 160, visible: true, slot: true, tooltip: false },
      { prop: 'totalDeposit',  label: '总入款/次数', width: 130, visible: true, align: 'right' },
      { prop: 'totalWithdraw', label: '总出款/次数', width: 130, visible: true, align: 'right' },
      { prop: 'venueBalance',  label: '场馆总余额',  width: 120, visible: true, align: 'right' },
      { prop: 'rebatePlan',    label: '返奖策略',    width: 120, visible: true },
      { prop: 'registerDevice',label: '注册设备',    width: 100, visible: true },
      { prop: 'registerTime',  label: '注册',        width: 165, visible: true,  slot: true, tooltip: false },
      { prop: 'lastLoginTime', label: '登录',        width: 165, visible: true,  slot: true, tooltip: false },
      { prop: 'remark',        label: '备注',        width: 160, visible: true },
    ]);

    const visibleColumns = computed(() => columnOptions.filter(c => c.visible));
    const allColsVisible = computed(() => columnOptions.every(c => c.visible));
    const someColsVisible = computed(() =>
      columnOptions.some(c => c.visible) && !allColsVisible.value
    );
    const toggleAllCols = (val) => {
      columnOptions.forEach(c => { if (!c.required) c.visible = val; });
    };

    /* Mock 数据 */
    const tableData = ref(mockRows(10));
    const pagination = reactive({ page: 1, size: 10, total: 1 });
    const tableRef = ref(null);
    const selection = ref([]);
    const allSelected = computed(() => tableData.value.length > 0 && selection.value.length === tableData.value.length);
    const someSelected = computed(() => selection.value.length > 0 && !allSelected.value);
    const toggleSelectAll = (val) => { selection.value = val ? [...tableData.value] : []; };
    const toggleRow = (row) => {
      const idx = selection.value.indexOf(row);
      if (idx === -1) selection.value.push(row);
      else selection.value.splice(idx, 1);
    };


    /* ── 已选会员账号（置灰显示用） ── */
    const selectionAccounts = computed(() =>
      selection.value.length
        ? selection.value.map(r => r.account).join('\n')
        : '（未选择会员）'
    );

    /* ── 重置密码弹窗 ── */
    const resetPwdDialog = reactive({ visible: false, account: '', password: '' });
    const openResetPwd = (row) => {
      resetPwdDialog.account  = row.account;
      resetPwdDialog.password = '';
      resetPwdDialog.visible  = true;
    };
    const submitResetPwd = () => {
      if (!resetPwdDialog.password) return ElMessage.warning('请输入新密码');
      resetPwdDialog.visible = false;
      ElMessage.success('密码重置成功');
    };

    /* ── 批量操作前置校验 ── */
    const checkSelection = () => {
      if (!selection.value.length) {
        ElMessage.warning('请先勾选需要操作的会员');
        return false;
      }
      return true;
    };

    /* ── 通用确认弹窗 ── */
    const confirmDialog = reactive({ visible: false, title: '', message: '', withRemark: false, remark: '' });
    const openConfirm = (title, message, opts = {}) => {
      if (!checkSelection()) return;
      confirmDialog.title      = title;
      confirmDialog.message    = message;
      confirmDialog.withRemark = !!opts.withRemark;
      confirmDialog.remark     = '';
      confirmDialog.visible    = true;
    };
    const doConfirm = () => {
      confirmDialog.visible = false;
      ElMessage.success('操作成功');
    };

    /* ── 批量备注弹窗 ── */
    const batchRemarkDialog = reactive({ visible: false, remark: '' });
    const openBatchRemark = () => { if (!checkSelection()) return; batchRemarkDialog.remark = ''; batchRemarkDialog.visible = true; };
    const submitBatchRemark = () => { batchRemarkDialog.visible = false; ElMessage.success('备注已更新'); };

    /* ── 批量返奖策略弹窗 ── */
    const batchRebatePlanDialog = reactive({ visible: false, plan: '' });
    const openBatchRebatePlan = () => { if (!checkSelection()) return; batchRebatePlanDialog.plan = ''; batchRebatePlanDialog.visible = true; };
    const submitBatchRebatePlan = () => { batchRebatePlanDialog.visible = false; ElMessage.success('返奖策略已修改'); };

    /* ── 批量会员标签弹窗 ── */
    const batchTagsDialog = reactive({ visible: false, tags: [], remark: '' });
    const openBatchTags = () => { if (!checkSelection()) return; batchTagsDialog.tags = []; batchTagsDialog.remark = ''; batchTagsDialog.visible = true; };
    const submitBatchTags = () => { batchTagsDialog.visible = false; ElMessage.success('会员标签已更新'); };

    /* ── 新增会员弹窗 ── */
    const newMemberRow = () => ({ type: 'phone', account: '', password: '', inviteCode: '', remark: '' });
    const addMemberDialog = reactive({ visible: false, channel: '', rows: [newMemberRow()] });
    const openAddMember = () => {
      addMemberDialog.channel = '';
      addMemberDialog.rows    = [newMemberRow()];
      addMemberDialog.visible = true;
    };
    const addMemberRow    = () => { addMemberDialog.rows.push(newMemberRow()); };
    const removeMemberRow = (idx) => { addMemberDialog.rows.splice(idx, 1); };
    const submitAddMember = () => {
      addMemberDialog.visible = false;
      ElMessage.success('会员添加成功');
    };

    const copyText = (text) => {
      navigator.clipboard.writeText(String(text))
        .then(() => ElMessage.success('已复制'))
        .catch(() => ElMessage.error('复制失败'));
    };

    const search = () => {
      pagination.total = tableData.value.length;
      ElMessage.success('查询完成');
    };
    const reset = () => {
      Object.assign(filters, defaultFilters());
      ElMessage.info('已重置筛选条件');
    };
    const exportData = () => ElMessage.success('已提交导出任务，可在「任务列表」查看');

    /* ── 会员详情弹窗 ── */
    const memberDetail = reactive({ visible: false, activeTab: 'info', timeRange: [], data: {} });

    // 财务概览 → 充提明细（纯财务数据）
    const activityDeposit = [
      { label: '人工充值',           val: 0 },        { label: '人工提款',     val: 0 },
      { label: '彩金充值',           val: 0 },        { label: '彩金扣除',     val: 0 },
      { label: '累计充值',           val: '2000/1' }, { label: '累计提现',     val: '0/0' },
      { label: '充提差',             val: 2000 },     { label: '待出款金额',   val: 0 },
      { label: '充值',               val: 2000 },     { label: '提现',         val: 0 },
      { label: '出款失败，退回账号', val: 0 },
    ];
    // 活动奖励 → 全部活动类奖励（原活动奖励 + 原充值/提现列活动类 + 原VIP列活动类）
    const activityBonus = [
      // ── 原活动奖励列 ──────────────────────────────
      { label: '签到奖励',           val: 0 },   { label: '礼包兑换',           val: 0 },
      { label: '首充赠送',           val: 112 }, { label: '注册赠送',           val: 0 },
      { label: '活动充值赠送',       val: 0 },   { label: '爆大奖',             val: 0 },
      { label: '邀请宝箱',           val: 0 },   { label: '轮盘奖励',           val: 0 },
      { label: '累充充值奖励',       val: 0 },   { label: '累计次数奖励',       val: 0 },
      { label: 'Rupeelink出款奖励',  val: 0 },   { label: '打码返利',           val: 0 },
      { label: '日任务奖励',         val: 0 },   { label: '周任务奖励',         val: 0 },
      { label: '裂变轮盘奖金',       val: 0 },   { label: '裂变轮盘签到奖励',   val: 0 },
      { label: '维护彩金',           val: 0 },   { label: 'wingo连赢活动',      val: 0 },
      { label: '周卡奖励',           val: 0 },   { label: '局数奖励',           val: 0 },
      { label: '充值卡赠送',         val: 0 },   { label: '首充返利',           val: 0 },
      { label: '游戏日任务',         val: 0 },   { label: '月榜奖励',           val: 0 },
      { label: 'bgcash首充奖励',     val: 0 },   { label: '被邀请人奖励',       val: 0 },
      { label: '飞艇注册活动奖励',   val: 0 },   { label: '周任务邀请送',       val: 0 },
      { label: '多阶段轮盘奖励',     val: 0 },   { label: '充值延迟到账奖励',   val: 0 },
      { label: '回归冻结奖励',       val: 0 },   { label: '任务宝箱活动',       val: 0 },
      // ── 原充值/提现列 → 活动类 ───────────────────
      { label: '手续费返利',         val: 0 },   { label: '充值彩金',           val: 0 },
      { label: '观看视频',           val: 0 },   { label: '每日首充赠送',       val: 0 },
      { label: '周救援金',           val: 0 },   { label: 'PWA奖金',            val: 0 },
      { label: '购买周卡',           val: 0 },   { label: '周卡首次奖励',       val: 0 },
      { label: '触发充值奖励',       val: 0 },   { label: '返水活动奖励',       val: 0 },
      { label: '投注抽奖',           val: 0 },   { label: '召回彩金',           val: 0 },
      { label: '日榜奖励',           val: 0 },   { label: '周榜奖励',           val: 0 },
      { label: '邀请人奖励',         val: 0 },   { label: '会员日累对活动奖励', val: 0 },
      { label: '会员累充奖励',       val: 0 },   { label: '情人节配对活动奖励', val: 0 },
      { label: '好友组队奖励',       val: 0 },   { label: '回归登录奖励',       val: 0 },
      { label: '回归拉单奖励',       val: 0 },
      // ── 原VIP列 → 活动类 ─────────────────────────
      { label: '新手普通奖励',       val: 0 },   { label: '新手超级奖励',       val: 0 },
      { label: '二充赠送',           val: 0 },   { label: '三充赠送',           val: 0 },
      { label: '裂变轮盘首次请',     val: 0 },   { label: '日救援金',           val: 0 },
      { label: '幸运轮盘',           val: 0 },   { label: '新累充奖励',         val: 0 },
      { label: '飞艇奖励',           val: 0 },   { label: '神秘礼盒',           val: 0 },
      { label: '一元购投注',         val: 0 },   { label: '一元购兑奖',         val: 0 },
      { label: '一元购奖金额',       val: 0 },   { label: '红包雨活动奖励',     val: 0 },
      { label: '绑定邮箱奖励',       val: 0 },   { label: '复活奖励',           val: 0 },
      { label: '转运金奖励',         val: 0 },   { label: '七日夺金奖励',       val: 0 },
    ];
    // VIP列（仅VIP核心数据）
    const activityVip = [
      { label: 'VIP等级',     val: 0 },    { label: 'VIP升级奖励', val: 0 },
      { label: 'VIP周奖励',   val: 0 },    { label: 'VIP月奖励',   val: 0 },
      { label: 'VIP经验值',   val: 95.5 }, { label: '是否免风控',  val: '否' },
      { label: 'VIP充值彩金', val: 0 },
    ];
    const activityVault = [
      { label: '已领取收益', val: 0 },  { label: '未领取收益', val: 0 },
      { label: '保险箱利率', val: 0.2 },{ label: 'VIP充值彩金', val: 0 },
    ];
    const bettingGameLabel = {
      total: '合计', wingo: 'WinGo', k3: 'K3', '5d': '5D',
      trxwingo: 'TrxWinGo', kerala: 'Kerala', slots: '电子',
      live: '视讯', sports: '体育', chess: '棋牌', speedboat: '飞艇',
    };

    const openDetail = (row) => {
      Object.assign(memberDetail.data, {
        ...row,
        phone: '138****8888',
        teamCount: 12, directCount: 3,
        rebateRatio: '1%', rebateBonus: '₹0.00', washBonus: '₹0.00',
        firstDepositDate: '2025-04-20',
        secondDeposit: '₹0.00', secondDepositDate: '—',
        thirdDeposit: '₹0.00',  thirdDepositDate: '—',
        requiredWager: 4336, completedWager: 95.5, remainingWager: 4240.5,
        activityRequiredWager: 0, activityCompletedWager: 0, activityRemainingWager: 0,
        recentDeposits: row.hasRecharge === '是'
          ? [{ time: row.registerTime, amount: row.firstDeposit, channel: 'Testpay' }]
          : [],
        recentWithdrawals: [],
        recentLogins: [
          { time: row.lastLoginTime,     ip: row.lastLoginTimeIp, sameIpCount: 62 },
          { time: '2025-04-20 11:54:23', ip: row.lastLoginTimeIp, sameIpCount: 62 },
          { time: row.registerTime,      ip: row.registerTimeIp,  sameIpCount: 68 },
        ],
        sameIpRegisterCount: 68,
        bettingData: {
          total:     { bet: 120,  profit: 64.5, orders: 12 },
          wingo:     { bet: 0,    profit: 0,    orders: 0 },
          k3:        { bet: 0,    profit: 0,    orders: 0 },
          '5d':      { bet: 0,    profit: 0,    orders: 0 },
          trxwingo:  { bet: 0,    profit: 0,    orders: 0 },
          kerala:    { bet: 0,    profit: 0,    orders: 0 },
          slots:     { bet: 120,  profit: 64.5, orders: 12 },
          live:      { bet: 0,    profit: 0,    orders: 0 },
          sports:    { bet: 0,    profit: 0,    orders: 0 },
          chess:     { bet: 0,    profit: 0,    orders: 0 },
          speedboat: { bet: 0,    profit: 0,    orders: 0 },
        },
      });
      memberDetail.activeTab = 'info';
      memberDetail.timeRange = [];
      memberDetail.visible = true;
    };

    /* ── 子弹窗：历史备注 ── */
    const remarkHistoryDialog = reactive({
      visible: false,
      list: [
        { content: '12334', operator: 'cici', time: '2025-04-21 09:01:38' },
        { content: '123',   operator: 'cici', time: '2025-04-21 09:01:34' },
      ],
    });

    /* ── 子弹窗：修改备注 ── */
    const editRemarkDialog = reactive({ visible: false, memberId: '', remark: '' });
    const openEditRemark = () => {
      editRemarkDialog.memberId = memberDetail.data.memberId;
      editRemarkDialog.remark   = memberDetail.data.remark && memberDetail.data.remark !== '—' ? memberDetail.data.remark : '';
      editRemarkDialog.visible  = true;
    };
    const submitEditRemark = () => {
      memberDetail.data.remark = editRemarkDialog.remark || '—';
      editRemarkDialog.visible = false;
      ElMessage.success('备注修改成功');
    };

    /* ── 子弹窗：修改打码量 ── */
    const editWagerDialog = reactive({ visible: false, hint: '', value: '' });
    const openEditWager = (type) => {
      editWagerDialog.hint  = type === 'wager'
        ? '请输入打码量（正数加已完成打码量，负数加未完成打码量）'
        : '请输入活动打码量';
      editWagerDialog.value   = '';
      editWagerDialog.visible = true;
    };
    const submitEditWager = () => {
      editWagerDialog.visible = false;
      ElMessage.success('修改成功');
    };

    /* ── 子弹窗：关联账号 ── */
    const relatedAccountsDialog = reactive({
      visible: false,
      page: 1, size: 10, total: 1,
      list: [
        {
          playerId:     '99976065',
          account:      '0922233374',
          registerTime: '2025-04-20 23:24:48',
          registerIp:   '2402:800:63ac:8dfc:29d5:cc4d:c584:2731',
        },
      ],
    });

    /* ── 会员标签（风控已并入标签）── */
    const TAG_TYPE = { '高净值': 'warning', '潜力': 'info' };
    const memberTagList = (row) => {
      if (!row) return [];
      const list = [];
      const base = row.tags;
      if (base && base !== '-' && base !== '—') {
        String(base).split(/[,，、\s]+/).filter(Boolean).forEach(t => {
          list.push({ label: t, type: TAG_TYPE[t] || '', effect: 'plain' });
        });
      }
      if (row.risk === '是')     list.push({ label: '风险',   type: 'danger',  effect: 'dark'  });
      if (row.riskFree === '是') list.push({ label: '免风控', type: 'success', effect: 'plain' });
      return list;
    };

    const icons = ElementPlusIconsVue;

    return {
      expanded, filters,
      columnOptions, visibleColumns, allColsVisible, someColsVisible, toggleAllCols,
      tableRef, tableData, pagination, selection,
      allSelected, someSelected, toggleSelectAll, toggleRow,
      searchTypeLabel, searchPlaceholder,
      selectionAccounts,
      resetPwdDialog, openResetPwd, submitResetPwd,
      confirmDialog, openConfirm, doConfirm,
      batchRemarkDialog, openBatchRemark, submitBatchRemark,
      batchRebatePlanDialog, openBatchRebatePlan, submitBatchRebatePlan,
      batchTagsDialog, openBatchTags, submitBatchTags,
      addMemberDialog, openAddMember, addMemberRow, removeMemberRow, submitAddMember,
      memberDetail, openDetail, memberTagList,
      activityDeposit, activityBonus, activityVip, activityVault, bettingGameLabel,
      remarkHistoryDialog,
      editRemarkDialog, openEditRemark, submitEditRemark,
      editWagerDialog, openEditWager, submitEditWager,
      relatedAccountsDialog,
      search, reset, exportData, copyText,
      Search: icons.Search, Refresh: icons.Refresh, Download: icons.Download,
      ArrowUp: icons.ArrowUp, ArrowDown: icons.ArrowDown,
      Plus: icons.Plus, Upload: icons.Upload, Tickets: icons.Tickets,
      Operation: icons.Operation, RefreshRight: icons.RefreshRight,
    };
  }
});

/* ========== 工具 ========== */
const MOCK_NOW = '2025-03-31 14:18:00';
const MOCK_DATE = '2025-03-31';
function todayStart() { return '2025-03-31 00:00:00'; }
function todayEnd()   { return '2025-03-31 23:59:59'; }
function fmt(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function mockRows(n) {
  const rows = [];
  const accounts = [
    'karrytest6622.0','karrytest2587.0','karrytest6403.0','karrytest8546.0','karrytest4295.0',
    'karrytest558.0','karrytest2157.0','karrytest9812.0','karrytest3344.0','karrytest7720.0',
  ];
  const layers     = ['默认层级','新手','高活','沉默'];
  const statuses   = ['正常','正常','正常','禁用'];
  const channels   = [
    { name:'官方直营',   domain:'www.66lottery.com' },
    { name:'谷歌推广',   domain:'ads-google.66lottery.com' },
    { name:'TG频道A',    domain:'tg-a.66lottery.com' },
    { name:'代理渠道01', domain:'agent01.66lottery.com' },
    { name:'Facebook投放', domain:'ads-fb.66lottery.com' },
    { name:'代理渠道02', domain:'agent02.66lottery.com' },
  ];
  const ips        = ['43.216.147.68','8.210.121.2','103.45.67.89','52.77.234.10','18.163.45.20'];
  const balances   = ['₹0.00','₹0.00','₹0.00','₹125.50','₹0.00','₹3,250.00','₹0.00','₹88.75','₹10,000.00','₹560.20'];
  const vaults     = ['₹0.00','₹0.00','₹500.00','₹0.00','₹1,200.00','₹0.00','₹0.00','₹75.00','₹0.00','₹3,000.00'];
  const firstDeps  = ['₹0.00','₹500.00','₹1,000.00','₹200.00','₹0.00','₹5,000.00','₹300.00','₹0.00','₹10,000.00','₹150.00'];
  const totalDeps  = ['₹0.00/0','₹500.00/1','₹4,200.00/6','₹200.00/1','₹0.00/0','₹32,500.00/18','₹900.00/3','₹0.00/0','₹10,000.00/1','₹1,050.00/4'];
  const gameSt     = ['开启全部','开启全部','开启全部','禁止全部','开启全部','仅三方','开启全部','开启全部','仅自研','开启全部'];
  const regTimes   = [
    '2025-04-20 14:23:03','2025-04-19 09:15:44','2025-04-18 17:02:11','2025-04-17 08:30:59',
    '2025-04-15 21:48:33','2025-04-10 13:05:17','2025-04-08 11:22:40','2025-03-28 16:44:05',
    '2025-03-15 07:59:21','2025-02-20 23:11:38',
  ];
  const loginTimes = [
    '2025-04-20 16:31:02','2025-04-20 14:13:06','2025-04-20 14:06:45','2025-04-20 14:06:23',
    '2025-04-19 22:58:11','2025-04-19 10:44:33','2025-04-18 09:17:50','2025-04-17 15:30:12',
    '2025-04-16 08:05:44','2025-04-15 19:22:09',
  ];
  const parents = [
    { id:'-', account:'-' },
    { id:'-', account:'-' },
    { id:'20001234', account:'agent_ph01' },
    { id:'-', account:'-' },
    { id:'20005678', account:'agent_ph02' },
    { id:'-', account:'-' },
    { id:'-', account:'-' },
    { id:'20001234', account:'agent_ph01' },
    { id:'-', account:'-' },
    { id:'20009999', account:'topagent01' },
  ];

  for (let i = 0; i < n; i++) {
    const ch  = channels[i % channels.length];
    const par = parents[i % parents.length];
    rows.push({
      memberId:       10000000 + Math.floor(Math.random() * 89999999),
      account:        accounts[i % accounts.length],
      subAccount:     i % 4 === 0 ? accounts[i % accounts.length] + '_sub' : '-',
      currency:       'INR',
      accountStatus:  statuses[i % 4],
      layer:          layers[i % layers.length],
      vipLevel:       'VIP' + (i % 5),
      channelName:    ch.name,
      channelDomain:  ch.domain,
      balance:        balances[i % balances.length],
      vaultBalance:   vaults[i % vaults.length],
      registerTime:   regTimes[i % regTimes.length],
      registerTimeIp: ips[i % ips.length],
      lastLoginTime:  loginTimes[i % loginTimes.length],
      lastLoginTimeIp:ips[(i + 2) % ips.length],
      riskFree:       i % 4 === 0 ? '是' : '否',
      gameStatus:     gameSt[i % gameSt.length],
      withdrawStatus: i % 5 === 3 ? '禁止' : '开启',
      rebateStatus:   i % 6 === 5 ? '禁止' : '开启',
      risk:           i % 5 === 0 ? '是' : '否',
      hasRecharge:    i % 3 !== 0 ? '是' : '否',
      onlineStatus:   i % 3 === 0 ? '在线' : '离线',
      registerDevice: ['iOS','Android','H5','PC'][i % 4],
      inviteCode:     String(81000000 + i * 1234),
      parentId:       par.id,
      parentAccount:  par.account,
      topParentId:    par.id === '-' ? '-' : '10000001',
      topParentAccount: par.id === '-' ? '-' : 'topagent01',
      firstDeposit:   firstDeps[i % firstDeps.length],
      firstWithdraw:  '₹0.00',
      totalDeposit:   totalDeps[i % totalDeps.length],
      totalWithdraw:  '₹0.00/0',
      venueBalance:   '₹0.00',
      rebatePlan:     '默认返奖率',
      tags:           i % 4 === 0 ? '高净值' : '-',
      remark:         '-',
    });
  }
  return rows;
}

/* ========== 返水明细组件 ========== */
const RebateDetail = defineComponent({
  name: 'RebateDetail',
  template: '#rebate-detail-tpl',
  setup() {
    const { ref, reactive, computed } = Vue;

    // ── 筛选 ──
    const rdFilter = reactive({
      currency:'', account:'', dateRange:[],
      betMin:'', betMax:'', rebateMin:'', rebateMax:'',
    });
    const rdPageSize = ref(10);
    const rdJumpPage = ref('1');
    const rdResetFilter = () => Object.assign(rdFilter, {
      currency:'', account:'', dateRange:[],
      betMin:'', betMax:'', rebateMin:'', rebateMax:'',
    });
    const rdQuery = () => ElMessage.success('查询完成');

    // ── 8 个游戏分类（按用户要求顺序）──
    const rdGameCats = [
      { key:'ele',        name:'电子',   width:100 },
      { key:'esports',    name:'电竞',   width:100 },
      { key:'lottery',    name:'彩票',   width:100 },
      { key:'live',       name:'真人',   width:100 },
      { key:'chess',      name:'棋牌',   width:100 },
      { key:'sport',      name:'体育',   width:100 },
      { key:'blockchain', name:'区块链', width:105 },
      { key:'fish',       name:'捕鱼',   width:100 },
    ];

    // ── 投注明细场馆（按分类过滤）──
    const venuesByCat = {
      ele:        ['MT电子','龙游电子','天游电子','黑桃电子','乐游电子','PP电子','JILI电子','FC电子','PG电子','CQ9电子','JDB电子','AG电子','PT电子','BG电子'],
      esports:    ['IM电竞','雷火电竞','平博电竞','沙巴电竞','泛亚电竞'],
      lottery:    ['彩票游戏','快三','时时彩','北京赛车','幸运飞艇','K3彩票'],
      live:       ['AG真人','WM真人','DG真人','EVO真人','OB真人','BG真人','AE真人'],
      chess:      ['棋牌游戏','博乐棋牌','乐游棋牌','开元棋牌','皇冠棋牌'],
      sport:      ['体育赛事','IM体育','平博体育','沙巴体育','OB体育','BTI体育'],
      blockchain: ['区块链游戏','哈希彩','链上竞猜','Hash游戏'],
      fish:       ['捕鱼游戏','JDB捕鱼','JILI捕鱼','CQ9捕鱼','富贵捕鱼'],
    };

    // ── 表格数据 ──
    const makeCats = () => Object.fromEntries(rdGameCats.map(c => [c.key, { bet:'12,345.67', amt:'123.45' }]));
    const makeSumCats = () => Object.fromEntries(rdGameCats.map(c => [c.key, { bet:'37,037.01', amt:'370.35' }]));

    const rdTableData = computed(() => {
      const rows = [
        { date:'2025-04-28', account:'heart1', vip:'VIP0', currency:'INR', totalBet:'₹74,074.02', totalAmt:'₹740.70', claimed:'₹600.00', pending:'₹140.70', expired:'₹0.00',   cats:makeCats() },
        { date:'2025-04-28', account:'heart2', vip:'VIP1', currency:'INR', totalBet:'₹74,074.02', totalAmt:'₹740.70', claimed:'₹0.00',   pending:'₹740.70', expired:'₹0.00',   cats:makeCats() },
        { date:'2025-04-27', account:'heart3', vip:'VIP2', currency:'INR', totalBet:'₹74,074.02', totalAmt:'₹740.70', claimed:'₹740.70', pending:'₹0.00',   expired:'₹0.00',   cats:makeCats() },
        { date:'2025-04-27', account:'lion88', vip:'VIP3', currency:'INR', totalBet:'₹74,074.02', totalAmt:'₹740.70', claimed:'₹0.00',   pending:'₹0.00',   expired:'₹740.70', cats:makeCats() },
      ];
      rows.push({ _rowType:'subtotal', _label:'小计', currency:'', account:'', totalBet:'₹296,296.08', totalAmt:'₹2,962.80', claimed:'₹1,340.70', pending:'₹881.40', expired:'₹740.70', cats:makeSumCats() });
      rows.push({ _rowType:'total',    _label:'总计', currency:'', account:'', totalBet:'₹296,296.08', totalAmt:'₹2,962.80', claimed:'₹1,340.70', pending:'₹881.40', expired:'₹740.70', cats:makeSumCats() });
      return rows;
    });

    const rdRowClassName = ({ row }) => {
      if (row._rowType === 'subtotal') return 'rd-subtotal-row';
      if (row._rowType === 'total')    return 'rd-total-row';
      return '';
    };

    // ── 投注明细弹窗 ──
    const betDetailDlg = reactive({
      visible: false,
      catName: '',
      activeVenue: '',
      venues: [],
      pageSize: 10,
      list: Array.from({ length: 10 }, (_, i) => ({
        orderNo:    `18891859084677903${70 + i}`,
        game:       'Money Pot',
        betTime:    '2025-08-28 22:21:59',
        stake:      '₹1.00',
        winLose:    -1,
        validStake: '₹1.00',
      })),
    });

    const openBetDetail = (row, cat) => {
      if (row._rowType) return;
      const venues = venuesByCat[cat.key] || [];
      betDetailDlg.catName     = cat.name;
      betDetailDlg.venues      = venues;
      betDetailDlg.activeVenue = venues[0] || '';
      betDetailDlg.visible     = true;
    };

    return {
      rdFilter, rdPageSize, rdJumpPage,
      rdGameCats, rdTableData, rdRowClassName,
      rdResetFilter, rdQuery,
      betDetailDlg, openBetDetail,
      ArrowLeft:  ElementPlusIconsVue.ArrowLeft,
      ArrowRight: ElementPlusIconsVue.ArrowRight,
      ArrowDown:  ElementPlusIconsVue.ArrowDown,
      Grid:       ElementPlusIconsVue.Grid,
      Download:   ElementPlusIconsVue.Download,
      Search:     ElementPlusIconsVue.Search,
      Refresh:    ElementPlusIconsVue.Refresh,
    };
  }
});

/* ========== 返水设置组件 ========== */
const RebateSettings = defineComponent({
  name: 'RebateSettings',
  template: '#rebate-settings-tpl',
  setup() {
    const icons = ElementPlusIconsVue;

    const globalEnabled = ref(true);
    const globalTip = '开启后，玩家根据投注金额范围获得对应比例的返水奖励（默认关闭）';
    const filterCurrency = ref('INR');


    /* ── 表格数据（新结构） ── */
    const tableData = ref([
      {
        id: 1, name: '返水配置1',
        venues: ['MT电子', 'PG电子', 'JILI电子', 'FC电子', '王者电子'],
        tiers: [{ min:'0', max:'999', rate:'0.5' }, { min:'1000', max:'9999', rate:'0.8' }, { min:'10000', max:'99999', rate:'1.2' }],
        enabled: true, remark: '',
      },
      {
        id: 2, name: '体育返水',
        venues: ['沙巴体育', 'IM体育', 'CMD体育', 'BTI体育'],
        tiers: [{ min:'0', max:'4999', rate:'0.3' }, { min:'5000', max:'99999', rate:'0.6' }],
        enabled: true, remark: '体育专用',
      },
      {
        id: 3, name: '真人返水',
        venues: ['EVO 真人', 'PP视讯'],
        tiers: [{ min:'0', max:'9999', rate:'0.4' }, { min:'10000', max:'99999', rate:'0.9' }],
        enabled: false, remark: '',
      },
      {
        id: 4, name: '棋牌捕鱼返水',
        venues: ['CQ9 棋牌', 'KM棋牌', 'JDB捕鱼', 'JILI捕鱼'],
        tiers: [{ min:'0', max:'99999', rate:'0.7' }],
        enabled: true, remark: '',
      },
    ]);
    const pagination = reactive({ page:1, size:10, total:4 });
    const selection  = ref([]);

    const onQuery = () => ElMessage.success('查询完成');

    const onBatchDelete = () => {
      if (!selection.value.length) return ElMessage.warning('请先勾选需要删除的配置');
      ElMessage.success('删除成功');
    };
    const onDeleteRow = (row) => {
      tableData.value = tableData.value.filter(r => r.id !== row.id);
      ElMessage.success('删除成功');
    };

    /* ── 游戏类型 & 场馆基础数据（排序弹窗用） ── */
    const gameTypes = reactive([
      { name: '电子',   venues: [
        { name: 'MT电子', visible: true }, { name: '王者电子', visible: true },
        { name: 'JILI电子', visible: true }, { name: 'KM电子', visible: true },
        { name: 'FC电子', visible: true }, { name: 'GOG电子', visible: true },
        { name: 'CQ电子', visible: true }, { name: 'JDB电子', visible: true },
        { name: 'PG电子', visible: true },
      ]},
      { name: '电竞',   venues: [{ name: '雷火电竞', visible: true }] },
      { name: '彩票',   venues: [{ name: 'JDB彩票', visible: true }] },
      { name: '真人',   venues: [{ name: 'EVO 真人', visible: true }, { name: 'PP视讯', visible: true }] },
      { name: '棋牌',   venues: [
        { name: 'CQ9 棋牌', visible: true }, { name: 'KM棋牌', visible: true },
        { name: 'FC棋牌', visible: true }, { name: 'JDB棋牌', visible: true },
      ]},
      { name: '体育',   venues: [
        { name: '沙巴体育', visible: true }, { name: 'IM体育', visible: true },
        { name: '皇冠体育', visible: true }, { name: 'CMD体育', visible: true },
        { name: 'BTI体育', visible: true }, { name: 'FB体育', visible: true },
      ]},
      { name: '区块链', venues: [{ name: 'JILI 区块链', visible: true }] },
      { name: '捕鱼',   venues: [
        { name: 'JDB捕鱼', visible: true }, { name: 'FC捕鱼', visible: true },
        { name: 'CQ9 捕鱼', visible: true }, { name: 'MT 捕鱼', visible: true },
        { name: 'pp', visible: true }, { name: 'JILI捕鱼', visible: true },
      ]},
    ]);

    // 场馆名 → 游戏类型映射（表格适用场馆展示用）
    const venueTypeMap = computed(() => {
      const map = {};
      gameTypes.forEach(t => t.venues.forEach(v => { map[v.name] = t.name; }));
      return map;
    });

    // 将场馆列表按游戏类型分组，返回 [{type, venues[]}]
    const groupVenuesByType = (venues) => {
      const groups = {};
      venues.forEach(v => {
        const t = venueTypeMap.value[v] || '其他';
        if (!groups[t]) groups[t] = [];
        groups[t].push(v);
      });
      return Object.entries(groups).map(([type, vs]) => ({ type, venues: vs }));
    };

    /* ── 场馆树形数据（新增弹窗用） ── */
    const venueTree = reactive([
      { name:'电子',   checked:false, indeterminate:false, children:[
        {name:'MT电子',checked:false},{name:'王者电子',checked:false},{name:'JILI电子',checked:false},
        {name:'KM电子',checked:false},{name:'FC电子',checked:false},{name:'GOG电子',checked:false},
        {name:'CQ电子',checked:false},{name:'JDB电子',checked:false},{name:'PG电子',checked:false},
      ]},
      { name:'电竞',   checked:false, indeterminate:false, children:[{name:'雷火电竞',checked:false}] },
      { name:'彩票',   checked:false, indeterminate:false, children:[{name:'JDB彩票',checked:false}] },
      { name:'真人',   checked:false, indeterminate:false, children:[{name:'EVO 真人',checked:false},{name:'PP视讯',checked:false}] },
      { name:'棋牌',   checked:false, indeterminate:false, children:[
        {name:'CQ9 棋牌',checked:false},{name:'KM棋牌',checked:false},
        {name:'FC棋牌',checked:false},{name:'JDB棋牌',checked:false},
      ]},
      { name:'体育',   checked:false, indeterminate:false, children:[
        {name:'沙巴体育',checked:false},{name:'IM体育',checked:false},{name:'皇冠体育',checked:false},
        {name:'CMD体育',checked:false},{name:'BTI体育',checked:false},{name:'FB体育',checked:false},
      ]},
      { name:'区块链', checked:false, indeterminate:false, children:[{name:'JILI 区块链',checked:false}] },
      { name:'捕鱼',   checked:false, indeterminate:false, children:[
        {name:'JDB捕鱼',checked:false},{name:'FC捕鱼',checked:false},{name:'CQ9 捕鱼',checked:false},
        {name:'MT 捕鱼',checked:false},{name:'pp',checked:false},{name:'JILI捕鱼',checked:false},
      ]},
    ]);

    const venueTreeAllChecked = computed({
      get: () => venueTree.every(p => p.checked),
      set: (val) => onVenueTreeToggleAll(val),
    });
    const venueTreeIndeterminate = computed(() => {
      const some = venueTree.some(p => p.checked || p.indeterminate);
      return some && !venueTree.every(p => p.checked);
    });
    const onVenueTreeToggleAll = (val) => {
      venueTree.forEach(p => {
        p.checked = val; p.indeterminate = false;
        p.children.forEach(c => c.checked = val);
      });
    };
    const onVenueParentChange = (parent) => {
      parent.indeterminate = false;
      parent.children.forEach(c => c.checked = parent.checked);
    };
    const onVenueChildChange = (parent) => {
      const total   = parent.children.length;
      const checked = parent.children.filter(c => c.checked).length;
      parent.checked       = checked === total;
      parent.indeterminate = checked > 0 && checked < total;
    };
    const onVenueAdd = () => {
      const selected = [];
      venueTree.forEach(p => p.children.forEach(c => { if (c.checked) selected.push(c.name); }));
      if (!selected.length) return ElMessage.warning('请先选择游戏场馆');
      ElMessage.success(`已选择 ${selected.length} 个场馆`);
    };

    /* ── 返水公共配置弹窗 ── */
    const publicConfigDlg = reactive({
      visible: false,
      form: {
        rebateType: 'realtime',   // realtime | daily | weekly
        distributeMode: 'auto',   // auto | manual | system
        expiryDays: '1',          // 过期天数
        tiers: [                  // 公共投注段（金额范围）
          { min: '0',     max: '999'   },
          { min: '1000',  max: '9999'  },
          { min: '10000', max: '99999' },
        ],
        dailyLimit: '',           // 日返水上限
        weeklyLimit: '',          // 周返水上限
      }
    });

    const addPublicTier   = () => { publicConfigDlg.form.tiers.push({ min:'', max:'' }); };
    const removePublicTier = (idx) => {
      if (publicConfigDlg.form.tiers.length > 1)
        publicConfigDlg.form.tiers.splice(idx, 1);
    };

    // 过期逻辑说明（每种类型）
    const expiryHintMap = {
      realtime: '实时返水产生当天 24:00 开始计算过期',
      daily:    '日返产生当天 24:00 开始计算过期',
      weekly:   '周返暂不开放过期配置',
    };
    const rbTypeLabels = { realtime:'实时返水', daily:'日返水', weekly:'周返水' };
    const rbDistribLabels = {
      auto:   '自动领取 - 过期自动派发',
      manual: '手动领取 - 过期作废',
      system: '系统自动派发',
    };
    const navigate = Vue.inject('navigate', null);
    const goAuditConfig = () => navigate && navigate('audit-config');

    const openPublicConfig = () => { publicConfigDlg.visible = true; };
    const submitPublicConfig = () => {
      publicConfigDlg.visible = false;
      ElMessage.success('公共配置已保存');
    };

    /* ── 新增/编辑弹窗 ── */
    const defaultEditForm = () => ({
      name: '',
      betRanges: [],
      remark: '',
    });
    const editDlg = reactive({ visible:false, isEdit:false, editId:null, form:defaultEditForm() });

    const resetVenueTree = () => {
      venueTree.forEach(p => { p.checked=false; p.indeterminate=false; p.children.forEach(c => c.checked=false); });
    };
    const setVenueTreeFromList = (venueList) => {
      venueTree.forEach(p => {
        p.children.forEach(c => { c.checked = venueList.includes(c.name); });
        const total = p.children.length;
        const cnt = p.children.filter(c => c.checked).length;
        p.checked = cnt === total && total > 0;
        p.indeterminate = cnt > 0 && cnt < total;
      });
    };

    // 从公共配置投注段生成 betRanges，rate 为空
    const betRangesFromPublic = () =>
      publicConfigDlg.form.tiers.map(t => ({ min: t.min, max: t.max, rate: '' }));

    const openAddDlg = () => {
      editDlg.isEdit = false;
      editDlg.editId = null;
      editDlg.form.name = '';
      // 从公共配置读取投注段，比例留空
      editDlg.form.betRanges = betRangesFromPublic();
      editDlg.form.remark = '';
      resetVenueTree();
      editDlg.visible = true;
    };
    const openEditDlg = (row) => {
      editDlg.isEdit = true;
      editDlg.editId = row.id;
      editDlg.form.name = row.name;
      // 公共投注段为准，按顺序匹配行中已保存的比例
      editDlg.form.betRanges = publicConfigDlg.form.tiers.map((t, i) => ({
        min: t.min,
        max: t.max,
        rate: row.tiers[i] ? row.tiers[i].rate : '',
      }));
      editDlg.form.remark = row.remark || '';
      setVenueTreeFromList(row.venues || []);
      editDlg.visible = true;
    };
    const submitEdit = () => {
      if (!editDlg.form.name.trim()) return ElMessage.warning('请输入配置名称');
      const invalid = editDlg.form.betRanges.some(r => !r.rate);
      if (invalid) return ElMessage.warning('请填写所有投注段的返水比例');
      // 收集已选场馆
      const selectedVenues = [];
      venueTree.forEach(p => p.children.forEach(c => { if (c.checked) selectedVenues.push(c.name); }));
      if (!selectedVenues.length) return ElMessage.warning('请至少选择一个适用场馆');

      // 场馆冲突检测：排除当前编辑的条目，检查其他配置是否已包含所选场馆
      const conflicts = [];
      tableData.value.forEach(row => {
        if (editDlg.isEdit && row.id === editDlg.editId) return; // 跳过自身
        const hit = selectedVenues.filter(v => row.venues.includes(v));
        if (hit.length) conflicts.push({ name: row.name, venues: hit });
      });
      if (conflicts.length) {
        const detail = conflicts.map(c => `【${c.name}】${c.venues.join('、')}`).join('；');
        ElMessage.error(`以下场馆已在其他配置中，请先移除后再保存：${detail}`);
        return;
      }

      if (editDlg.isEdit) {
        const row = tableData.value.find(r => r.id === editDlg.editId);
        if (row) {
          row.name = editDlg.form.name;
          row.venues = selectedVenues;
          row.tiers = editDlg.form.betRanges.map(r => ({ min:r.min, max:r.max, rate:r.rate }));
          row.remark = editDlg.form.remark;
        }
      } else {
        const newId = Math.max(0, ...tableData.value.map(r => r.id)) + 1;
        tableData.value.push({
          id: newId,
          name: editDlg.form.name,
          venues: selectedVenues,
          tiers: editDlg.form.betRanges.map(r => ({ min:r.min, max:r.max, rate:r.rate })),
          enabled: true,
          remark: editDlg.form.remark,
        });
      }
      editDlg.visible = false;
      ElMessage.success(editDlg.isEdit ? '修改成功' : '新增成功');
    };

    /* ── 排序弹窗（拖拽，合并类型+场馆） ── */
    const sortDlg = reactive({
      visible: false,
      activeType: '',
      gameTypes: [],
      typeDragSrc: null, typeDragOver: null,
      venueDragSrc: null, venueDragOver: null,
    });

    const sortDlgActiveVenues = computed(() => {
      const t = sortDlg.gameTypes.find(t => t.name === sortDlg.activeType);
      return t ? t.venues : [];
    });

    const openSortDlg = () => {
      sortDlg.gameTypes  = JSON.parse(JSON.stringify(gameTypes));
      sortDlg.activeType = sortDlg.gameTypes[0]?.name || '';
      sortDlg.visible    = true;
    };

    const onTypeDragStart = (idx, event) => {
      sortDlg.typeDragSrc = idx;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(idx));
    };
    const onTypeDrop = (targetIdx, event) => {
      event.preventDefault();
      if (sortDlg.typeDragSrc === null || sortDlg.typeDragSrc === targetIdx) return;
      const arr = sortDlg.gameTypes;
      const [moved] = arr.splice(sortDlg.typeDragSrc, 1);
      arr.splice(targetIdx, 0, moved);
      sortDlg.typeDragSrc = null; sortDlg.typeDragOver = null;
    };

    const onVenueDragStart = (idx, event) => {
      sortDlg.venueDragSrc = idx;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(idx));
    };
    const onVenueDrop = (targetIdx, event) => {
      event.preventDefault();
      if (sortDlg.venueDragSrc === null || sortDlg.venueDragSrc === targetIdx) return;
      const t = sortDlg.gameTypes.find(t => t.name === sortDlg.activeType);
      if (!t) return;
      const arr = t.venues;
      const [moved] = arr.splice(sortDlg.venueDragSrc, 1);
      arr.splice(targetIdx, 0, moved);
      sortDlg.venueDragSrc = null; sortDlg.venueDragOver = null;
    };

    const submitSort = () => {
      // 回写到主数据
      gameTypes.splice(0, gameTypes.length,
        ...sortDlg.gameTypes.map(st => ({
          name: st.name,
          venues: st.venues.map(v => ({ name: v.name, visible: v.visible })),
        }))
      );
      sortDlg.visible = false;
      ElMessage.success('排序已保存');
    };

    /* ── 打折系数弹窗 ── */
    const discountDlg = reactive({
      visible: false,
      types: [
        { name:'电竞',   value:'100.00' },
        { name:'体育',   value:'22.00'  },
        { name:'真人',   value:'20.00'  },
        { name:'电子',   value:'100.00' },
        { name:'棋牌',   value:'100.00' },
        { name:'彩票',   value:'100.00' },
        { name:'捕鱼',   value:'100.00' },
        { name:'区块链', value:'100.00' },
      ],
    });
    const submitDiscount = () => {
      discountDlg.visible = false;
      ElMessage.success('返水打折系数已保存');
    };

    return {
      globalEnabled, globalTip, filterCurrency,
      tableData, pagination, selection,
      onQuery, onBatchDelete, onDeleteRow,
      venueTree, venueTreeAllChecked, venueTreeIndeterminate,
      onVenueTreeToggleAll, onVenueParentChange, onVenueChildChange,
      groupVenuesByType,
      goAuditConfig,
      publicConfigDlg, rbTypeLabels, rbDistribLabels, expiryHintMap,
      openPublicConfig, submitPublicConfig, addPublicTier, removePublicTier,
      editDlg, openAddDlg, openEditDlg, submitEdit,
      sortDlg, sortDlgActiveVenues,
      openSortDlg, onTypeDragStart, onTypeDrop, onVenueDragStart, onVenueDrop, submitSort,
      discountDlg, submitDiscount,
      Grid: icons.Grid, Setting: icons.Setting,
      Search: icons.Search, Refresh: icons.Refresh,
      onReset: () => { filterCurrency.value = 'INR'; },
    };
  }
});

/* ========== VIP管理组件 ========== */
const VipManage = defineComponent({
  name: 'VipManage',
  template: '#vip-manage-tpl',
  setup() {
    const icons = ElementPlusIconsVue;

    const filterCurrency = ref('INR');
    const rebateEnabled  = ref(true);
    const rebateTip = '打开VIP返水加成，玩家获得的返水金额将按照VIP等级对应的返水加成系数增加（默认关闭）';

    /* ── 表格数据 ── */
    const vipList = ref([
      { currency:'INR', vipLevel:'VIP0', vipName:'Bronze',   memberCount:478530, wager:'1',       deposit:'0',     levelGift:'10',  weekGift:'10',  monthGift:'10',  birthdayGift:'1.01', rebateCoeff:100, dedicatedService:true,  withdrawLimit:'₹50/1次',      freeCount:'1',      operator:'shawn001', operateTime:'2025-04-20 14:48:17', status:'active' },
      { currency:'INR', vipLevel:'VIP1', vipName:'Silver',   memberCount:2772,   wager:'100',     deposit:'100',   levelGift:'2',   weekGift:'1',   monthGift:'1',   birthdayGift:'101',  rebateCoeff:111, dedicatedService:true,  withdrawLimit:'无限制/无限制', freeCount:'无限制', operator:'sofia001', operateTime:'2025-04-17 11:06:54', status:'active' },
      { currency:'INR', vipLevel:'VIP2', vipName:'Gold',     memberCount:393,    wager:'3000',    deposit:'300',   levelGift:'10',  weekGift:'1',   monthGift:'3',   birthdayGift:'23',   rebateCoeff:112, dedicatedService:true,  withdrawLimit:'₹200/2次',     freeCount:'1',      operator:'luis001',  operateTime:'2025-04-11 16:47:57', status:'active' },
      { currency:'INR', vipLevel:'VIP3', memberCount:79,     wager:'10000',   deposit:'500',   levelGift:'30',  weekGift:'3',   monthGift:'5',   birthdayGift:'103',  rebateCoeff:113, dedicatedService:false, withdrawLimit:'₹500/5次',     freeCount:'4',      operator:'luis001',  operateTime:'2025-04-10 14:06:38', status:'active' },
      { currency:'INR', vipLevel:'VIP4', memberCount:33,     wager:'30000',   deposit:'1000',  levelGift:'50',  weekGift:'5',   monthGift:'10',  birthdayGift:'104',  rebateCoeff:114, dedicatedService:false, withdrawLimit:'无限制/无限制', freeCount:'无限制', operator:'luis001',  operateTime:'2025-04-08 14:57:35', status:'active' },
      { currency:'INR', vipLevel:'VIP5', memberCount:33,     wager:'100000',  deposit:'3000',  levelGift:'100', weekGift:'10',  monthGift:'20',  birthdayGift:'105',  rebateCoeff:115, dedicatedService:false, withdrawLimit:'无限制/无限制', freeCount:'无限制', operator:'luis001',  operateTime:'2025-04-08 14:59:03', status:'active' },
      { currency:'INR', vipLevel:'VIP6', memberCount:28,     wager:'300000',  deposit:'5000',  levelGift:'250', weekGift:'20',  monthGift:'30',  birthdayGift:'106',  rebateCoeff:116, dedicatedService:false, withdrawLimit:'无限制/无限制', freeCount:'无限制', operator:'luis001',  operateTime:'2025-04-08 14:59:08', status:'active' },
      { currency:'INR', vipLevel:'VIP7', memberCount:216,    wager:'600000',  deposit:'10000', levelGift:'350', weekGift:'30',  monthGift:'50',  birthdayGift:'107',  rebateCoeff:117, dedicatedService:false, withdrawLimit:'无限制/无限制', freeCount:'无限制', operator:'shawn001', operateTime:'2025-04-07 14:59:31', status:'active' },
      { currency:'INR', vipLevel:'VIP8', memberCount:null,   wager:'1000000', deposit:'30000', levelGift:'500', weekGift:'50',  monthGift:'100', birthdayGift:'108',  rebateCoeff:118, dedicatedService:false, withdrawLimit:'无限制/无限制', freeCount:'无限制', operator:'luis001',  operateTime:'2025-04-07 14:31:20', status:'active' },
    ]);

    const onReset  = () => { filterCurrency.value = 'INR'; };
    const onQuery  = () => ElMessage.success('查询完成');
    const onToggleStatus = (row) => {
      row.status = row.status === 'active' ? 'disabled' : 'active';
      ElMessage.success(row.status === 'active' ? '已启用' : '已禁用');
    };

    /* ── 公共设置弹窗 ── */
    const gameTabs = [
      { name:'电子', count:9 }, { name:'捕鱼', count:4 }, { name:'真人', count:2 },
      { name:'体育', count:1 }, { name:'棋牌', count:4 }, { name:'彩票', count:1 },
      { name:'电竞', count:0 },
    ];
    const providersByTab = {
      '电子': ['JDB','GOGSLOT','FC','CQ','KINGMIDAS','JILI','PP','MT','PG'],
      '捕鱼': ['JDB','JILI','FC','CQ'],
      '真人': ['AG','BBIN'],
      '体育': ['SABA'],
      '棋牌': ['KY','BG','PG','J8'],
      '彩票': ['TC'],
      '电竞': [],
    };

    const publicDlg = reactive({
      visible: false,
      allSelected: false,
      indeterminate: false,
      rewardRuleLang: 'en',
      form: {
        receiveTime: 'realtime',
        auditMultiplier: 0,
        expiryWeek: 0,
        expiryMonth: 0,
        expiryBirthday: 0,
        expiryEmergency: 0,
        rewardRule: 'default',
        rewardRuleEn: '',
        rewardRuleHi: '',
        platformRestriction: 'none',
        activeTab: '电子',
        selectedProviders: [],
      },
    });

    const currentProviders = computed(() => providersByTab[publicDlg.form.activeTab] || []);

    const onSelectAll = (val) => {
      publicDlg.form.selectedProviders = val ? [...currentProviders.value] : [];
      publicDlg.indeterminate = false;
    };
    const onProviderChange = (val) => {
      const total = currentProviders.value.length;
      publicDlg.allSelected   = val.length === total;
      publicDlg.indeterminate = val.length > 0 && val.length < total;
    };

    const rteCmd = (cmd) => { document.execCommand(cmd, false, null); };

    const openPublicSetting = () => { publicDlg.visible = true; };
    const submitPublicSetting = () => {
      publicDlg.visible = false;
      ElMessage.success('公共设置已保存');
    };

    /* ── 新增/编辑弹窗 ── */
    const defaultGiftCond = () => ({ depositDays:'0', depositAmount:'0', betDays:'0', wagerAmount:'0' });
    const defaultForm = () => ({
      currency: 'INR', vipLevel: '', wager: '', deposit: '',
      nameEn: '', nameHi: '',
      levelGift: '', weekGift: '', monthGift: '', birthdayGift: '',
      rebateCoeff: '', dedicatedService: false,
      dailyWithdrawLimit: '', dailyWithdrawCount: '', dailyFreeCount: '',
      iconName: '',
      giftCondition: false, giftConditionPopup: false,
      levelGiftCond:    defaultGiftCond(),
      weekGiftCond:     defaultGiftCond(),
      monthGiftCond:    defaultGiftCond(),
      birthdayGiftCond: defaultGiftCond(),
    });

    const vipDlg = reactive({ visible: false, isEdit: false, nameLang: 'en', form: defaultForm() });

    const giftTypes = [
      { key:'levelGiftCond',    label:'晋级礼金' },
      { key:'weekGiftCond',     label:'周礼金'   },
      { key:'monthGiftCond',    label:'月礼金'   },
      { key:'birthdayGiftCond', label:'生日礼金' },
    ];

    const openNewVip = () => {
      vipDlg.isEdit = false;
      Object.assign(vipDlg.form, defaultForm());
      vipDlg.visible = true;
    };
    const openEditVip = (row) => {
      vipDlg.isEdit = true;
      Object.assign(vipDlg.form, {
        ...defaultForm(),
        currency: row.currency, vipLevel: row.vipLevel,
        wager: row.wager, deposit: row.deposit,
        levelGift: row.levelGift, weekGift: row.weekGift,
        monthGift: row.monthGift, birthdayGift: row.birthdayGift,
        rebateCoeff: String(row.rebateCoeff),
        dedicatedService: row.dedicatedService,
      });
      vipDlg.visible = true;
    };
    const submitVipForm = () => {
      if (!vipDlg.form.vipLevel) return ElMessage.warning('请填写VIP等级');
      vipDlg.visible = false;
      ElMessage.success(vipDlg.isEdit ? '修改成功' : '新增成功');
    };

    /* 图标上传 */
    const iconFileInput = ref(null);
    const triggerIconUpload = () => iconFileInput.value?.click();
    const onIconFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 500 * 1024) { ElMessage.error('文件大小不能超过500kb'); return; }
      vipDlg.form.iconName = file.name;
      ElMessage.success(`已选择：${file.name}`);
      e.target.value = '';
    };

    return {
      filterCurrency, rebateEnabled, rebateTip,
      vipList, onReset, onQuery, onToggleStatus,
      gameTabs, publicDlg, currentProviders, onSelectAll, onProviderChange,
      rteCmd, openPublicSetting, submitPublicSetting,
      vipDlg, giftTypes, openNewVip, openEditVip, submitVipForm,
      iconFileInput, triggerIconUpload, onIconFileChange,
      Grid: icons.Grid, Setting: icons.Setting, Upload: icons.Upload,
      Search: icons.Search, Refresh: icons.Refresh, Download: icons.Download,
    };
  }
});

/* ========== VIP操作日志 ========== */
const VipLog = defineComponent({
  name: 'VipLog',
  template: '#vip-log-tpl',
  setup() {
    const vlTab = ref('change');

    /* ── VIP变更记录 ── */
    const changeFilter = reactive({ currency: '', account: '', dateStart: '', dateEnd: '' });
    const changePageNum = ref(1);
    const changePageSize = ref(20);
    const changeTotalRows = ref(3);
    const changeTableData = [
      { account: 'user001', currency: 'INR', beforeLevel: 'VIP1', afterLevel: 'VIP2',
        wager: '15,230.00', deposit: '8,000.00', changeTime: '2025-04-25 10:30:00' },
      { account: 'user002', currency: 'INR', beforeLevel: 'VIP2', afterLevel: 'VIP3',
        wager: '52,100.00', deposit: '20,000.00', changeTime: '2025-04-24 15:20:00' },
      { account: 'user003', currency: 'INR', beforeLevel: 'VIP0', afterLevel: 'VIP1',
        wager: '3,500.00', deposit: '1,000.00', changeTime: '2025-04-23 08:15:00' },
    ];
    const changeQuery = () => ElMessage.success('查询VIP变更记录');
    const changeReset = () => {
      changeFilter.currency = '';
      changeFilter.account = '';
      changeFilter.dateStart = '';
      changeFilter.dateEnd = '';
    };

    /* ── 奖金领取记录 ── */
    const rewardFilter = reactive({
      currency: '', account: '', orderNo: '',
      rewardType: '', dateStart: '', dateEnd: '',
    });
    const rewardPageNum = ref(1);
    const rewardPageSize = ref(20);
    const rewardTotalRows = ref(3);
    const rewardTableData = [
      { orderNo: '20260425001234', account: 'user001', vipLevel: 'VIP2',
        rewardType: '晋级礼金', amount: '500.00', currency: 'INR',
        claimTime: '2025-04-25 10:35:00' },
      { orderNo: '20260415003456', account: 'user004', vipLevel: 'VIP2',
        rewardType: '生日礼金', amount: '300.00', currency: 'INR',
        claimTime: '2025-04-16 09:20:00' },
      { orderNo: '20260410007890', account: 'user002', vipLevel: 'VIP3',
        rewardType: '周礼金', amount: '200.00', currency: 'INR',
        claimTime: '2025-04-10 14:05:00' },
    ];
    const rewardQuery = () => ElMessage.success('查询奖金领取记录');
    const rewardReset = () => {
      rewardFilter.currency = ''; rewardFilter.account = ''; rewardFilter.orderNo = '';
      rewardFilter.rewardType = ''; rewardFilter.dateStart = ''; rewardFilter.dateEnd = '';
    };

    const { Download, Operation } = ElementPlusIconsVue;
    return {
      vlTab,
      changeFilter, changePageNum, changePageSize,
      changeTotalRows, changeTableData, changeQuery, changeReset,
      rewardFilter, rewardPageNum, rewardPageSize,
      rewardTotalRows, rewardTableData, rewardQuery, rewardReset,
      Download, Operation,
    };
  }
});

/* ========== 代理列表 ========== */
const AgentList = defineComponent({
  name: 'AgentList',
  template: '#agent-list-tpl',
  setup() {
    const alFilter = reactive({ account:'', parentCode:'', inviteCode:'', phone:'', status:'', currency:'', registerRange:[] });
    const alPagination = reactive({ page:1, size:20, total:113 });
    const alExpanded = ref(false);
    const alSelection = ref([]);

    const alColVis = reactive({
      userBalance:true, status:true,
      d1New:true, d1Bet:true, d1Comm:true,
      d2Count:true, d2Bet:true, d2Comm:true,
      d3Count:true, d3Bet:true, d3Comm:true, teamCount:true, teamPerf:true,
      inviteCode:true, referralComm:true, rankComm:true, betCommTotal:true, claimedComm:true,
      totalComm:true, registerTime:true,
    });
    const alColLabels = [
      { key:'userBalance',  label:'余额 / 待领取佣金' },
      { key:'status',       label:'状态' },
      { key:'d1New',        label:'直属人数(新增/有效)' },
      { key:'d1Bet',        label:'直属投注 / 存款' },
      { key:'d1Comm',       label:'直属结算佣金' },
      { key:'d2Count',      label:'二级人数(新增/有效)' },
      { key:'d2Bet',        label:'二级投注 / 存款' },
      { key:'d2Comm',       label:'二级结算佣金' },
      { key:'d3Count',      label:'三级人数(新增/有效)' },
      { key:'d3Bet',        label:'三级投注 / 存款' },
      { key:'d3Comm',       label:'三级结算佣金' },
      { key:'teamCount',    label:'团队总人数' },      { key:'teamPerf',     label:'团队总业绩(投注/存款)' },
      { key:'inviteCode',   label:'邀请码' },          { key:'referralComm', label:'邀请佣金' },
      { key:'rankComm',     label:'排行榜佣金' },
      { key:'betCommTotal', label:'存投佣金' },
      { key:'claimedComm',  label:'已领取佣金' },
      { key:'totalComm',    label:'历史佣金' },        { key:'registerTime', label:'成为代理时间' },
    ];
    const alAllColsVis = computed(() => alColLabels.every(c => alColVis[c.key]));
    const alSomeColsVis = computed(() => !alAllColsVis.value && alColLabels.some(c => alColVis[c.key]));
    const alToggleAllCols = (val) => alColLabels.forEach(c => { alColVis[c.key] = val; });

    const alAllSelected  = computed(() => alTableData.value.length > 0 && alSelection.value.length === alTableData.value.length);
    const alSomeSelected = computed(() => alSelection.value.length > 0 && !alAllSelected.value);
    const alToggleSelectAll = (val) => { alSelection.value = val ? [...alTableData.value] : []; };
    const alToggleRow = (row) => {
      const i = alSelection.value.indexOf(row);
      i === -1 ? alSelection.value.push(row) : alSelection.value.splice(i, 1);
    };

    const alQuery = () => ElMessage.success('查询完成');
    const alReset = () => Object.assign(alFilter, { account:'', parentCode:'', inviteCode:'', phone:'', status:'', currency:'', registerRange:[] });
    const alCopy  = (val) => { navigator.clipboard?.writeText(val); ElMessage.success('已复制'); };

    /* ── 跳转到 每日数据/直属查询/团队查询（带入代理 ID）── */
    const navigate = Vue.inject('navigate', null);
    const alGo = (kind, row) => {
      agentQueryCtx.source = '';
      agentQueryCtx.memberId = ''; agentQueryCtx.inviteId = ''; agentQueryCtx.agentNo = ''; agentQueryCtx.range = null;
      if (kind === 'daily') {
        agentQueryCtx.source = 'home-daily';
        agentQueryCtx.memberId = row.memberId;
        agentQueryCtx.range = [AQ_MONTH_START, AQ_TODAY];
        navigate && navigate('agent-daily');
      } else if (kind === 'direct') {
        agentQueryCtx.source = 'home-direct';
        agentQueryCtx.memberId = row.memberId;
        navigate && navigate('agent-direct');
      } else if (kind === 'team') {
        agentQueryCtx.source = 'home-team';
        agentQueryCtx.memberId = row.memberId;
        navigate && navigate('agent-team');
      } else if (kind === 'record') {
        agentQueryCtx.source = 'record';
        agentQueryCtx.agentNo = row.account || row.memberId;
        navigate && navigate('commission-record');
      }
    };

    /* ── 启用 / 禁用（确认弹窗样式与会员管理通用确认一致：列出受影响代理 + 黄色警示语）── */
    const alConfirmDlg = reactive({ visible:false, title:'', message:'', accounts:'', action:'', targets:[] });
    const alOpenStatusConfirm = (targets, action) => {
      const batch = targets.length > 1;
      const label = action === 'enabled' ? '启用' : '禁用';
      alConfirmDlg.title    = `确认${label}${batch ? '该批' : '该'}代理？`;
      alConfirmDlg.message  = action === 'disabled'
        ? `禁用后将停止${batch ? '该批代理' : '该代理'}后续一切佣金计算与发放，名下待领取佣金将被冻结、不可领取。`
        : `启用后将恢复${batch ? '该批代理' : '该代理'}的佣金计算与发放。`;
      alConfirmDlg.accounts = targets.map(r => r.account).join('\n');
      alConfirmDlg.action   = action;
      alConfirmDlg.targets  = targets;
      alConfirmDlg.visible  = true;
    };
    const alDoConfirm = () => {
      alConfirmDlg.targets.forEach(r => { r.status = alConfirmDlg.action; });
      alConfirmDlg.visible = false;
      ElMessage.success(alConfirmDlg.action === 'enabled' ? '已启用' : '已禁用');
      alSelection.value = [];
    };
    const alToggleStatus = (row) => alOpenStatusConfirm([row], row.status === 'enabled' ? 'disabled' : 'enabled');
    const alBatchStatus = (action) => {
      if (!alSelection.value.length) return;
      alOpenStatusConfirm([...alSelection.value], action);
    };

    /* ── 佣金调整弹窗（佣金修正）── */
    const adjustDlg = reactive({ visible:false, agentId:'', account:'', available:'0.00', type:'increase', amount:0, reason:'' });
    const openAdjustDlg = (row) => {
      adjustDlg.agentId   = row.memberId;
      adjustDlg.account   = row.account;
      adjustDlg.available = row.pending || '0.00';
      adjustDlg.type      = 'increase';
      adjustDlg.amount    = 0;
      adjustDlg.reason    = '';
      adjustDlg.visible   = true;
    };
    const submitAdjust = () => {
      if (!adjustDlg.amount || Number(adjustDlg.amount) <= 0) return ElMessage.warning('请输入大于 0 的调整金额');
      if (!adjustDlg.reason.trim()) return ElMessage.warning('请填写调整原因');
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const time = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      commissionAdjustRecords.unshift({
        agentId: adjustDlg.agentId,
        account: adjustDlg.account,
        type:    adjustDlg.type === 'increase' ? '增加' : '扣除',
        amount:  Number(adjustDlg.amount).toFixed(2),
        reason:  adjustDlg.reason.trim(),
        operator:'admin',
        time,
      });
      adjustDlg.visible = false;
      ElMessage.success('佣金调整成功，已记入佣金记录');
    };

    const alTableData = ref([
      { memberId:'154174073984', status:'enabled',  account:'u0fB4e0puk', phone:'55 15541795855', userBalance:'16.96',    pending:'19.00',  inviteCode:'446F145', currency:'INR', d1New:1, d1Valid:1, d1Bet:'5,000.00', d1Ratio:0.12, d1Dep:'2,000.00', d1DepRatio:0.50, d1Comm:'1,600.00', d2Count:null, d2Valid:null, d2Bet:null, d2Ratio:null, d2Dep:null, d2DepRatio:null, d2Comm:null, d3Count:null, d3Valid:null, d3Bet:null, d3Ratio:null, d3Dep:null, d3DepRatio:null, d3Comm:null, teamCount:24, teamPerfDeposit:'3,500.00', teamPerfBet:'2,180.00', referralComm:'10.00', rankComm:'9.00',  betCommTotal:'600.00', depCommTotal:'1,000.00', claimedComm:'1,600.00', totalComm:'1,619.00', registerTime:'2025-04-28 10:19:15' },
      { memberId:'152847392640', status:'enabled',  account:'u3kp7mXnqw', phone:'55 13956781234', userBalance:'521.00',   pending:'12.00',  inviteCode:'4F99983', currency:'INR', d1New:2, d1Valid:2, d1Bet:'800.00',   d1Ratio:0.12, d1Dep:'350.00',   d1DepRatio:0.50, d1Comm:'271.00',   d2Count:null, d2Valid:1,    d2Bet:null, d2Ratio:null, d2Dep:null, d2DepRatio:null, d2Comm:null, d3Count:null, d3Valid:null, d3Bet:null, d3Ratio:null, d3Dep:null, d3DepRatio:null, d3Comm:null, teamCount:5,  teamPerfDeposit:'1,500.00', teamPerfBet:'700.00',   referralComm:'20.00', rankComm:'12.00', betCommTotal:'96.00',  depCommTotal:'175.00',   claimedComm:'291.00',   totalComm:'303.00',   registerTime:'2025-04-28 09:53:36' },
      { memberId:'149283746501', status:'disabled', account:'u7ht3zp0lm', phone:'55 11987654321', userBalance:'0.00',     pending:'0.00',   inviteCode:'BP4N301', currency:'INR', d1New:0, d1Valid:0, d1Bet:'0.00',     d1Ratio:0.12, d1Dep:'0.00',     d1DepRatio:0.50, d1Comm:'0.00',     d2Count:null, d2Valid:null, d2Bet:null, d2Ratio:null, d2Dep:null, d2DepRatio:null, d2Comm:null, d3Count:null, d3Valid:null, d3Bet:null, d3Ratio:null, d3Dep:null, d3DepRatio:null, d3Comm:null, teamCount:0,  teamPerfDeposit:'0.00',     teamPerfBet:'0.00',     referralComm:'0.00',  rankComm:'0.00',  betCommTotal:'0.00',   depCommTotal:'0.00',     claimedComm:'0.00',     totalComm:'0.00',     registerTime:'2025-04-28 04:45:17' },
      { memberId:'148701253894', status:'enabled',  account:'u2mx9yqrbd', phone:'55 14677890123', userBalance:'1,143.06', pending:'160.00', inviteCode:'L04N34K', currency:'INR', d1New:1, d1Valid:null, d1Bet:'500.00',  d1Ratio:0.12, d1Dep:'200.00',   d1DepRatio:0.50, d1Comm:'160.00',   d2Count:null, d2Valid:null, d2Bet:null, d2Ratio:null, d2Dep:null, d2DepRatio:null, d2Comm:null, d3Count:null, d3Valid:null, d3Bet:null, d3Ratio:null, d3Dep:null, d3DepRatio:null, d3Comm:null, teamCount:3,  teamPerfDeposit:'600.00',   teamPerfBet:'320.00',   referralComm:'0.00',  rankComm:'0.00',  betCommTotal:'60.00',  depCommTotal:'100.00',   claimedComm:'0.00',     totalComm:'160.00',   registerTime:'2025-04-22 07:39:08' },
      { memberId:'146932817450', status:'enabled',  account:'u9wqb5e1oc', phone:'55 16534567890', userBalance:'12.73',    pending:'13.00',  inviteCode:'4G2GP0',  currency:'INR', d1New:1, d1Valid:1, d1Bet:'1,200.00', d1Ratio:0.12, d1Dep:'600.00',   d1DepRatio:0.50, d1Comm:'444.00',   d2Count:2,    d2Valid:1,    d2Bet:'500.00', d2Ratio:0.08, d2Dep:'200.00', d2DepRatio:0.30, d2Comm:'100.00', d3Count:null, d3Valid:null, d3Bet:null, d3Ratio:null, d3Dep:null, d3DepRatio:null, d3Comm:null, teamCount:8,  teamPerfDeposit:'1,300.00', teamPerfBet:'800.00',   referralComm:'5.00',  rankComm:'4.00',  betCommTotal:'184.00', depCommTotal:'360.00',   claimedComm:'540.00',   totalComm:'553.00',   registerTime:'2025-04-22 07:17:18' },
      { memberId:'144055352320', status:'enabled',  account:'u1htbokp34', phone:'55 13919234532', userBalance:'160.98',   pending:'1.00',   inviteCode:'J003206', currency:'INR', d1New:1, d1Valid:null, d1Bet:'200.00',  d1Ratio:0.12, d1Dep:'100.00',   d1DepRatio:0.50, d1Comm:'74.00',    d2Count:null, d2Valid:null, d2Bet:null, d2Ratio:null, d2Dep:null, d2DepRatio:null, d2Comm:null, d3Count:null, d3Valid:null, d3Bet:null, d3Ratio:null, d3Dep:null, d3DepRatio:null, d3Comm:null, teamCount:2,  teamPerfDeposit:'600.00',   teamPerfBet:'320.00',   referralComm:'1.00',  rankComm:'1.00',  betCommTotal:'24.00',  depCommTotal:'50.00',    claimedComm:'75.00',    totalComm:'76.00',    registerTime:'2025-04-21 00:00:53' },
      { memberId:'141892034561', status:'disabled', account:'u5jx0vlbvq', phone:'55 17823456789', userBalance:'0.00',     pending:'0.00',   inviteCode:'4LJP4',   currency:'INR', d1New:1, d1Valid:null, d1Bet:'50.00',   d1Ratio:0.12, d1Dep:'0.00',     d1DepRatio:0.50, d1Comm:'6.00',     d2Count:null, d2Valid:null, d2Bet:null, d2Ratio:null, d2Dep:null, d2DepRatio:null, d2Comm:null, d3Count:null, d3Valid:null, d3Bet:null, d3Ratio:null, d3Dep:null, d3DepRatio:null, d3Comm:null, teamCount:0,  teamPerfDeposit:'0.00',     teamPerfBet:'0.00',     referralComm:'0.50',  rankComm:'0.00',  betCommTotal:'6.00',   depCommTotal:'0.00',     claimedComm:'0.50',     totalComm:'6.50',     registerTime:'2025-04-19 21:31:40' },
      { memberId:'139976543210', status:'enabled',  account:'u4hzb28o5s', phone:'55 19012345678', userBalance:'40.60',    pending:'1.00',   inviteCode:'4L394G0', currency:'INR', d1New:4, d1Valid:null, d1Bet:'400.00',  d1Ratio:0.12, d1Dep:'150.00',   d1DepRatio:0.50, d1Comm:'123.00',   d2Count:null, d2Valid:null, d2Bet:null, d2Ratio:null, d2Dep:null, d2DepRatio:null, d2Comm:null, d3Count:null, d3Valid:null, d3Bet:null, d3Ratio:null, d3Dep:null, d3DepRatio:null, d3Comm:null, teamCount:1,  teamPerfDeposit:'0.00',     teamPerfBet:'0.00',     referralComm:'1.00',  rankComm:'1.00',  betCommTotal:'48.00',  depCommTotal:'75.00',    claimedComm:'124.00',   totalComm:'125.00',   registerTime:'2025-04-12 08:26:28' },
    ]);

    /* ── 代理详情弹窗 ── */
    const agentDetail = reactive({
      visible: false,
      activeTab: 'info',
      todayExpand: true,
      yesterdayExpand: true,
      subTab: 'members',
      subSearch: '',
      subSize: 50,
      subTotal: 3,
      data: {},
      todayStat:     { directPerf:'500.00', directPerfDeposit:'150.00', directPerfBet:'350.00', teamPerf:'1,200.00', teamPerfDeposit:'400.00', teamPerfBet:'800.00', totalPerf:'1,700.00', totalPerfDeposit:'550.00', totalPerfBet:'1,150.00', directComm:'10.00', teamComm:'24.00', rankComm:'14.00', referralComm:'10.00', claimed:'34.00', unclaimed:'0.00' },
      yesterdayStat: { directPerf:'320.00', directPerfDeposit:'120.00', directPerfBet:'200.00', teamPerf:'760.00', teamPerfDeposit:'260.00', teamPerfBet:'500.00', totalPerf:'1,080.00', totalPerfDeposit:'380.00', totalPerfBet:'700.00', directComm:'6.40', teamComm:'15.20', rankComm:'9.00', referralComm:'6.40', claimed:'21.60', unclaimed:'0.00' },
      memberRows: [
        { id:'143411100928', inviteId:'140507312128', todayPerf:'80.00', todayPerfDeposit:'30.00', todayPerfBet:'50.00', yestPerf:'40.00', yestPerfDeposit:'15.00', yestPerfBet:'25.00', weekPerf:'300.00', weekPerfDeposit:'100.00', weekPerfBet:'200.00', registerTime:'2025-03-21 08:22:31' },
        { id:'143409995008', inviteId:'140507312128', todayPerf:'0.00', todayPerfDeposit:'0.00', todayPerfBet:'0.00', yestPerf:'0.00', yestPerfDeposit:'0.00', yestPerfBet:'0.00', weekPerf:'0.00', weekPerfDeposit:'0.00', weekPerfBet:'0.00', registerTime:'2025-03-21 08:13:31' },
        { id:'143240544768', inviteId:'140507312128', todayPerf:'0.00', todayPerfDeposit:'0.00', todayPerfBet:'0.00', yestPerf:'0.00', yestPerfDeposit:'0.00', yestPerfBet:'0.00', weekPerf:'0.00', weekPerfDeposit:'0.00', weekPerfBet:'0.00', registerTime:'2025-03-20 09:14:32' },
      ],
      agentRows: [
        { id:'140693891584', inviteId:'140507312128', historyPerf:'410.00', historyPerfDeposit:'160.00', historyPerfBet:'250.00', teamCount:11, todayNew:0, registerTime:'2025-03-05 23:49:49', activateTime:'2025-03-05 23:55:05' },
        { id:'140511823672', inviteId:'140507312128', historyPerf:'0.00',   historyPerfDeposit:'0.00', historyPerfBet:'0.00', teamCount:5,  todayNew:0, registerTime:'2025-03-04 23:08:09', activateTime:'2025-03-05 01:00:45' },
        { id:'140511031296', inviteId:'140507312128', historyPerf:'0.00',   historyPerfDeposit:'0.00', historyPerfBet:'0.00', teamCount:8,  todayNew:0, registerTime:'2025-03-04 23:01:42', activateTime:'2025-03-05 04:23:53' },
      ],
      agentPerfRows: [
        { id:'140693891584', inviteId:'140507312128', todayPerf:'120.00', todayPerfDeposit:'40.00', todayPerfBet:'80.00', yestPerf:'0.00', yestPerfDeposit:'0.00', yestPerfBet:'0.00', weekPerf:'410.00', weekPerfDeposit:'160.00', weekPerfBet:'250.00', registerTime:'2025-03-05 23:49:49' },
        { id:'140511823672', inviteId:'140507312128', todayPerf:'0.00', todayPerfDeposit:'0.00', todayPerfBet:'0.00', yestPerf:'0.00', yestPerfDeposit:'0.00', yestPerfBet:'0.00', weekPerf:'0.00', weekPerfDeposit:'0.00', weekPerfBet:'0.00', registerTime:'2025-03-04 23:08:09' },
        { id:'140511031296', inviteId:'140507312128', todayPerf:'0.00', todayPerfDeposit:'0.00', todayPerfBet:'0.00', yestPerf:'0.00', yestPerfDeposit:'0.00', yestPerfBet:'0.00', weekPerf:'0.00', weekPerfDeposit:'0.00', weekPerfBet:'0.00', registerTime:'2025-03-04 23:01:42' },
      ],
    });

    const openAgentDetail = (row) => {
      agentDetail.data = {
        memberId:      row.memberId,
        account:       row.account,
        inviteId:      row.inviteCode || null,
        parentAccount: 'u9wqb5e1oc',
        historyComm:   row.totalComm   || '0.00',
        claimedComm:   row.claimedComm || '0.00',
        unclaimedComm: row.pending     || '0.00',
        parentChain:   'u0c2we90n8 > u9wqb5e1oc',
        weekPerf:      '4,200.00', weekPerfDeposit:'1,400.00', weekPerfBet:'2,800.00', weekComm:      '252.00', weekCommReferral:'50.00',  weekCommRank:'34.00',  weekCommSettled:'168.00',
        lastWeekPerf:  '3,150.00', lastWeekPerfDeposit:'1,050.00', lastWeekPerfBet:'2,100.00', lastWeekComm:  '189.00', lastWeekCommReferral:'40.00',  lastWeekCommRank:'23.00',  lastWeekCommSettled:'126.00',
        monthPerf:     '12,600.00', monthPerfDeposit:'4,200.00', monthPerfBet:'8,400.00', monthComm:     '756.00', monthCommReferral:'150.00', monthCommRank:'102.00', monthCommSettled:'504.00',
        lastMonthPerf: '9,800.00', lastMonthPerfDeposit:'3,200.00', lastMonthPerfBet:'6,600.00', lastMonthComm: '588.00', lastMonthCommReferral:'120.00', lastMonthCommRank:'76.00', lastMonthCommSettled:'392.00',
        todayCommEst:  '0.00',
        totalPromo:    48, todayNew:        0,
        directTotal:   24, todayDirectNew:  0,
        teamTotal:     24, todayTeamNew:    0,
      };
      agentDetail.activeTab = 'info';
      agentDetail.subTab    = 'members';
      agentDetail.subSearch = '';
      agentDetail.visible   = true;
    };

    const icons = ElementPlusIconsVue;
    return {
      alFilter, alExpanded, alPagination, alSelection, alTableData,
      alColVis, alColLabels, alAllColsVis, alSomeColsVis, alToggleAllCols,
      alAllSelected, alSomeSelected, alToggleSelectAll, alToggleRow,
      alQuery, alReset, alCopy, alToggleStatus, alBatchStatus, alConfirmDlg, alDoConfirm,
      adjustDlg, openAdjustDlg, submitAdjust,
      alGo, ArrowDown: ElementPlusIconsVue.ArrowDown, ArrowUp: ElementPlusIconsVue.ArrowUp,
      agentDetail, openAgentDetail,
      Search: icons.Search, Refresh: icons.Refresh, Download: icons.Download,
      Operation: icons.Operation, Plus: icons.Plus, Upload: icons.Upload,
      ArrowLeft: icons.ArrowLeft, ArrowRight: icons.ArrowRight, ArrowDown: icons.ArrowDown,
    };
  }
});

/* ========== 共享：代理查询上下文（代理首页 → 每日数据/直属查询/团队查询 带入 ID）========== */
const agentQueryCtx = reactive({ source:'', memberId:'', inviteId:'', agentNo:'', range:null });
const AQ_TODAY = '2025-05-04';
const AQ_MONTH_START = '2025-05-01';

/* ========== 每日数据（独立页）========== */
const DailyData = defineComponent({
  name: 'DailyData',
  template: '#daily-data-tpl',
  setup() {
    const ddFilter = reactive({ memberId:'', timeRange:[AQ_TODAY, AQ_TODAY] });
    const ddPagination = reactive({ page:1, size:50, total:0 });
    const DD_ROWS = [
      { date:'2025-05-04', memberId:'140507312128', inviteId:'139879534848', directPerf:'0.00', directPerfDeposit:'0.00', directPerfBet:'0.00', teamPerf:'0.00', teamPerfDeposit:'0.00', teamPerfBet:'0.00', directNew:0, teamNew:0, referralComm:'0.00', rankComm:'0.00', settled:'0.00', claimed:'0.00' },
      { date:'2025-05-04', memberId:'142166412544', inviteId:'140507312128', directPerf:'620.00', directPerfDeposit:'400.00', directPerfBet:'220.00', teamPerf:'980.00', teamPerfDeposit:'600.00', teamPerfBet:'380.00', directNew:1, teamNew:2, referralComm:'5.00', rankComm:'3.00', settled:'19.60', claimed:'19.60' },
      { date:'2025-05-04', memberId:'144903381720', inviteId:'140507312128', directPerf:'1280.00', directPerfDeposit:'800.00', directPerfBet:'480.00', teamPerf:'2100.00', teamPerfDeposit:'1300.00', teamPerfBet:'800.00', directNew:3, teamNew:5, referralComm:'10.00', rankComm:'8.00', settled:'42.00', claimed:'30.00' },
      { date:'2025-05-03', memberId:'140507312128', inviteId:'139879534848', directPerf:'0.00', directPerfDeposit:'0.00', directPerfBet:'0.00', teamPerf:'0.00', teamPerfDeposit:'0.00', teamPerfBet:'0.00', directNew:0, teamNew:0, referralComm:'0.00', rankComm:'0.00', settled:'0.00', claimed:'0.00' },
      { date:'2025-05-02', memberId:'140507312128', inviteId:'139879534848', directPerf:'850.00', directPerfDeposit:'500.00', directPerfBet:'350.00', teamPerf:'850.00', teamPerfDeposit:'500.00', teamPerfBet:'350.00', directNew:1, teamNew:1, referralComm:'4.00', rankComm:'2.00', settled:'17.00', claimed:'17.00' },
      { date:'2025-05-01', memberId:'140507312128', inviteId:'139879534848', directPerf:'200.00', directPerfDeposit:'120.00', directPerfBet:'80.00', teamPerf:'200.00', teamPerfDeposit:'120.00', teamPerfBet:'80.00', directNew:0, teamNew:0, referralComm:'1.00', rankComm:'0.00', settled:'4.00', claimed:'4.00' },
      { date:'2025-04-30', memberId:'140507312128', inviteId:'139879534848', directPerf:'620.00', directPerfDeposit:'380.00', directPerfBet:'240.00', teamPerf:'980.00', teamPerfDeposit:'600.00', teamPerfBet:'380.00', directNew:2, teamNew:3, referralComm:'5.00', rankComm:'3.00', settled:'19.60', claimed:'19.60' },
    ];
    const ddTableData = ref([]);
    const inRange = (d) => { const [a,b] = ddFilter.timeRange || []; if (!a || !b) return true; return d >= a && d <= b; };
    const ddRun = () => {
      ddTableData.value = DD_ROWS.filter(r => inRange(r.date) && (!ddFilter.memberId || r.memberId === ddFilter.memberId));
      ddPagination.total = ddTableData.value.length;
    };
    const ddQuery = () => { ddRun(); ElMessage.success('查询完成'); };
    const ddReset = () => { Object.assign(ddFilter, { memberId:'', timeRange:[AQ_TODAY, AQ_TODAY] }); ddRun(); };
    const ddCopy = (val) => { navigator.clipboard?.writeText(val); ElMessage.success('已复制'); };
    onMounted(() => {
      if (agentQueryCtx.source === 'home-daily' && agentQueryCtx.memberId) {
        ddFilter.memberId = agentQueryCtx.memberId;
        ddFilter.timeRange = agentQueryCtx.range || [AQ_MONTH_START, AQ_TODAY];
      } else {
        ddFilter.memberId = '';
        ddFilter.timeRange = [AQ_TODAY, AQ_TODAY];
      }
      ddRun();
      agentQueryCtx.source = '';
    });
    const icons = ElementPlusIconsVue;
    return { ddFilter, ddPagination, ddTableData, ddQuery, ddReset, ddCopy,
      Search: icons.Search, Refresh: icons.Refresh, Download: icons.Download };
  }
});

/* ========== 直属查询 / 团队查询 共用工厂 ========== */
function makeAgentQueryComp(opts) {
  return defineComponent({
    name: opts.name,
    template: opts.template,
    setup() {
      const f = reactive({ searchType:'inviteId', searchVal:'', hasDirect:'',
        unclaimedMin:'', unclaimedMax:'', historyMin:'', historyMax:'',
        perfMin:'', perfMax:'', statDate:AQ_TODAY, registerRange:[] });
      const pag = reactive({ page:1, size:50, total:0 });
      const colVis = reactive({ inviteId:true, history:true, directCount:true, teamCount:true,
        myPerf:true, directPerf:true, teamPerf:true, directNew:true, teamNew:true,
        unclaimed:true, settled:true, referralComm:true, rankComm:true, claimed:true, level: opts.team });
      const colLabels = [
        { key:'inviteId',label:'邀请ID' },{ key:'history',label:'历史佣金' },
        { key:'directCount',label:'直属人数' },{ key:'teamCount',label:'团队人数' },
        { key:'myPerf',label:'我的业绩' },{ key:'directPerf',label:'直属业绩' },
        { key:'teamPerf',label:'团队业绩' },{ key:'directNew',label:'直属新增' },
        { key:'teamNew',label:'团队新增' },{ key:'unclaimed',label:'未领佣金' },
        { key:'settled',label:'存投佣金' },{ key:'referralComm',label:'邀请佣金' },{ key:'rankComm',label:'排行榜佣金' },{ key:'claimed',label:'领取佣金' },
      ];
      if (opts.team) colLabels.splice(1, 0, { key:'level', label:'层级' });
      const allColsVis = computed(() => colLabels.every(c => colVis[c.key]));
      const someColsVis = computed(() => !allColsVis.value && colLabels.some(c => colVis[c.key]));
      const toggleAllCols = (val) => colLabels.forEach(c => { colVis[c.key] = val; });
      const ROWS = [
        { memberId:'142166412544', inviteId:'140507312128', level:1, history:'1472.60', directCount:16, teamCount:5,   myPerf:'620.00', myPerfDeposit:'400.00', myPerfBet:'220.00', directPerf:'1850.00', directPerfDeposit:'1200.00', directPerfBet:'650.00', teamPerf:'2200.00', teamPerfDeposit:'1500.00', teamPerfBet:'700.00', directNew:1, teamNew:1, unclaimed:'37.00', referralComm:'15.00', rankComm:'10.00', settled:'68.00', claimed:'31.00' },
        { memberId:'144055352320', inviteId:'142166412544', level:2, history:'845.66',  directCount:9,  teamCount:981, myPerf:'0.00', myPerfDeposit:'0.00', myPerfBet:'0.00', directPerf:'380.00', directPerfDeposit:'220.00', directPerfBet:'160.00', teamPerf:'920.00', teamPerfDeposit:'600.00', teamPerfBet:'320.00', directNew:0, teamNew:2, unclaimed:'18.40', referralComm:'3.00', rankComm:'2.00', settled:'12.00', claimed:'0.00' },
        { memberId:'144081237760', inviteId:'143958616576', level:3, history:'843.04',  directCount:7,  teamCount:5,   myPerf:'0.00', myPerfDeposit:'0.00', myPerfBet:'0.00', directPerf:'0.00', directPerfDeposit:'0.00', directPerfBet:'0.00', teamPerf:'0.00', teamPerfDeposit:'0.00', teamPerfBet:'0.00', directNew:0, teamNew:0, unclaimed:'0.00', referralComm:'0.00', rankComm:'0.00', settled:'0.00', claimed:'0.00' },
        { memberId:'140720704512', inviteId:'140720499712', level:2, history:'704.56',  directCount:18, teamCount:6,   myPerf:'0.00', myPerfDeposit:'0.00', myPerfBet:'0.00', directPerf:'0.00', directPerfDeposit:'0.00', directPerfBet:'0.00', teamPerf:'0.00', teamPerfDeposit:'0.00', teamPerfBet:'0.00', directNew:0, teamNew:0, unclaimed:'0.00', referralComm:'0.00', rankComm:'0.00', settled:'0.00', claimed:'0.00' },
        { memberId:'145355600128', inviteId:'140507312128', level:1, history:'520.00',  directCount:6,  teamCount:3,   myPerf:'0.00', myPerfDeposit:'0.00', myPerfBet:'0.00', directPerf:'0.00', directPerfDeposit:'0.00', directPerfBet:'0.00', teamPerf:'0.00', teamPerfDeposit:'0.00', teamPerfBet:'0.00', directNew:0, teamNew:0, unclaimed:'0.00', referralComm:'0.00', rankComm:'0.00', settled:'0.00', claimed:'0.00' },
      ];
      const tableData = ref([]);
      const run = () => {
        if (!String(f.searchVal).trim()) { tableData.value = []; pag.total = 0; return; }
        const rows = opts.team ? ROWS : ROWS.filter(r => r.level === 1);
        tableData.value = rows; pag.total = rows.length;
      };
      const query = () => {
        if (!String(f.searchVal).trim()) { tableData.value = []; pag.total = 0; return ElMessage.info('请输入邀请ID / 会员ID 后查询'); }
        run(); ElMessage.success('查询完成');
      };
      const reset = () => { Object.assign(f, { searchType:'inviteId', searchVal:'', hasDirect:'',
        unclaimedMin:'', unclaimedMax:'', historyMin:'', historyMax:'', perfMin:'', perfMax:'', statDate:'', registerRange:[] });
        tableData.value = []; pag.total = 0; };
      const copy = (val) => { navigator.clipboard?.writeText(val); ElMessage.success('已复制'); };
      onMounted(() => {
        if (agentQueryCtx.source === opts.ctxSource && (agentQueryCtx.inviteId || agentQueryCtx.memberId)) {
          f.searchType = agentQueryCtx.memberId ? 'memberId' : 'inviteId';
          f.searchVal = agentQueryCtx.memberId || agentQueryCtx.inviteId;
          run();
        }
        agentQueryCtx.source = '';
      });
      const icons = ElementPlusIconsVue;
      // 暴露为 dq* 名称以复用现有模板绑定
      return {
        dqFilter:f, dqPagination:pag, dqTableData:tableData,
        dqColVis:colVis, dqColLabels:colLabels, dqAllColsVis:allColsVis, dqSomeColsVis:someColsVis, dqToggleAllCols:toggleAllCols,
        dqQuery:query, dqReset:reset, dqCopy:copy,
        Search: icons.Search, Refresh: icons.Refresh, Download: icons.Download, Operation: icons.Operation,
      };
    }
  });
}
const DirectQuery = makeAgentQueryComp({ name:'DirectQuery', template:'#direct-query-tpl', team:false, ctxSource:'home-direct' });
const TeamQuery   = makeAgentQueryComp({ name:'TeamQuery',   template:'#team-query-tpl',   team:true,  ctxSource:'home-team' });

/* ========== 佣金记录 ========== */
const CommissionRecord = defineComponent({
  name: 'CommissionRecord',
  template: '#commission-record-tpl',
  setup() {
    const crTab = ref('deposit');

    const crFilter = reactive({
      agentNo: '', currency: '', rankType: '',
      dateRange: ['2025-03-01', '2025-03-31'],
      commMin: '', commMax: '',
    });

    const crQuery  = () => ElMessage.success('查询完成');
    const crReset  = () => Object.assign(crFilter, {
      agentNo: '', currency: '', rankType: '', dateRange: [],
      commMin: '', commMax: '',
    });
    const crExport = () => ElMessage.success('导出中，请稍候…');
    const crCopy   = (val) => { navigator.clipboard?.writeText(val); ElMessage.success('已复制'); };

    // ── Tab 1：存投佣金（一天一代理一条）──
    const crDbPag  = reactive({ page: 1, size: 20, total: 6 });
    const crDbData = ref([
      { date:'2025-03-31', orderNo:'406033100234561', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', depositBet:'3,205.00',
        l1DepAmt:'200.00',   l1DepRate:'0.50', l1BetAmt:'8,500.00',  l1BetRate:'0.12',
        l2DepAmt:'500.00',   l2DepRate:'0.30', l2BetAmt:'12,000.00', l2BetRate:'0.08',
        l3DepAmt:'500.00',   l3DepRate:'0.15', l3BetAmt:'18,000.00', l3BetRate:'0.05',
        status:'claimed', remark:'' },
      { date:'2025-03-31', orderNo:'406033100234562', agentAccount:'u0jkh8aqdc', agentId:'145355600128', currency:'INR', depositBet:'1,554.00',
        l1DepAmt:'300.00',   l1DepRate:'0.50', l1BetAmt:'5,200.00',  l1BetRate:'0.12',
        l2DepAmt:'600.00',   l2DepRate:'0.30', l2BetAmt:'7,500.00',  l2BetRate:'0.08',
        l3DepAmt:'0.00',     l3DepRate:'0.15', l3BetAmt:'0.00',      l3BetRate:'0.05',
        status:'pending', remark:'' },
      { date:'2025-03-30', orderNo:'406033000234561', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', depositBet:'2,240.00',
        l1DepAmt:'300.00',   l1DepRate:'0.50', l1BetAmt:'6,000.00',  l1BetRate:'0.12',
        l2DepAmt:'0.00',     l2DepRate:'0.30', l2BetAmt:'9,000.00',  l2BetRate:'0.08',
        l3DepAmt:'0.00',     l3DepRate:'0.15', l3BetAmt:'13,000.00', l3BetRate:'0.05',
        status:'claimed', remark:'' },
      { date:'2025-03-30', orderNo:'406033000234562', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', depositBet:'4,200.00',
        l1DepAmt:'800.00',   l1DepRate:'0.50', l1BetAmt:'10,000.00', l1BetRate:'0.12',
        l2DepAmt:'1,000.00', l2DepRate:'0.30', l2BetAmt:'15,000.00', l2BetRate:'0.08',
        l3DepAmt:'0.00',     l3DepRate:'0.15', l3BetAmt:'22,000.00', l3BetRate:'0.05',
        status:'claimed', remark:'' },
      { date:'2025-03-29', orderNo:'406032900234561', agentAccount:'u0jkh8aqdc', agentId:'145355600128', currency:'INR', depositBet:'720.00',
        l1DepAmt:'300.00',   l1DepRate:'0.50', l1BetAmt:'2,500.00',  l1BetRate:'0.12',
        l2DepAmt:'0.00',     l2DepRate:'0.30', l2BetAmt:'3,375.00',  l2BetRate:'0.08',
        l3DepAmt:'0.00',     l3DepRate:'0.15', l3BetAmt:'0.00',      l3BetRate:'0.05',
        status:'expired', remark:'超过有效期未领取' },
      { date:'2025-03-29', orderNo:'406032900234562', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', depositBet:'2,180.00',
        l1DepAmt:'600.00',   l1DepRate:'0.50', l1BetAmt:'7,500.00',  l1BetRate:'0.12',
        l2DepAmt:'600.00',   l2DepRate:'0.30', l2BetAmt:'10,000.00', l2BetRate:'0.08',
        l3DepAmt:'0.00',     l3DepRate:'0.15', l3BetAmt:'0.00',      l3BetRate:'0.05',
        status:'claimed', remark:'' },
    ]);

    // 存投佣金明细弹窗
    const crDbDetail = reactive({ visible: false, agentAccount: '', date: '', total: '', status: '', rows: [] });

    const DB_DETAIL_MOCK = {
      'u1htbokp34|2025-03-31': {
        total: '3,205.00', status: 'claimed',
        rows: [
          { memberAccount:'ugps5gpyps', type:'bet',     level:'直属', txAmount:'8,500.00',  rate:'0.12', amount:'1,020.00' },
          { memberAccount:'u9kml3pp01', type:'deposit', level:'直属', txAmount:'200.00',    rate:'0.50', amount:'100.00' },
          { memberAccount:'u7rrx0bc44', type:'bet',     level:'二级', txAmount:'12,000.00', rate:'0.08', amount:'960.00'  },
          { memberAccount:'u4ppz2ss11', type:'deposit', level:'二级', txAmount:'500.00',    rate:'0.30', amount:'150.00' },
          { memberAccount:'u2mmx7rr09', type:'bet',     level:'三级', txAmount:'18,000.00', rate:'0.05', amount:'900.00'  },
          { memberAccount:'u6qqy3tt55', type:'deposit', level:'三级', txAmount:'500.00',    rate:'0.15', amount:'75.00'  },
        ]
      },
      'u0jkh8aqdc|2025-03-31': {
        total: '1,554.00', status: 'pending',
        rows: [
          { memberAccount:'u3nmq8tt62', type:'bet',     level:'直属', txAmount:'5,200.00',  rate:'0.12', amount:'624.00'  },
          { memberAccount:'u1pbx9yy30', type:'deposit', level:'直属', txAmount:'300.00',    rate:'0.50', amount:'150.00' },
          { memberAccount:'u8kkz0ww14', type:'bet',     level:'二级', txAmount:'7,500.00',  rate:'0.08', amount:'600.00'  },
          { memberAccount:'u5nnv6uu88', type:'deposit', level:'二级', txAmount:'600.00',    rate:'0.30', amount:'180.00' },
        ]
      },
      'u1htbokp34|2025-03-30': {
        total: '2,240.00', status: 'claimed',
        rows: [
          { memberAccount:'ugps5gpyps', type:'bet',     level:'直属', txAmount:'6,000.00',  rate:'0.12', amount:'720.00'  },
          { memberAccount:'u9kml3pp01', type:'deposit', level:'直属', txAmount:'300.00',    rate:'0.50', amount:'150.00' },
          { memberAccount:'u7rrx0bc44', type:'bet',     level:'二级', txAmount:'9,000.00',  rate:'0.08', amount:'720.00'  },
          { memberAccount:'u2mmx7rr09', type:'bet',     level:'三级', txAmount:'13,000.00', rate:'0.05', amount:'650.00'  },
        ]
      },
      'uagt9xk221|2025-03-30': {
        total: '4,200.00', status: 'claimed',
        rows: [
          { memberAccount:'u5kkp1zz88', type:'bet',     level:'直属', txAmount:'10,000.00', rate:'0.12', amount:'1,200.00' },
          { memberAccount:'u2rrx4cc01', type:'deposit', level:'直属', txAmount:'800.00',    rate:'0.50', amount:'400.00' },
          { memberAccount:'u8mnb5dd44', type:'bet',     level:'二级', txAmount:'15,000.00', rate:'0.08', amount:'1,200.00' },
          { memberAccount:'u3ppw9ee77', type:'deposit', level:'二级', txAmount:'1,000.00',  rate:'0.30', amount:'300.00' },
          { memberAccount:'u6ttx1ff22', type:'bet',     level:'三级', txAmount:'22,000.00', rate:'0.05', amount:'1,100.00' },
        ]
      },
      'u0jkh8aqdc|2025-03-29': {
        total: '720.00', status: 'expired',
        rows: [
          { memberAccount:'u3nmq8tt62', type:'bet',     level:'直属', txAmount:'2,500.00',  rate:'0.12', amount:'300.00'  },
          { memberAccount:'u8kkz0ww14', type:'deposit', level:'直属', txAmount:'300.00',    rate:'0.50', amount:'150.00' },
          { memberAccount:'u5nnv6uu88', type:'bet',     level:'二级', txAmount:'3,375.00',  rate:'0.08', amount:'270.00'  },
        ]
      },
      'uagt9xk221|2025-03-29': {
        total: '2,180.00', status: 'claimed',
        rows: [
          { memberAccount:'u5kkp1zz88', type:'bet',     level:'直属', txAmount:'7,500.00',  rate:'0.12', amount:'900.00'  },
          { memberAccount:'u2rrx4cc01', type:'deposit', level:'直属', txAmount:'600.00',    rate:'0.50', amount:'300.00' },
          { memberAccount:'u8mnb5dd44', type:'bet',     level:'二级', txAmount:'10,000.00', rate:'0.08', amount:'800.00'  },
          { memberAccount:'u3ppw9ee77', type:'deposit', level:'二级', txAmount:'600.00',    rate:'0.30', amount:'180.00' },
        ]
      },
    };

    const crOpenDbDetail = (row) => {
      const key = `${row.agentAccount}|${row.date}`;
      const mock = DB_DETAIL_MOCK[key] || { total: row.depositBet, status: 'claimed', rows: [] };
      crDbDetail.agentAccount = row.agentAccount;
      crDbDetail.date = row.date;
      crDbDetail.total = mock.total;
      crDbDetail.status = mock.status;
      crDbDetail.rows = mock.rows;
      crDbDetail.visible = true;
    };

    // ── Tab 2：邀请佣金（一条一条，按状态）──
    const crRefPag  = reactive({ page: 1, size: 20, total: 11 });
    const crRefData = ref([
      { orderNo:'305031001234561', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', ladderCount:2,  amount:'120.00', grantTime:'2025-03-31 09:42:11', claimTime:'2025-03-31 10:24:13', status:'claimed', remark:'' },
      { orderNo:'305031001234562', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', ladderCount:4,  amount:'80.00',  grantTime:'2025-03-31 10:05:38', claimTime:'2025-03-31 10:24:13', status:'claimed', remark:'' },
      { orderNo:'305031001234563', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', ladderCount:7,  amount:'160.00', grantTime:'2025-03-31 16:51:07', claimTime:'',                    status:'pending', remark:'' },
      { orderNo:'305031002234561', agentAccount:'u0jkh8aqdc', agentId:'145355600128', currency:'INR', ladderCount:3,  amount:'60.00',  grantTime:'2025-03-31 13:27:54', claimTime:'2025-03-31 14:05:47', status:'claimed', remark:'' },
      { orderNo:'305031002234562', agentAccount:'u0jkh8aqdc', agentId:'145355600128', currency:'INR', ladderCount:5,  amount:'60.00',  grantTime:'2025-03-31 18:39:21', claimTime:'',                    status:'pending', remark:'' },
      { orderNo:'305030001234561', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', ladderCount:2,  amount:'100.00', grantTime:'2025-03-30 08:55:46', claimTime:'2025-03-30 09:11:32', status:'claimed', remark:'' },
      { orderNo:'305030001234562', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', ladderCount:4,  amount:'140.00', grantTime:'2025-03-30 09:02:13', claimTime:'2025-03-30 09:11:32', status:'claimed', remark:'' },
      { orderNo:'305030003234561', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', ladderCount:3,  amount:'200.00', grantTime:'2025-03-30 11:18:09', claimTime:'2025-03-30 11:48:20', status:'claimed', remark:'' },
      { orderNo:'305030003234562', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', ladderCount:7,  amount:'160.00', grantTime:'2025-03-30 20:44:35', claimTime:'',                    status:'pending', remark:'' },
      { orderNo:'305029003234561', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', ladderCount:10, amount:'180.00', grantTime:'2025-03-29 08:12:50', claimTime:'2025-03-29 08:33:09', status:'claimed', remark:'' },
      { orderNo:'305029003234562', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', ladderCount:15, amount:'180.00', grantTime:'2025-03-29 14:58:26', claimTime:'',                    status:'expired', remark:'超过有效期未领取' },
    ]);

    // ── Tab 3：排行榜佣金（一条一条，按状态）──
    const crRankPag  = reactive({ page: 1, size: 20, total: 8 });
    const crRankData = ref([
      { orderNo:'507033100234561', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', rankType:'commission', period:'2025-03-01 ~ 2025-03-31', rank:1, amount:'800.00', grantTime:'2025-04-01 02:00:00', claimTime:'2025-04-01 09:15:22', status:'claimed' },
      { orderNo:'507033100234562', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', rankType:'commission', period:'2025-03-01 ~ 2025-03-31', rank:2, amount:'500.00', grantTime:'2025-04-01 02:00:00', claimTime:'2025-04-01 10:03:47', status:'claimed' },
      { orderNo:'507033100234563', agentAccount:'u8yzx9mm03', agentId:'146201887634', currency:'INR', rankType:'commission', period:'2025-03-01 ~ 2025-03-31', rank:3, amount:'300.00', grantTime:'2025-04-01 02:00:00', claimTime:'',                    status:'pending' },
      { orderNo:'507033100234564', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', rankType:'headcount',  period:'2025-03-01 ~ 2025-03-31', rank:1, amount:'600.00', grantTime:'2025-04-01 02:00:00', claimTime:'2025-04-01 09:18:05', status:'claimed' },
      { orderNo:'507033100234565', agentAccount:'u3qqb7cc41', agentId:'146009334521', currency:'INR', rankType:'headcount',  period:'2025-03-01 ~ 2025-03-31', rank:2, amount:'400.00', grantTime:'2025-04-01 02:00:00', claimTime:'',                    status:'pending' },
      { orderNo:'507033100234566', agentAccount:'u1htbokp34', agentId:'144414451456', currency:'INR', rankType:'bet',        period:'2025-03-01 ~ 2025-03-31', rank:1, amount:'720.00', grantTime:'2025-04-01 02:00:00', claimTime:'2025-04-01 11:32:18', status:'claimed' },
      { orderNo:'507033100234567', agentAccount:'uagt9xk221', agentId:'144903381720', currency:'INR', rankType:'bet',        period:'2025-03-01 ~ 2025-03-31', rank:2, amount:'480.00', grantTime:'2025-04-01 02:00:00', claimTime:'',                    status:'pending' },
      { orderNo:'507022800234561', agentAccount:'u0jkh8aqdc', agentId:'145355600128', currency:'INR', rankType:'commission', period:'2025-02-01 ~ 2025-02-28', rank:5, amount:'150.00', grantTime:'2025-03-01 02:00:00', claimTime:'',                    status:'expired' },
    ]);

    // ── Tab 4：佣金调整（来自代理列表「佣金修正」，共享 commissionAdjustRecords）──
    const crAdjustData = commissionAdjustRecords;
    const crAdjustPag  = reactive({ page: 1, size: 20, total: computed(() => commissionAdjustRecords.length) });

    onMounted(() => {
      if (agentQueryCtx.source === 'record' && agentQueryCtx.agentNo) {
        crFilter.agentNo = agentQueryCtx.agentNo;
      }
      agentQueryCtx.source = '';
    });

    const icons = ElementPlusIconsVue;
    return {
      crTab, crFilter,
      crDbPag, crDbData, crDbDetail, crOpenDbDetail,
      crRefPag, crRefData,
      crRankPag, crRankData,
      crAdjustData, crAdjustPag,
      crQuery, crReset, crExport, crCopy,
      Search: icons.Search, Refresh: icons.Refresh, Download: icons.Download,
    };
  }
});


/* ========== 首页设置 ========== */
const HomepageSetting = defineComponent({
  name: 'HomepageSetting',
  template: '#homepage-setting-tpl',
  setup() {
    const hsTab = ref('guide-float');
    const hsTabs = [
      { key: 'float-ball',    label: '首页悬浮球' },
      { key: 'sidebar',       label: '首页侧边栏' },
      { key: 'nav-grid',      label: '首页金刚区' },
      { key: 'carousel',      label: '首页轮播图' },
      { key: 'popup',         label: '首页弹窗' },
      { key: 'act-float',     label: '首页活动悬浮' },
      { key: 'guide-float',   label: '引导悬浮设置' },
    ];

    // ── 引导列表数据 ──
    let _nextId = 10;
    const guideRows = reactive([
      { id: 1, status: 'unregistered', guideType: 'register', freq: 'every',  cooldown: 30,  enabled: true,  operator: 'gario001', opTime: '2025-04-30 10:12:05' },
      { id: 2, status: 'registered',   guideType: 'deposit',  freq: 'daily',  cooldown: 60,  enabled: true,  operator: 'gario001', opTime: '2025-04-30 10:15:30' },
      { id: 3, status: 'registered',   guideType: 'spin',     freq: 'weekly', cooldown: 0,   enabled: true,  operator: 'gario001', opTime: '2025-04-30 10:16:00' },
      { id: 4, status: 'deposited',    guideType: 'spin',     freq: 'every',  cooldown: 120, enabled: true,  operator: 'gario001', opTime: '2025-04-29 18:00:00' },
      { id: 5, status: 'deposited',    guideType: 'activity', freq: 'every',  cooldown: 60,  enabled: false, operator: 'gario001', opTime: '2025-04-29 18:02:00' },
    ]);

    // 按状态分组
    const statusOrder = ['unregistered', 'registered', 'deposited', 'withdrawn'];
    const guideGroups = computed(() =>
      statusOrder.map(s => ({
        status: s,
        rows: guideRows.filter(r => r.status === s),
      }))
    );

    // ── 辅助 label / color ──
    const statusMap = {
      unregistered: { label: '未注册',      color: '#e6a23c' },
      registered:   { label: '已注册未充值', color: '#409eff' },
      deposited:    { label: '已充值',       color: '#67c23a' },
      withdrawn:    { label: '已提现',       color: '#f56c6c' },
    };
    const statusLabel = s => statusMap[s]?.label ?? s;
    const statusColor = s => statusMap[s]?.color ?? '#c0c4cc';

    const guideMap = {
      register: { label: '注册引导', icon: '📝' },
      deposit:  { label: '充值引导', icon: '💳' },
      spin:     { label: '大转盘',   icon: '🎡' },
      activity: { label: '活动入口', icon: '🎁' },
      profile:  { label: '个人中心', icon: '👤' },
      promo:    { label: '优惠活动', icon: '🎀' },
      invite:   { label: '邀请好友', icon: '🤝' },
    };
    const guideLabel = g => guideMap[g]?.label ?? g;
    const guideIcon  = g => guideMap[g]?.icon  ?? '?';

    const freqMap = { every: '每次', daily: '每日一次', weekly: '每周一次', once: '只触发一次' };
    const freqLabel = f => freqMap[f] ?? f;

    // ── 弹窗 ──
    const guideDlg = reactive({
      visible: false,
      isEdit: false,
      editId: null,
      form: { status: 'unregistered', guideType: '', freq: 'every', cooldown: '' },
    });

    const statusOptions = [
      { value: 'unregistered', label: '未注册' },
      { value: 'registered',   label: '已注册未充值' },
      { value: 'deposited',    label: '已充值' },
      { value: 'withdrawn',    label: '已提现' },
    ];

    const guideTypeOptions = [
      { value: 'register', label: '注册引导', icon: '📝', iconBg: '#e8f4fd', iconColor: '#409eff', desc: '蒙层高亮注册入口，引导用户完成注册' },
      { value: 'deposit',  label: '充值引导', icon: '💳', iconBg: '#f0f9eb', iconColor: '#67c23a', desc: '蒙层高亮充值入口，引导用户首次存款' },
      { value: 'spin',     label: '大转盘',   icon: '🎡', iconBg: '#fff7e6', iconColor: '#e6a23c', desc: '蒙层高亮大转盘，告知用户可免费抽奖' },
      { value: 'activity', label: '活动入口', icon: '🎁', iconBg: '#f3e8fd', iconColor: '#9b59b6', desc: '蒙层高亮活动中心，介绍可参与的优惠活动' },
      { value: 'profile',  label: '个人中心', icon: '👤', iconBg: '#e8f4fd', iconColor: '#2d8cf0', desc: '蒙层高亮个人中心入口，引导用户完善资料' },
      { value: 'promo',    label: '优惠活动', icon: '🎀', iconBg: '#fef0f0', iconColor: '#f56c6c', desc: '蒙层高亮优惠活动入口，展示当前可参与活动' },
      { value: 'invite',   label: '邀请好友', icon: '🤝', iconBg: '#f0f9eb', iconColor: '#19be6b', desc: '蒙层高亮邀请入口，引导用户分享邀请链接' },
    ];

    const freqOptions = [
      { value: 'every',  label: '每次' },
      { value: 'daily',  label: '每日一次' },
      { value: 'weekly', label: '每周一次' },
      { value: 'once',   label: '只触发一次' },
    ];

    // 引导类型可用规则
    const availMap = {
      unregistered: ['register'],
      registered:   ['deposit', 'spin', 'activity', 'profile', 'promo', 'invite'],
      deposited:    ['spin', 'activity', 'profile', 'promo', 'invite'],
      withdrawn:    ['spin', 'activity', 'profile', 'promo', 'invite'],
    };
    const isGuideAvail = (gType) => (availMap[guideDlg.form.status] || []).includes(gType);
    const guideTagText = (gType) => {
      if (!isGuideAvail(gType)) return '不适用';
      if (gType === 'register') return '仅限未注册';
      return '可用';
    };

    const onStatusChange = (val) => {
      guideDlg.form.status = val;
      // 若当前选中的引导类型在新状态下不可用，则清空
      if (guideDlg.form.guideType && !isGuideAvail(guideDlg.form.guideType)) {
        guideDlg.form.guideType = '';
      }
    };

    const openGuideDialog = (row) => {
      if (row) {
        guideDlg.isEdit  = true;
        guideDlg.editId  = row.id;
        guideDlg.form    = { status: row.status, guideType: row.guideType, freq: row.freq, cooldown: row.cooldown ? String(row.cooldown) : '' };
      } else {
        guideDlg.isEdit  = false;
        guideDlg.editId  = null;
        guideDlg.form    = { status: 'unregistered', guideType: 'register', freq: 'every', cooldown: '' };
      }
      guideDlg.visible = true;
    };

    const saveGuide = () => {
      if (!guideDlg.form.guideType) { ElMessage.warning('请选择引导类型'); return; }
      const now = MOCK_NOW;
      if (guideDlg.isEdit) {
        const r = guideRows.find(r => r.id === guideDlg.editId);
        if (r) Object.assign(r, { ...guideDlg.form, cooldown: Number(guideDlg.form.cooldown) || 0, opTime: now, operator: 'admin' });
        ElMessage.success('保存成功');
      } else {
        guideRows.push({
          id: _nextId++,
          ...guideDlg.form,
          cooldown: Number(guideDlg.form.cooldown) || 0,
          enabled: true,
          operator: 'admin',
          opTime: now,
        });
        ElMessage.success('新增成功');
      }
      guideDlg.visible = false;
    };

    const deleteGuide = (row) => {
      ElMessageBox.confirm('确定删除该引导配置？', '提示', { type: 'warning' })
        .then(() => {
          const i = guideRows.findIndex(r => r.id === row.id);
          if (i > -1) guideRows.splice(i, 1);
          ElMessage.success('已删除');
        }).catch(() => {});
    };

    /* ── 首页活动悬浮 ── */
    const AF_MIN = 3;
    const AF_MAX = 20;

    const afActTypeOptions = [
      { value: 'rebate',     label: '返水活动' },
      { value: 'deposit',    label: '存款优惠' },
      { value: 'newcomer',   label: '新人专享' },
      { value: 'vip',        label: 'VIP 专属' },
      { value: 'task',       label: '任务活动' },
      { value: 'tournament', label: '赛事活动' },
    ];

    const afActListMap = {
      rebate:     [{ id: 101, name: '日返水活动' }, { id: 102, name: '周返水活动' }, { id: 103, name: '高额返水回馈' }],
      deposit:    [{ id: 201, name: '首存 100% 红利' }, { id: 202, name: '次存 50% 红利' }, { id: 203, name: '周末加码存款' }],
      newcomer:   [{ id: 301, name: '新人 7 日礼包' }, { id: 302, name: '新人首充翻倍' }],
      vip:        [{ id: 401, name: 'VIP 升级礼' }, { id: 402, name: 'VIP 月俸禄' }, { id: 403, name: 'VIP 生日礼' }],
      task:       [{ id: 501, name: '每日签到' }, { id: 502, name: '每周任务' }],
      tournament: [{ id: 601, name: '彩票月度赛' }, { id: 602, name: '电子排行榜' }],
    };

    const afActTypeLabel = (t) => afActTypeOptions.find(o => o.value === t)?.label ?? t;
    const afActName = (t, id) => (afActListMap[t] || []).find(a => a.id === id)?.name ?? '—';

    let _afNextId = 100;
    const actFloatRows = reactive([
      { id: 11, icon: '🎁', actType: 'newcomer',   actId: 301, enabled: true,  operator: 'gario001', opTime: '2025-04-30 10:12:05' },
      { id: 12, icon: '💰', actType: 'rebate',     actId: 101, enabled: true,  operator: 'gario001', opTime: '2025-04-30 10:15:30' },
      { id: 13, icon: '🏆', actType: 'tournament', actId: 601, enabled: true,  operator: 'gario001', opTime: '2025-04-30 10:16:00' },
      { id: 14, icon: '👑', actType: 'vip',        actId: 401, enabled: false, operator: 'gario001', opTime: '2025-04-29 18:02:00' },
    ]);

    const afCount = computed(() => actFloatRows.length);
    const afCountTip = computed(() => {
      if (actFloatRows.length < AF_MIN) return { type: 'warn', text: `当前 ${actFloatRows.length} 项 · 至少配置 ${AF_MIN} 项才会在前端展示` };
      if (actFloatRows.length >= AF_MAX) return { type: 'full', text: `已达上限 ${AF_MAX} 项` };
      return { type: 'ok', text: `已配置 ${actFloatRows.length} / ${AF_MAX} 项` };
    });

    const afDlg = reactive({
      visible: false,
      isEdit: false,
      editId: null,
      form: { icon: '', actType: '', actId: '', enabled: true },
    });

    const afCurrentActList = computed(() => afActListMap[afDlg.form.actType] || []);

    const onAfActTypeChange = () => {
      // 切换活动类型，清空已选活动
      afDlg.form.actId = '';
    };

    const openAfDialog = (row) => {
      if (row) {
        afDlg.isEdit = true;
        afDlg.editId = row.id;
        afDlg.form = { icon: row.icon, actType: row.actType, actId: row.actId, enabled: row.enabled };
      } else {
        if (actFloatRows.length >= AF_MAX) { ElMessage.warning(`最多配置 ${AF_MAX} 项`); return; }
        afDlg.isEdit = false;
        afDlg.editId = null;
        afDlg.form = { icon: '', actType: '', actId: '', enabled: true };
      }
      afDlg.visible = true;
    };

    // el-upload before-upload 钩子：读成 base64 写回 form.icon，禁止真上传
    const afBeforeUpload = (file) => {
      const ok = /^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.type);
      if (!ok) { ElMessage.warning('仅支持 PNG / JPG / GIF / WebP / SVG'); return false; }
      if (file.size > 500 * 1024) { ElMessage.warning('图标不要超过 500KB'); return false; }
      const reader = new FileReader();
      reader.onload = (e) => { afDlg.form.icon = e.target.result; };
      reader.readAsDataURL(file);
      return false; // 阻止 el-upload 真发请求
    };

    const afClearIcon = () => { afDlg.form.icon = ''; };

    const saveAfRow = () => {
      if (!afDlg.form.icon)    { ElMessage.warning('请上传活动图标'); return; }
      if (!afDlg.form.actType) { ElMessage.warning('请选择活动类型'); return; }
      if (!afDlg.form.actId)   { ElMessage.warning('请选择关联活动'); return; }
      const now = MOCK_NOW;
      if (afDlg.isEdit) {
        const r = actFloatRows.find(r => r.id === afDlg.editId);
        if (r) Object.assign(r, { ...afDlg.form, operator: 'admin', opTime: now });
        ElMessage.success('保存成功');
      } else {
        if (actFloatRows.length >= AF_MAX) { ElMessage.warning(`最多配置 ${AF_MAX} 项`); return; }
        actFloatRows.push({
          id: _afNextId++,
          ...afDlg.form,
          operator: 'admin',
          opTime: now,
        });
        ElMessage.success('新增成功');
      }
      afDlg.visible = false;
    };

    const deleteAfRow = (row) => {
      ElMessageBox.confirm(
        actFloatRows.length <= AF_MIN
          ? `当前仅 ${actFloatRows.length} 项，删除后将低于最少 ${AF_MIN} 项，前端将不展示活动悬浮。确定删除？`
          : '确定删除该活动悬浮配置？',
        '提示', { type: 'warning' }
      ).then(() => {
        const i = actFloatRows.findIndex(r => r.id === row.id);
        if (i > -1) actFloatRows.splice(i, 1);
        ElMessage.success('已删除');
      }).catch(() => {});
    };

    // 拖拽排序
    const afDrag = reactive({ srcIdx: -1, overIdx: -1 });
    const afOnDragStart = (idx, ev) => {
      afDrag.srcIdx = idx;
      ev.dataTransfer.effectAllowed = 'move';
      // Firefox 需要 setData 才能触发 drag
      try { ev.dataTransfer.setData('text/plain', String(idx)); } catch (e) {}
    };
    const afOnDragOver = (idx, ev) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      afDrag.overIdx = idx;
    };
    const afOnDragLeave = (idx) => {
      if (afDrag.overIdx === idx) afDrag.overIdx = -1;
    };
    const afOnDrop = (idx) => {
      const s = afDrag.srcIdx;
      afDrag.srcIdx = -1;
      afDrag.overIdx = -1;
      if (s < 0 || s === idx) return;
      const [item] = actFloatRows.splice(s, 1);
      actFloatRows.splice(idx, 0, item);
    };
    const afOnDragEnd = () => {
      afDrag.srcIdx = -1;
      afDrag.overIdx = -1;
    };

    return {
      hsTab, hsTabs,
      guideGroups, statusLabel, statusColor, guideLabel, guideIcon, freqLabel,
      guideDlg, statusOptions, guideTypeOptions, freqOptions,
      isGuideAvail, guideTagText, onStatusChange,
      openGuideDialog, saveGuide, deleteGuide,

      AF_MIN, AF_MAX,
      actFloatRows, afCount, afCountTip,
      afActTypeOptions, afActTypeLabel, afActName, afCurrentActList,
      afDlg, onAfActTypeChange, afBeforeUpload, afClearIcon,
      openAfDialog, saveAfRow, deleteAfRow,
      afDrag, afOnDragStart, afOnDragOver, afOnDragLeave, afOnDrop, afOnDragEnd,
    };
  }
});

/* ========== 佣金配置 ========== */
const CommissionConfig = defineComponent({
  name: 'CommissionConfig',
  template: '#commission-config-tpl',
  setup() {
    const form = reactive({
      currency: 'INR',
      checkFirstDeposit: true,
      minFirstDeposit: '100',
      checkDeposit: true,
      minDeposit: '500',
      checkBet: true,
      minBet: '1000',
      checkDepositDays: true,
      minDepositDays: '3',
      checkDepositTimes: true,
      minDepositTimes: '5',
      sameIpMax: '2',
      activityTypes: ['新人', '充值'],
      activityCycle: 'permanent',
      cycleRange: [],
      statCycleAgent: 'total',
      statCycleRanking: 'natural',
      agentDistribute: 'manual',
      rankingDistribute: 'manual',
      agentExpiry: 'permanent',
      agentExpiryDays: '30',
      rankingExpiry: 'permanent',
      rankingExpiryDays: '30',
      enableDepositBet: true,
      dbLimit: 'unlimited',
      dbLimitAmount: '',
      enableReferral: true,
      enableRanking: true,
      rankingType: 'claim',
      prizes: ['200000', '18000', '16000', '14000', '12000', '10000', '8000', '6000', '5000', '4000'],
    });

    /* 存投佣金：不分级，单组比例 */
    const dbFlat = reactive({
      bet:     { enabled: true, l1: '0.12', l2: '0.08', l3: '0.05' },
      deposit: { enabled: true, l1: '0.50', l2: '0.30', l3: '0.15' },
    });

    /* 推荐佣金：梯度奖金配置，最多21条 */
    const refTiers = reactive([
      { members: '',    reward: '200'   },
      { members: '10',  reward: '2000'  },
      { members: '20',  reward: '5000'  },
      { members: '50',  reward: '10000' },
      { members: '80',  reward: '20000' },
      { members: '100', reward: '30000' },
      { members: '150', reward: '40000' },
    ]);
    const addRefTier = (afterIdx) => {
      if (refTiers.length >= 40) return;
      refTiers.splice(afterIdx + 1, 0, { members: '', reward: '' });
    };
    const delRefTier = (idx) => {
      if (refTiers.length <= 1) return;
      refTiers.splice(idx, 1);
    };

    const ccTab = ref('deposit-bet');
    const showValidCount = ref(false);

    const CURRENCY_SYMBOL = { INR:'₹', RUB:'₹', USD:'$', CNY:'₹', PHP:'₹', THB:'₹' };
    const currencySymbol = computed(() => CURRENCY_SYMBOL[form.currency] || form.currency);

    const ccSave   = () => ElMessage.success('保存成功');
    const ccCancel = () => ElMessage.info('已取消');

    return { form, dbFlat, refTiers, addRefTier, delRefTier, ccTab, showValidCount, currencySymbol, ccSave, ccCancel };
  }
});

/* ========== 预测系统组件 ========== */

const QuizList = defineComponent({
  name: 'QuizList',
  template: '#quiz-list-tpl',
  setup() {
    const { ElMessage, ElMessageBox } = ElementPlus;
    const QL_STATUS_MAP = {
      reviewing:   { label: '待审核', cls: 'qs-tag-reviewing' },
      pending_open:{ label: '待开始', cls: 'qs-tag-pending'   },
      open:        { label: '开盘中', cls: 'qs-tag-open'      },
      closed:      { label: '封盘',   cls: 'qs-tag-closed'    },
      announce:    { label: '公示中', cls: 'qs-tag-announce'  },
      arbitrating: { label: '仲裁中', cls: 'qs-tag-arbitrate' },
      settled:     { label: '已完结', cls: 'qs-tag-settled'   },
      rejected:    { label: '已驳回', cls: 'qs-tag-broken'    },
    };
    const qlMock = ref([
      {id:1,currency:'INR',name:'世界杯决赛冠军是哪支球队',cat:'sports',status:'open',warning:true,banker:'user_882',margin:8600,bets:214,deadline:'2025-07-15 20:00:00',created:'2025-03-01 10:22:00'},
      {id:2,currency:'INR',name:'2025 春晚收视率能否破8%',cat:'entertainment',status:'announce',banker:'user_341',margin:5000,bets:88,deadline:'2025-02-05 00:00:00',created:'2025-03-18 14:30:00'},
      {id:3,name:'NBA 总决赛 MVP 是谁',cat:'sports',status:'announce',banker:'user_120',margin:12000,bets:376,deadline:'2025-06-22 20:00:00',created:'2025-03-18 09:15:00'},
      {id:17,currency:'INR',name:'2025世界杯小组赛结果预测',cat:'sports',status:'pending_open',official:true,banker:'user_321',margin:8000,bets:0,deadline:'2025-06-30 20:00:00',created:'2025-03-25 11:40:00'},
      {id:4,name:'特斯拉 Q2 交付量超50万辆',cat:'finance',status:'open',banker:'user_567',margin:7500,bets:103,deadline:'2025-07-01 18:00:00',created:'2025-03-05 16:08:00'},
      {id:5,name:'奥斯卡最佳影片得主',cat:'entertainment',status:'open',warning:true,banker:'user_209',margin:3200,bets:57,deadline:'2025-03-10 08:00:00',created:'2025-03-05 10:33:00'},
      {id:6,name:'下届美联储主席人选',cat:'politics',status:'open',warning:true,banker:'user_744',margin:15000,bets:289,deadline:'2025-12-01 00:00:00',created:'2025-03-05 09:50:00'},
      {id:7,name:'A股年底能否破4000',cat:'finance',status:'open',banker:'user_312',margin:9000,bets:441,deadline:'2025-12-31 16:00:00',created:'2025-03-05 15:22:00'},
      {id:8,name:'iPhone 17 是否包含折叠屏',cat:'other',status:'reviewing',banker:'user_099',margin:0,bets:0,deadline:'2025-09-10 00:00:00',created:'2025-03-20 20:05:00'},
      {id:9,name:'欧冠决赛主场球队赢球',cat:'sports',status:'open',banker:'user_455',margin:6400,bets:198,deadline:'2025-05-31 22:00:00',created:'2025-03-05 13:44:00'},
      {id:10,name:'马斯克身家重回全球第一',cat:'finance',status:'reviewing',banker:'user_671',margin:0,bets:0,deadline:'2025-12-31 00:00:00',created:'2025-03-20 19:30:00'},
      {id:11,name:'某明星年内官宣恋情',cat:'entertainment',status:'open',banker:'user_233',margin:4200,bets:67,deadline:'2025-06-30 00:00:00',created:'2025-03-05 11:18:00'},
      {id:12,name:'2026世界杯举办城市确认',cat:'sports',status:'reviewing',banker:'user_810',margin:0,bets:0,deadline:'2025-08-01 00:00:00',created:'2025-03-20 08:55:00'},
      {id:13,name:'2025年诺贝尔和平奖得主',cat:'politics',status:'settled',endType:'normal',banker:'user_501',margin:8000,bets:312,deadline:'2025-10-10 18:00:00',created:'2025-01-15 14:20:00'},
      {id:14,name:'某争议赛事最终结果',cat:'sports',status:'settled',endType:'cancelled',banker:'user_302',margin:5000,bets:0,deadline:'2025-03-20 20:00:00',created:'2025-01-15 10:05:00'},
      {id:15,name:'比特币年底能否破10万美元',cat:'finance',status:'settled',endType:'normal',banker:'user_619',margin:20000,bets:891,deadline:'2025-12-31 00:00:00',created:'2025-01-15 09:30:00'},
      {id:16,name:'某明星婚讯预测',cat:'entertainment',status:'settled',endType:'cancelled',banker:'user_177',margin:3000,bets:0,deadline:'2025-05-01 00:00:00',created:'2025-01-15 16:44:00'},
      {id:18,currency:'INR',name:'某网络赛事结果预测',cat:'sports',status:'rejected',endType:'rejected',banker:'user_440',margin:0,bets:0,deadline:'2025-04-15 20:00:00',created:'2025-03-22 17:10:00'},
      {id:19,currency:'INR',name:'明星真人秀冠军预测',cat:'entertainment',status:'rejected',endType:'rejected',banker:'user_653',margin:0,bets:0,deadline:'2025-05-10 00:00:00',created:'2025-03-23 12:28:00'},
    ]);
    const qlStatus = ref('all');
    const qlFilter = reactive({ cat:'', id:'', currency:'', kw:'', endType:'', dateRange:[] });
    const qlPage = ref(1);
    const QL_PS = 8;
    const qlSelIds = ref([]);
    const qlStatusMap = QL_STATUS_MAP;

    const qlStatusTabs = computed(() => {
      const c = {};
      qlMock.value.forEach(r => { c[r.status] = (c[r.status]||0)+1; });
      return [
        {key:'all',         label:'全部',   count:qlMock.value.length},
        {key:'reviewing',   label:'待审核', count:c.reviewing||0},
        {key:'pending_open',label:'待开始', count:c.pending_open||0},
        {key:'open',        label:'开盘中', count:c.open||0},
        {key:'closed',      label:'封盘',   count:c.closed||0},
        {key:'announce',    label:'公示中', count:c.announce||0},
        {key:'settled',     label:'已完结', count:(c.settled||0)+(c.rejected||0)},
      ];
    });

    const QL_BATCH_TABS = ['reviewing', 'pending_open', 'open'];

    const qlFiltered = computed(() => {
      const { cat, id, currency, kw, endType, dateRange } = qlFilter;
      return qlMock.value.filter(r => {
        if (qlStatus.value === 'settled' && !['settled','rejected'].includes(r.status)) return false;
        if (qlStatus.value !== 'all' && qlStatus.value !== 'settled' && r.status !== qlStatus.value) return false;
        if (cat && r.cat !== cat) return false;
        if (id && !String(r.id).includes(id)) return false;
        if (currency && currency !== 'INR') return false;
        if (kw && !r.name.toLowerCase().includes(kw.toLowerCase())) return false;
        if (endType && r.endType !== endType) return false;
        if (dateRange?.[0] && r.deadline.slice(0,10) < dateRange[0]) return false;
        if (dateRange?.[1] && r.deadline.slice(0,10) > dateRange[1]) return false;
        return true;
      });
    });

    const qlTotalPages = computed(() => Math.max(1, Math.ceil(qlFiltered.value.length / QL_PS)));
    const qlPageData = computed(() => qlFiltered.value.slice((qlPage.value-1)*QL_PS, qlPage.value*QL_PS));
    const qlAllSelected = computed(() => qlPageData.value.length > 0 && qlPageData.value.every(r => qlSelIds.value.includes(r.id)));
    const qlSomeSelected = computed(() => qlSelIds.value.length > 0 && !qlAllSelected.value);
    const qlToggleAll = (v) => { qlSelIds.value = v ? qlPageData.value.map(r=>r.id) : []; };
    const qlToggleRow = (id, v) => {
      if (v) { if (!qlSelIds.value.includes(id)) qlSelIds.value.push(id); }
      else qlSelIds.value = qlSelIds.value.filter(x => x !== id);
    };

    const qlReviewDlg = reactive({ visible:false, item:null, action:'', reason:'' });
    const qlOpenReview = (row) => { qlReviewDlg.item=row; qlReviewDlg.action=''; qlReviewDlg.reason=''; qlReviewDlg.visible=true; };
    const qlSubmitReview = () => {
      if (!qlReviewDlg.action) { ElMessage.warning('请选择审核决定'); return; }
      if (qlReviewDlg.action==='reject' && !qlReviewDlg.reason.trim()) { ElMessage.warning('请填写驳回原因'); return; }
      const item = qlMock.value.find(r => r.id === qlReviewDlg.item.id);
      item.status = qlReviewDlg.action==='approve' ? 'pending_open' : 'rejected';
      qlReviewDlg.visible = false;
      ElMessage.success(qlReviewDlg.action==='approve' ? '已通过，预测进入"待开始"状态' : '已驳回，庄家将收到通知');
    };
    // ── 详情 Drawer ──
    const QL_DEMO_STATUSES = [
      {key:'reviewing',  label:'待审核'}, {key:'pending_open',label:'待开始'},
      {key:'open',       label:'开盘中'}, {key:'open_warning',label:'开盘中(预警)'},
      {key:'closed',     label:'封盘'},   {key:'announce',    label:'公示中'},
      {key:'arbitrating',label:'仲裁中'}, {key:'settled',     label:'已结算'},
      {key:'cancelled',  label:'已取消'}, {key:'rejected',    label:'已驳回'},
    ];
    const QL_DLG_SM = {
      reviewing:   {label:'待审核',  cls:'qs-tag-reviewing'},
      pending_open:{label:'待开始',  cls:'qs-tag-pending'},
      open:        {label:'开盘中',  cls:'qs-tag-open'},
      open_warning:{label:'开盘中',  cls:'qs-tag-open'},
      closed:      {label:'封盘',    cls:'qs-tag-closed'},
      announce:    {label:'公示中',  cls:'qs-tag-announce'},
      arbitrating: {label:'仲裁中',  cls:'qs-tag-arbitrate'},
      settled:     {label:'已完结',  cls:'qs-tag-settled'},
      cancelled:   {label:'已完结',  cls:'qs-tag-settled'},
      rejected:    {label:'已驳回',  cls:'qs-tag-broken'},
    };
    const QL_DETAIL_OPTS = [
      {name:'巴西队夺冠',  initOdds:'2.50', odds:'3.20', bet:'2,680', pay:'8,576', changes:2},
      {name:'法国队夺冠',  initOdds:'2.20', odds:'2.50', bet:'1,920', pay:'4,800', changes:1},
      {name:'阿根廷队夺冠',initOdds:'2.80', odds:'2.80', bet:'1,400', pay:'3,920', changes:0},
      {name:'其他球队',    initOdds:'15.00',odds:'8.00', bet:'340',   pay:'2,720', changes:3},
    ];
    const QL_DETAIL_ORDERS = [
      {id:'8821',user:'user_1102',opt:'巴西队夺冠',  bet:'500',  odds:'3.20',pay:'1,600',time:'03-31 14:18'},
      {id:'8820',user:'user_0443',opt:'法国队夺冠',  bet:'200',  odds:'2.50',pay:'500',  time:'03-31 14:10'},
      {id:'8819',user:'user_2291',opt:'巴西队夺冠',  bet:'1,000',odds:'3.20',pay:'3,200',time:'03-31 13:55'},
      {id:'8818',user:'user_0887',opt:'其他球队',    bet:'100',  odds:'8.00',pay:'800',  time:'03-31 13:40'},
      {id:'8817',user:'user_3341',opt:'阿根廷队夺冠',bet:'300',  odds:'2.80',pay:'840',  time:'03-31 13:22'},
      {id:'8816',user:'user_5512',opt:'巴西队夺冠',  bet:'800',  odds:'3.20',pay:'2,560',time:'03-31 12:58'},
      {id:'8815',user:'user_0021',opt:'法国队夺冠',  bet:'500',  odds:'2.50',pay:'1,250',time:'03-31 12:33'},
      {id:'8814',user:'user_7734',opt:'巴西队夺冠',  bet:'200',  odds:'3.20',pay:'640',  time:'03-31 12:10'},
      {id:'8813',user:'user_4490',opt:'其他球队',    bet:'50',   odds:'8.00',pay:'400',  time:'03-31 11:50'},
      {id:'8812',user:'user_1876',opt:'阿根廷队夺冠',bet:'1,000',odds:'2.80',pay:'2,800',time:'03-31 11:22'},
      {id:'8811',user:'user_3309',opt:'巴西队夺冠',  bet:'600',  odds:'3.20',pay:'1,920',time:'03-31 10:55'},
      {id:'8810',user:'user_6612',opt:'法国队夺冠',  bet:'400',  odds:'2.50',pay:'1,000',time:'03-31 10:30'},
      {id:'8809',user:'user_8801',opt:'巴西队夺冠',  bet:'300',  odds:'3.20',pay:'960',  time:'03-31 10:05'},
      {id:'8808',user:'user_2200',opt:'其他球队',    bet:'150',  odds:'8.00',pay:'1,200',time:'03-31 09:48'},
      {id:'8807',user:'user_5500',opt:'阿根廷队夺冠',bet:'500',  odds:'2.80',pay:'1,400',time:'03-31 09:20'},
    ];
    const QL_ODDS_LOG = {
      '巴西队夺冠':[{time:'2025-03-15 10:22',before:'2.80',after:'3.20',op:'庄家 user_882'},{time:'2025-03-10 08:05',before:'2.50',after:'2.80',op:'庄家 user_882'}],
      '法国队夺冠':[{time:'2025-03-12 14:30',before:'2.20',after:'2.50',op:'庄家 user_882'}],
      '其他球队':  [{time:'2025-03-20 09:11',before:'10.00',after:'8.00',op:'庄家 user_882'},{time:'2025-03-14 16:45',before:'12.00',after:'10.00',op:'庄家 user_882'},{time:'2025-03-08 11:22',before:'15.00',after:'12.00',op:'庄家 user_882'}],
    };
    const DL_ORDER_PS = 8;
    const qlDetailDlg = reactive({
      visible: false, item: null, status: 'open',
      reviewAction: '', reviewReason: '',
      orderPage: 1,
      cancelVisible: false, cancelReason: '',
    });
    const qlOddsDlg = reactive({ visible: false, option: '' });
    const qlImgDlg  = reactive({ visible: false, src: '' });
    const qlPreviewImg = (src) => { qlImgDlg.src = src; qlImgDlg.visible = true; };
    const qlDetailOpts = QL_DETAIL_OPTS;
    const qlDetailOrders = QL_DETAIL_ORDERS;
    const qlDetailOrderPages = computed(() => Math.max(1, Math.ceil(QL_DETAIL_ORDERS.length / DL_ORDER_PS)));
    const qlDetailOrderPage = computed(() => QL_DETAIL_ORDERS.slice((qlDetailDlg.orderPage-1)*DL_ORDER_PS, qlDetailDlg.orderPage*DL_ORDER_PS));
    const qlOddsLog = QL_ODDS_LOG;
    const qlDemoStatuses = QL_DEMO_STATUSES;
    const qlDlgSM = QL_DLG_SM;
    const qlCloseIcon = ElementPlusIconsVue.Close;

    const qlOpenDetail = (row) => {
      qlDetailDlg.item = row;
      qlDetailDlg.status = row.status === 'settled' && row.endType === 'cancelled' ? 'cancelled'
        : row.status === 'rejected' ? 'rejected'
        : (row.status||'open');
      qlDetailDlg.reviewAction = '';
      qlDetailDlg.reviewReason = '';
      qlDetailDlg.orderPage = 1;
      qlDetailDlg.cancelReason = '';
      qlDetailDlg.visible = true;
    };
    const qlDetailSubmitReview = async () => {
      if (!qlDetailDlg.reviewAction) { ElMessage.warning('请选择审核决定'); return; }
      if (qlDetailDlg.reviewAction==='reject' && !qlDetailDlg.reviewReason.trim()) { ElMessage.warning('请填写驳回原因'); return; }
      try {
        await ElMessageBox.confirm(
          qlDetailDlg.reviewAction==='approve' ? '确认通过该预测？通过后进入"待开始"状态，到达开盘时间后自动开盘。' : `确认驳回？保证金将原路退回庄家，此操作不可撤销。`,
          qlDetailDlg.reviewAction==='approve' ? '确认通过' : '确认驳回',
          { type: qlDetailDlg.reviewAction==='approve'?'warning':'error', confirmButtonText:'确认', cancelButtonText:'取消' }
        );
        const item = qlMock.value.find(r=>r.id===qlDetailDlg.item.id);
        if (item) item.status = qlDetailDlg.reviewAction==='approve' ? 'pending_open' : 'rejected';
        qlDetailDlg.visible = false;
        ElMessage.success(qlDetailDlg.reviewAction==='approve' ? '已通过，预测进入"待开始"状态' : '已驳回，保证金将原路退回庄家');
      } catch {}
    };
    const qlDetailForceCancel = () => { qlDetailDlg.cancelReason=''; qlDetailDlg.cancelVisible=true; };
    const qlDetailSubmitCancel = () => {
      if (!qlDetailDlg.cancelReason.trim()) { ElMessage.warning('请填写取消原因'); return; }
      const item = qlMock.value.find(r=>r.id===qlDetailDlg.item.id);
      if (item) { item.status='settled'; item.endType='cancelled'; }
      qlDetailDlg.cancelVisible = false;
      qlDetailDlg.visible = false;
      ElMessage.success('已强制取消，全额退款处理中');
    };
    const qlForceCancel = async (row) => {
      try {
        await ElMessageBox.confirm(`确认强制取消「${row.name}」？\n执行后所有已成交订单全额退款，此操作不可撤销。`, '强制取消确认', {
          confirmButtonText:'确认取消', cancelButtonText:'返回', type:'warning',
        });
        const item = qlMock.value.find(r => r.id===row.id);
        item.status='settled'; item.endType='cancelled';
        ElMessage.success('已强制取消，全额退款处理中');
      } catch {}
    };
    const qlResetFilter = () => {
      Object.assign(qlFilter, {cat:'',id:'',currency:'',kw:'',endType:'',dateRange:[]});
      qlStatus.value='all'; qlPage.value=1;
    };
    // 列设置
    const qlCols = ref([
      {key:'id',       label:'预测ID',   visible:true, required:true},
      {key:'name',     label:'预测标题', visible:true},
      {key:'cat',      label:'分类',     visible:true},
      {key:'status',   label:'状态',     visible:true},
      {key:'banker',   label:'庄家',     visible:true},
      {key:'currency', label:'币种',     visible:true},
      {key:'margin',   label:'保证金',   visible:true},
      {key:'bets',     label:'投注笔数', visible:true},
      {key:'deadline', label:'截止时间', visible:true},
      {key:'actions',  label:'操作',     visible:true, required:true},
    ]);
    const qlColVis = (key) => qlCols.value.find(c=>c.key===key)?.visible ?? true;
    const qlAllCols = computed(() => qlCols.value.every(c=>c.visible));
    const qlSomeCols = computed(() => qlCols.value.some(c=>c.visible) && !qlAllCols.value);
    const qlToggleAllCols = (v) => qlCols.value.forEach(c => { c.visible = v; });
    const qlVisibleCount = computed(() => qlCols.value.filter(c=>c.visible).length + (QL_BATCH_TABS.includes(qlStatus.value) ? 1 : 0));

    // ── 批量操作 ──
    const qlBatchDlg = reactive({ visible:false, action:'', reason:'', count:0 });
    const qlCheckSel = () => { if (!qlSelIds.value.length) { ElMessage.warning('请先勾选数据'); return false; } return true; };
    const qlBatchApprove = () => {
      if (!qlCheckSel()) return;
      const list = qlMock.value.filter(r => qlSelIds.value.includes(r.id) && r.status === 'reviewing');
      if (!list.length) { ElMessage.warning('选中项中无待审核状态的预测'); return; }
      list.forEach(r => r.status = 'pending_open');
      qlSelIds.value = [];
      ElMessage.success(`已批量通过 ${list.length} 道预测，进入"待开始"状态`);
    };
    const qlBatchReject = () => {
      if (!qlCheckSel()) return;
      const list = qlMock.value.filter(r => qlSelIds.value.includes(r.id) && r.status === 'reviewing');
      if (!list.length) { ElMessage.warning('选中项中无待审核状态的预测'); return; }
      qlBatchDlg.action = 'reject'; qlBatchDlg.count = list.length; qlBatchDlg.reason = ''; qlBatchDlg.visible = true;
    };
    const qlBatchForceCancel = () => {
      if (!qlCheckSel()) return;
      const list = qlMock.value.filter(r => qlSelIds.value.includes(r.id) && ['open','pending_open'].includes(r.status));
      if (!list.length) { ElMessage.warning('选中项中无可强制取消的预测'); return; }
      qlBatchDlg.action = 'cancel'; qlBatchDlg.count = list.length; qlBatchDlg.reason = ''; qlBatchDlg.visible = true;
    };
    const qlBatchNotifyWarning = () => {
      if (!qlCheckSel()) return;
      const list = qlMock.value.filter(r => qlSelIds.value.includes(r.id) && r.status === 'open' && r.warning);
      if (!list.length) { ElMessage.warning('选中项中无保证金预警的预测'); return; }
      ElMessage.success(`已向 ${list.length} 位庄家发送补充保证金通知`);
      qlSelIds.value = [];
    };
    const qlSubmitBatch = () => {
      if (!qlBatchDlg.reason.trim()) { ElMessage.warning('请填写原因'); return; }
      if (qlBatchDlg.action === 'reject') {
        const list = qlMock.value.filter(r => qlSelIds.value.includes(r.id) && r.status === 'reviewing');
        list.forEach(r => { r.status = 'rejected'; r.endType = 'rejected'; });
        ElMessage.success(`已批量驳回 ${list.length} 道预测`);
      } else if (qlBatchDlg.action === 'cancel') {
        const list = qlMock.value.filter(r => qlSelIds.value.includes(r.id) && ['open','pending_open'].includes(r.status));
        list.forEach(r => { r.status = 'settled'; r.endType = 'cancelled'; });
        ElMessage.success(`已强制取消 ${list.length} 道预测，全额退款处理中`);
      }
      qlSelIds.value = [];
      qlBatchDlg.visible = false;
    };

    return {
      qlStatus, qlFilter, qlPage, qlStatusMap, qlStatusTabs,
      qlFiltered, qlTotalPages, qlPageData,
      qlBatchTabs: QL_BATCH_TABS,
      qlAllSelected, qlSomeSelected, qlSelIds, qlToggleAll, qlToggleRow,
      qlBatchDlg, qlBatchApprove, qlBatchReject, qlBatchForceCancel, qlBatchNotifyWarning, qlSubmitBatch,
      qlReviewDlg, qlOpenReview, qlSubmitReview, qlOpenDetail, qlForceCancel, qlResetFilter,
      qlDetailDlg, qlOddsDlg, qlDetailOpts, qlDetailOrders, qlDetailOrderPages, qlDetailOrderPage,
      qlOddsLog, qlDemoStatuses, qlDlgSM, qlCloseIcon,
      qlDetailSubmitReview, qlDetailForceCancel, qlDetailSubmitCancel,
      qlImgDlg, qlPreviewImg,
      qlCols, qlColVis, qlAllCols, qlSomeCols, qlToggleAllCols, qlVisibleCount,
      Search: ElementPlusIconsVue.Search, Refresh: ElementPlusIconsVue.Refresh, Download: ElementPlusIconsVue.Download,
      Operation: ElementPlusIconsVue.Operation,
    };
  }
});

const QuizBet = defineComponent({
  name: 'QuizBet',
  template: '#quiz-bet-tpl',
  setup() {
    const BR_MOCK = ref([
      {id:'20250307',currency:'INR',uid:'user_1102',qid:'1024',topic:'世界杯决赛冠军是哪支球队',option:'巴西队夺冠',amount:500,odds:3.20,pay:1600,time:'2025-03-31 14:18:00',result:'win'},
      {id:'20250314',currency:'INR',uid:'user_0443',qid:'1024',topic:'世界杯决赛冠军是哪支球队',option:'法国队夺冠',amount:200,odds:2.50,pay:500,time:'2025-03-31 14:10:00',result:'lose'},
      {id:'20250321',currency:'INR',uid:'user_2291',qid:'1024',topic:'世界杯决赛冠军是哪支球队',option:'巴西队夺冠',amount:1000,odds:3.20,pay:3200,time:'2025-03-31 13:55:00',result:'win'},
      {id:'20250328',currency:'INR',uid:'user_0887',qid:'1024',topic:'世界杯决赛冠军是哪支球队',option:'其他球队',amount:100,odds:8.00,pay:800,time:'2025-03-31 13:40:00',result:'lose'},
      {id:'20250335',currency:'INR',uid:'user_3341',qid:'1025',topic:'NBA 总决赛 MVP 是谁',option:'勒布朗·詹姆斯',amount:300,odds:2.80,pay:840,time:'2025-03-30 16:22:00',result:'pending'},
      {id:'20250342',currency:'INR',uid:'user_5512',qid:'1025',topic:'NBA 总决赛 MVP 是谁',option:'斯蒂芬·库里',amount:800,odds:3.50,pay:2800,time:'2025-03-30 15:44:00',result:'pending'},
      {id:'20250349',currency:'INR',uid:'user_0021',qid:'1026',topic:'2025 春晚收视率能否破8%',option:'未破8%',amount:500,odds:1.80,pay:900,time:'2025-03-29 11:30:00',result:'refund'},
      {id:'20250356',currency:'INR',uid:'user_7734',qid:'1026',topic:'2025 春晚收视率能否破8%',option:'破8%',amount:200,odds:2.20,pay:440,time:'2025-03-29 10:05:00',result:'refund'},
      {id:'20250363',currency:'INR',uid:'user_4490',qid:'1027',topic:'A股年底能否破4000',option:'破4000',amount:1000,odds:2.00,pay:2000,time:'2025-03-28 20:11:00',result:'pending'},
      {id:'20250370',currency:'INR',uid:'user_1876',qid:'1027',topic:'A股年底能否破4000',option:'未破4000',amount:600,odds:1.90,pay:1140,time:'2025-03-28 19:30:00',result:'pending'},
      {id:'20250377',currency:'INR',uid:'user_3309',qid:'1028',topic:'奥斯卡最佳影片得主',option:'《沙丘2》',amount:400,odds:2.50,pay:1000,time:'2025-03-27 14:55:00',result:'win'},
      {id:'20250384',currency:'INR',uid:'user_6612',qid:'1028',topic:'奥斯卡最佳影片得主',option:'《奥本海默》',amount:300,odds:3.00,pay:900,time:'2025-03-27 13:20:00',result:'lose'},
    ]);
    const brFilter = reactive({ uid:'', qid:'', currency:'', result:'', dateRange:[] });
    const brPage = ref(1);
    const BR_PS = 10;
    const brFiltered = computed(() => {
      const { uid, qid, currency, result, dateRange } = brFilter;
      return BR_MOCK.value.filter(r => {
        if (uid && !r.uid.toLowerCase().includes(uid.toLowerCase())) return false;
        if (qid && !r.qid.includes(qid)) return false;
        if (currency && currency !== 'INR') return false;
        if (result && r.result !== result) return false;
        if (dateRange?.[0] && r.time.slice(0,10) < dateRange[0]) return false;
        if (dateRange?.[1] && r.time.slice(0,10) > dateRange[1]) return false;
        return true;
      });
    });
    const brTotalPages = computed(() => Math.max(1, Math.ceil(brFiltered.value.length / BR_PS)));
    const brPageData = computed(() => brFiltered.value.slice((brPage.value-1)*BR_PS, brPage.value*BR_PS));
    const brReset = () => { Object.assign(brFilter,{uid:'',qid:'',currency:'',result:'',dateRange:[]}); brPage.value=1; };

    // 列设置
    const brCols = ref([
      {key:'id',      label:'订单号',   visible:true,  required:true},
      {key:'uid',     label:'用户',     visible:true},
      {key:'qid',     label:'预测ID',   visible:true},
      {key:'topic',   label:'预测标题', visible:true},
      {key:'option',  label:'投注选项', visible:true},
      {key:'currency',label:'币种',     visible:true},
      {key:'amount',  label:'投注金额', visible:true},
      {key:'odds',    label:'赔率',     visible:true},
      {key:'pay',     label:'输赢金额', visible:true},
      {key:'time',    label:'投注时间', visible:true},
      {key:'result',  label:'结果',     visible:true},
    ]);
    const brColVis = (key) => brCols.value.find(c=>c.key===key)?.visible ?? true;
    const brAllCols = computed(() => brCols.value.every(c=>c.visible));
    const brSomeCols = computed(() => brCols.value.some(c=>c.visible) && !brAllCols.value);
    const brToggleAllCols = (v) => brCols.value.forEach(c => { c.visible = v; });
    const brVisibleCount = computed(() => brCols.value.filter(c=>c.visible).length);

    return { brFilter, brPage, brFiltered, brTotalPages, brPageData, brReset,
      brCols, brColVis, brAllCols, brSomeCols, brToggleAllCols, brVisibleCount,
      Search: ElementPlusIconsVue.Search, Refresh: ElementPlusIconsVue.Refresh,
      Download: ElementPlusIconsVue.Download, Operation: ElementPlusIconsVue.Operation };
  }
});

const QuizArb = defineComponent({
  name: 'QuizArb',
  template: '#quiz-arb-tpl',
  setup() {
    const { ElMessage } = ElementPlus;
    const arbTab = ref('all');
    const arbFilter = reactive({ kw:'', qid:'', currency:'' });
    const arbCases = ref([
      {id:1,type:'dispute',name:'2025 春晚收视率能否破8%',
       result:'未破8%',
       resultDesc:'CSM 全国网收视率统计为 7.6%，未达到 8% 阈值，判定「未破8%」。',
       resultSource:'CSM 媒介研究·全国网 2025-02-09 收视日报',
       resultImg:'https://picsum.photos/seed/res1/900/580',
       resultTime:'2025-03-31 12:30:00',
       disputes:[
         {user:'user_441',text:'第三方数据显示 8.2%，要求复核。',time:'2025-03-31 22:10:00',img:'https://picsum.photos/seed/arb1/900/580'},
         {user:'user_512',text:'酷云实时收视同样显示破 8%，庄家结果有误。',time:'2025-04-01 08:05:00',img:''},
         {user:'user_733',text:'请平台以官方权威口径复核后再结算。',time:'2025-04-01 09:20:00',img:'https://picsum.photos/seed/arb1b/900/580'},
       ],
       announceDeadline:'2025-04-01 10:00:00',announceUrgent:true,opts:['破8%','未破8%'],bets:88,pool:14200},
      {id:2,type:'dispute',name:'下届美联储主席人选',
       result:'鲍威尔连任',
       resultDesc:'白宫官网已公布提名，鲍威尔继续连任美联储主席。',
       resultSource:'白宫官网 2025-03-28 新闻稿',
       resultImg:'https://picsum.photos/seed/res2/900/580',
       resultTime:'2025-04-02 09:00:00',
       disputes:[
         {user:'user_744',text:'官方尚未正式宣布，结果不成立。',time:'2025-04-02 14:30:00',img:'https://picsum.photos/seed/arb2/900/580'},
       ],
       announceDeadline:'2025-04-03 18:00:00',announceUrgent:false,opts:['鲍威尔连任','其他人选'],bets:289,pool:38600},
      {id:3,type:'overdue',name:'NBA 总决赛 MVP 是谁',lastDrawTime:'2025-03-31 12:00:00',overdueHours:26,opts:['勒布朗·詹姆斯','斯蒂芬·库里','其他球员'],bets:376,pool:52000},
      {id:4,type:'overdue',name:'奥斯卡最佳影片得主',lastDrawTime:'2025-03-30 20:00:00',overdueHours:38,opts:['《沙丘2》','《奥本海默》','其他'],bets:57,pool:8400},
    ]);
    const arbFiltered = computed(() => {
      const { kw, qid } = arbFilter;
      return arbCases.value.filter(c => {
        if (arbTab.value !== 'all' && c.type !== arbTab.value) return false;
        if (kw && !c.name.toLowerCase().includes(kw.toLowerCase())) return false;
        return true;
      });
    });
    const arbDlg = reactive({ visible:false, case:null, action:'', winner:'', reason:'' });
    const arbOpenRuling = (c) => { arbDlg.case=c; arbDlg.action=''; arbDlg.winner=''; arbDlg.reason=''; arbDlg.visible=true; };
    const arbImgDlg = reactive({ visible:false, src:'' });
    const arbPreviewImg = (src) => { arbImgDlg.src=src; arbImgDlg.visible=true; };
    const arbSubmit = () => {
      if (!arbDlg.action) { ElMessage.warning('请选择仲裁操作'); return; }
      if (!arbDlg.reason.trim()) { ElMessage.warning('请填写仲裁理由'); return; }
      if (arbDlg.action==='overturn' && !arbDlg.winner) { ElMessage.warning('请选择获胜选项'); return; }
      arbCases.value = arbCases.value.filter(c => c.id !== arbDlg.case.id);
      arbDlg.visible = false;
      const msg = {confirm:'已确认庄家结果，触发结算',overturn:'已指定获胜选项，触发结算',refund:'已裁定平局退款'}[arbDlg.action];
      ElMessage.success(msg);
    };
    return { arbTab, arbFilter, arbCases, arbFiltered, arbDlg, arbOpenRuling, arbSubmit, arbImgDlg, arbPreviewImg,
      Search: ElementPlusIconsVue.Search, Refresh: ElementPlusIconsVue.Refresh, Operation: ElementPlusIconsVue.Operation };
  }
});

const QuizFinance = defineComponent({
  name: 'QuizFinance',
  template: '#quiz-finance-tpl',
  setup() {
    const QF_TC = {
      payout: { label:'用户获奖',   color:'#52c41a', prefix:'+' },
      margin: { label:'保证金充值', color:'#409eff', prefix:'+' },
      rake:   { label:'平台抽水',   color:'#fa8c16', prefix:'+' },
      refund: { label:'退款',       color:'#ff4d4f', prefix:'-' },
      penalty:{ label:'超时罚没',   color:'#722ed1', prefix:'+' },
    };
    const QF_MOCK = ref([
      {id:'20250331002',currency:'INR',type:'rake',   qid:'1025',topic:'NBA 总决赛 MVP',    user:'平台', amount:840,  time:'2025-03-31 14:30:00'},
      {id:'20250328002',currency:'INR',type:'rake',   qid:'1031',topic:'春晚收视率',        user:'平台', amount:420,  time:'2025-03-28 10:30:00'},
      {id:'20250327003',currency:'INR',type:'rake',   qid:'1029',topic:'欧冠决赛主场赢球',  user:'平台', amount:560,  time:'2025-03-27 22:10:00'},
      {id:'20250325001',currency:'INR',type:'penalty',qid:'1033',topic:'欧洲杯决赛进球数',  user:'平台', amount:38000,time:'2025-03-25 18:30:00'},
      {id:'20250322001',currency:'INR',type:'penalty',qid:'1034',topic:'某英超赛事比分',    user:'平台', amount:12000,time:'2025-03-22 09:15:00'},
    ]);
    const qfFilter = reactive({ type:'', title:'', currency:'', qid:'', oid:'', dateRange:[] });
    const qfPage = ref(1);
    const QF_PS = 10;
    const qfFiltered = computed(() => {
      const { type, title, currency, qid, oid, dateRange } = qfFilter;
      return QF_MOCK.value.filter(r => {
        if (type && r.type !== type) return false;
        if (title && !r.topic.toLowerCase().includes(title.toLowerCase())) return false;
        if (currency && currency !== 'INR') return false;
        if (qid && !r.qid.includes(qid)) return false;
        if (oid && !r.id.includes(oid)) return false;
        if (dateRange?.[0] && r.time.slice(0,10) < dateRange[0]) return false;
        if (dateRange?.[1] && r.time.slice(0,10) > dateRange[1]) return false;
        return true;
      });
    });
    const qfTotalPages = computed(() => Math.max(1, Math.ceil(qfFiltered.value.length / QF_PS)));
    const qfPageData = computed(() => qfFiltered.value.slice((qfPage.value-1)*QF_PS, qfPage.value*QF_PS));
    const qfReset = () => { Object.assign(qfFilter,{type:'',title:'',currency:'',qid:'',oid:'',dateRange:[]}); qfPage.value=1; };
    const qfCols = ref([
      {key:'id',       label:'订单号',   visible:true, required:true},
      {key:'topic',    label:'预测标题', visible:true},
      {key:'qid',      label:'预测ID',   visible:true},
      {key:'type',     label:'类型',     visible:true},
      {key:'user',     label:'用户/庄家',visible:true},
      {key:'currency', label:'币种',     visible:true},
      {key:'amount',   label:'金额',     visible:true},
      {key:'time',     label:'时间',     visible:true},
    ]);
    const qfColVis = (key) => qfCols.value.find(c=>c.key===key)?.visible ?? true;
    const qfAllCols = computed(() => qfCols.value.every(c=>c.visible));
    const qfSomeCols = computed(() => qfCols.value.some(c=>c.visible) && !qfAllCols.value);
    const qfToggleAllCols = (v) => qfCols.value.forEach(c => { c.visible = v; });
    const qfVisibleCount = computed(() => qfCols.value.filter(c=>c.visible).length);
    return { qfFilter, qfPage, qfFiltered, qfTotalPages, qfPageData, qfReset, qfTC: QF_TC,
      qfCols, qfColVis, qfAllCols, qfSomeCols, qfToggleAllCols, qfVisibleCount,
      Search: ElementPlusIconsVue.Search, Refresh: ElementPlusIconsVue.Refresh,
      Download: ElementPlusIconsVue.Download, Operation: ElementPlusIconsVue.Operation };
  }
});

const QuizSettings = defineComponent({
  name: 'QuizSettings',
  template: '#quiz-settings-tpl',
  setup() {
    const { ElMessage } = ElementPlus;
    const qsTab = ref('params');
    const qsParams = reactive({ max:10000, min:10, margin:1000, marginMax:200000, ann:48, warnPct:10, rake:5, playerWinAudit:1, bankerWinAudit:1 });
    const qsCats = ref([
      {id:1,name:'体育',  displayName:'Sports',        displayNameEn:'Sports',         displayNameZh:'体育',    displayNameTh:'กีฬา',        displayNamePh:'Palakasan',  count:82,active:true, operator:'ops03',opTime:'2025-03-20 10:15:00'},
      {id:2,name:'娱乐',  displayName:'Entertainment', displayNameEn:'Entertainment',  displayNameZh:'娱乐',    displayNameTh:'บันเทิง',     displayNamePh:'Entertainment',count:64,active:true, operator:'ops03',opTime:'2025-03-18 14:30:00'},
      {id:3,name:'财经',  displayName:'Finance',       displayNameEn:'Finance',        displayNameZh:'财经',    displayNameTh:'การเงิน',     displayNamePh:'Pananalapi', count:51,active:false,operator:'nami001', opTime:'2025-03-15 09:22:00'},
      {id:4,name:'时事',  displayName:'Current Events',displayNameEn:'Current Events', displayNameZh:'时事',    displayNameTh:'เหตุการณ์ปัจจุบัน',displayNamePh:'Kasalukuyang Kaganapan',count:38,active:true, operator:'ops03',opTime:'2025-03-10 16:44:00'},
      {id:5,name:'游戏',  displayName:'Gaming',        displayNameEn:'Gaming',         displayNameZh:'游戏',    displayNameTh:'เกมส์',       displayNamePh:'Paglalaro', count:22,active:false,operator:'nami001', opTime:'2025-03-08 11:20:00'},
      {id:6,name:'其他',  displayName:'Others',        displayNameEn:'Others',         displayNameZh:'其他',    displayNameTh:'อื่นๆ',       displayNamePh:'Iba pa',    count:89,active:true, operator:'ops03',opTime:'2025-03-01 09:00:00'},
    ]);
    const qsCatFilter = ref('');
    const qsCatsFiltered = computed(() => {
      const kw = qsCatFilter.value.toLowerCase();
      return qsCats.value.filter(c => !kw || c.name.includes(kw) || c.displayName.toLowerCase().includes(kw));
    });
    const qsCatDlg = reactive({ visible:false, editId:null, name:'', displayNameLang:'en', displayNameEn:'', displayNameZh:'', displayNameTh:'', displayNamePh:'', active:true });
    const qsOpenCat = (id) => {
      qsCatDlg.editId = id;
      const c = id ? qsCats.value.find(x=>x.id===id) : null;
      qsCatDlg.name = c?.name||'';
      qsCatDlg.displayNameLang = 'en';
      qsCatDlg.displayNameEn = c?.displayNameEn||'';
      qsCatDlg.displayNameZh = c?.displayNameZh||'';
      qsCatDlg.displayNameTh = c?.displayNameTh||'';
      qsCatDlg.displayNamePh = c?.displayNamePh||'';
      qsCatDlg.active = c ? c.active : true;
      qsCatDlg.visible = true;
    };
    const qsSubmitCat = () => {
      if (!qsCatDlg.name.trim()) { ElMessage.warning('请填写分类名称'); return; }
      if (!qsCatDlg.displayNameEn.trim()) { ElMessage.warning('请填写英文展示名称'); return; }
      const now = MOCK_NOW;
      const displayName = qsCatDlg.displayNameEn;
      if (qsCatDlg.editId) {
        const c = qsCats.value.find(x=>x.id===qsCatDlg.editId);
        Object.assign(c, {name:qsCatDlg.name,displayName,displayNameEn:qsCatDlg.displayNameEn,displayNameZh:qsCatDlg.displayNameZh,displayNameTh:qsCatDlg.displayNameTh,displayNamePh:qsCatDlg.displayNamePh,active:qsCatDlg.active,operator:'ops03',opTime:now});
      } else {
        qsCats.value.push({id:Date.now(),name:qsCatDlg.name,displayName,displayNameEn:qsCatDlg.displayNameEn,displayNameZh:qsCatDlg.displayNameZh,displayNameTh:qsCatDlg.displayNameTh,displayNamePh:qsCatDlg.displayNamePh,count:0,active:qsCatDlg.active,operator:'ops03',opTime:now});
      }
      qsCatDlg.visible = false;
      ElMessage.success('保存成功');
    };
    const qsToggleCat = (id, val) => {
      const c = qsCats.value.find(x=>x.id===id);
      c.active = val; c.operator='ops03';
      c.opTime = MOCK_NOW;
    };
    const qsSaveParams = () => {
      if (qsParams.min >= qsParams.max) { ElMessage.warning('下限不能 ≥ 上限'); return; }
      if (qsParams.marginMax <= qsParams.margin) { ElMessage.warning('开题最高保证金需大于最低保证金'); return; }
      ElMessage.success('已保存，操作记录到日志');
    };
    return { qsTab, qsParams, qsCats, qsCatFilter, qsCatsFiltered, qsCatDlg, qsOpenCat, qsSubmitCat, qsToggleCat, qsSaveParams,
      Search: ElementPlusIconsVue.Search, Refresh: ElementPlusIconsVue.Refresh };
  }
});

/* ========== TierManage 层级管理 ========== */
const TierManage = defineComponent({
  name: 'TierManage',
  template: '#tier-manage-tpl',
  setup() {
    const { ElMessage, ElMessageBox } = ElementPlus;
    const { ref, reactive, computed } = Vue;

    // Tab
    const tlTab = ref('auto');

    // Mock data - auto tiers
    const tlAutoData = ref([
      { id:'202413808326751436**', type:'自动层级', name:'Default Player',       desc:'Default Player',       depositTimes:0, totalDeposit:'0.00',      totalBet:'0.00',      rtpValue:0,   rtpLevel:0, memberCount:20,  operator:'-', createdAt:'2023-09-26 12:11:37', updatedAt:'2025-05-01 17:08:05' },
      { id:'202413808326751437**', type:'自动层级', name:'First Deposit Player', desc:'First Deposit Player', depositTimes:1, totalDeposit:'2.00',      totalBet:'0.00',      rtpValue:0,   rtpLevel:0, memberCount:143, operator:'-', createdAt:'2023-09-26 12:11:38', updatedAt:'2025-04-20 09:14:22' },
      { id:'202413808326751438**', type:'自动层级', name:'100 Player',           desc:'100 Player',           depositTimes:1, totalDeposit:'100.00',    totalBet:'0.00',      rtpValue:0,   rtpLevel:0, memberCount:89,  operator:'-', createdAt:'2023-09-26 12:11:39', updatedAt:'2025-04-18 11:30:00' },
      { id:'202413808326751439**', type:'自动层级', name:'1K Player',            desc:'1K Player',            depositTimes:1, totalDeposit:'1000.00',   totalBet:'0.00',      rtpValue:0.9, rtpLevel:4, memberCount:57,  operator:'-', createdAt:'2023-09-26 12:11:40', updatedAt:'2025-04-15 08:45:11' },
      { id:'202413808326751440**', type:'自动层级', name:'10K Player',           desc:'10K Player',           depositTimes:1, totalDeposit:'10000.00',  totalBet:'0.00',      rtpValue:0.9, rtpLevel:4, memberCount:32,  operator:'-', createdAt:'2023-09-26 12:11:41', updatedAt:'2025-04-10 16:22:33' },
      { id:'202413808326751441**', type:'自动层级', name:'100K Player',          desc:'100K Player',          depositTimes:1, totalDeposit:'100000.00', totalBet:'0.00',      rtpValue:0.9, rtpLevel:4, memberCount:11,  operator:'-', createdAt:'2023-09-26 12:11:42', updatedAt:'2025-03-28 14:05:19' },
      { id:'202413808326751442**', type:'自动层级', name:'300K Player',          desc:'300K Player',          depositTimes:1, totalDeposit:'300000.00', totalBet:'0.00',      rtpValue:0.9, rtpLevel:4, memberCount:3,   operator:'-', createdAt:'2023-09-26 12:11:43', updatedAt:'2025-03-10 10:00:00' },
    ]);

    // Mock data - fixed tiers
    const tlFixedData = ref([
      { id:'202413808326751381', type:'固定层级', name:'Other Malicious Player', desc:'Other Malicious Player', restrictions:['投注佣金','邀请佣金','排行榜佣金','VIP奖金','活动（不包含VIP，和返水代理）','返水'], memberCount:0, operator:'-', createdAt:'2023-10-16 15:07:14', updatedAt:'2023-10-16 15:07:14' },
      { id:'202413808326751380', type:'固定层级', name:'Arbitrage Player',       desc:'Arbitrage Player',       restrictions:['投注佣金','邀请佣金','排行榜佣金','活动（不包含VIP，和返水代理）'],         memberCount:0, operator:'-', createdAt:'2023-10-16 15:06:59', updatedAt:'2023-10-16 15:06:59' },
      { id:'202413808326751379', type:'固定层级', name:'Malicious Player',       desc:'Malicious Player',       restrictions:['投注佣金','邀请佣金','排行榜佣金','VIP奖金'],                              memberCount:0, operator:'-', createdAt:'2023-10-16 15:06:38', updatedAt:'2023-10-16 15:06:38' },
      { id:'202413808326751378', type:'固定层级', name:'Suspicious Player',      desc:'Suspicious Player',      restrictions:['邀请佣金','排行榜佣金','返水'],                                            memberCount:0, operator:'-', createdAt:'2023-10-16 15:06:21', updatedAt:'2023-10-16 15:06:21' },
    ]);

    // Computed table data based on tab
    const tlTableData = computed(() => tlTab.value === 'auto' ? tlAutoData.value : tlFixedData.value);

    // Tier names for filter dropdown
    const tlTierNames = computed(() => tlTableData.value.map(r => r.name));

    // Filter
    const tlFilter = reactive({ name: '', operator: '' });

    // Pagination
    const tlPagination = reactive({ page: 1, size: 50, total: 7 });

    // 固定层级限制选项
    const tlRestrictionOpts = ['投注佣金','邀请佣金','排行榜佣金','VIP奖金','活动（不包含VIP，和返水代理）','返水'];

    // RTP返奖率档位映射
    const tlRtpOpts = [
      { label: '默认 (0%)',   value: 0,    level: 0 },
      { label: '0.85 (85%)', value: 0.85, level: 1 },
      { label: '0.87 (87%)', value: 0.87, level: 2 },
      { label: '0.89 (89%)', value: 0.89, level: 3 },
      { label: '0.90 (90%)', value: 0.90, level: 4 },
      { label: '0.92 (92%)', value: 0.92, level: 5 },
    ];
    const tlSyncRtpLevel = (val) => {
      const opt = tlRtpOpts.find(o => o.value === val);
      tlForm.rtpLevel = opt ? opt.level : undefined;
    };

    // Dialog - add/edit
    const tlDialogVisible = ref(false);
    const tlDialogMode = ref('add');
    const tlForm = reactive({ type: '自动层级', name: '', desc: '', depositTimes: undefined, totalDeposit: undefined, totalBet: undefined, rtpValue: undefined, rtpLevel: undefined, restrictions: [] });

    const tlOpenAdd = () => {
      tlDialogMode.value = 'add';
      Object.assign(tlForm, { type: tlTab.value === 'auto' ? '自动层级' : '固定层级', name: '', desc: '', depositTimes: undefined, totalDeposit: undefined, totalBet: undefined, rtpValue: undefined, rtpLevel: undefined, restrictions: [] });
      tlDialogVisible.value = true;
    };
    const tlOpenEdit = (row) => {
      tlDialogMode.value = 'edit';
      Object.assign(tlForm, { type: row.type, name: row.name, desc: row.desc, depositTimes: row.depositTimes, totalDeposit: parseFloat(row.totalDeposit)||0, totalBet: parseFloat(row.totalBet)||0, rtpValue: row.rtpValue, rtpLevel: row.rtpLevel, restrictions: [...(row.restrictions||[])] });
      tlDialogVisible.value = true;
    };
    const tlDelete = (row) => {
      ElMessage.warning(`已删除层级：${row.name}`);
    };

    // View dialog - member list
    const tlViewVisible = ref(false);
    const tlViewTierName = ref('');
    const tlViewFilter = reactive({ account: '' });
    const tlViewPagination = reactive({ page: 1, size: 20, total: 9 });
    const tlViewData = ref([
      { memberId:'144414451456', username:'u1htbokp34',  registeredAt:'2026-02-19 14:06:39', totalDeposit:'0.00', depositTimes:0, maxDeposit:'0.00', totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:false },
      { memberId:'145355600128', username:'ucu9040utc',  registeredAt:'2026-05-06 11:22:01', totalDeposit:'0.00', depositTimes:0, maxDeposit:'0.00', totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:false },
      { memberId:'146201887634', username:'ukkfjsrchs',  registeredAt:'2026-05-05 21:56:48', totalDeposit:'0.00', depositTimes:0, maxDeposit:'0.00', totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:false },
      { memberId:'146009334521', username:'uly3e383r4',  registeredAt:'2026-04-28 22:06:22', totalDeposit:'0.00', depositTimes:0, maxDeposit:'0.00', totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:false },
      { memberId:'147112200341', username:'Nelly01',     registeredAt:'2026-04-28 22:05:52', totalDeposit:'0.00', depositTimes:0, maxDeposit:'0.00', totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:false },
      { memberId:'143008812200', username:'qwer0004',    registeredAt:'2026-03-21 14:17:19', totalDeposit:'0.00', depositTimes:0, maxDeposit:'192.00',totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:true  },
      { memberId:'143009001100', username:'qwer0009',    registeredAt:'2026-03-20 22:02:39', totalDeposit:'0.00', depositTimes:0, maxDeposit:'485.00',totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:false },
      { memberId:'143009001200', username:'qwer0008',    registeredAt:'2026-03-20 22:01:21', totalDeposit:'0.00', depositTimes:0, maxDeposit:'135.00',totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:false },
      { memberId:'143009001300', username:'qwer0007',    registeredAt:'2026-03-20 21:59:23', totalDeposit:'0.00', depositTimes:0, maxDeposit:'195.00',totalBet:'0.00', totalWithdraw:'0.00', withdrawTimes:0, tier:'Default Player', locked:false },
    ]);
    const tlViewSelected = ref([]);
    const tlBatchDlg     = reactive({ visible:false, tier:'', locked:false });
    const tlOpenBatch    = () => { tlBatchDlg.tier=''; tlBatchDlg.locked=false; tlBatchDlg.visible=true; };

    const tlOpenView = (row) => {
      tlViewTierName.value = row.name;
      tlViewVisible.value = true;
    };

    // Col setting
    const tlAllColsDef = ref([
      { key:'id',           label:'ID',           visible:true },
      { key:'type',         label:'层级类型',      visible:true },
      { key:'name',         label:'层级名称',      visible:true, required:true },
      { key:'desc',         label:'描述',           visible:true },
      { key:'depositTimes', label:'充值次数',      visible:true },
      { key:'totalDeposit', label:'累计充值金额',  visible:true },
      { key:'totalBet',     label:'累计有效投注',  visible:true },
      { key:'memberCount',  label:'层级人数',      visible:true },
      { key:'operator',     label:'操作人',        visible:true },
      { key:'time',         label:'创建/更新时间', visible:true },
      { key:'actions',      label:'操作',           visible:true, required:true },
    ]);
    const tlColVis        = k => tlAllColsDef.value.find(c => c.key === k)?.visible ?? true;
    const tlAllCols       = computed(() => tlAllColsDef.value.every(c => c.visible));
    const tlSomeCols      = computed(() => tlAllColsDef.value.some(c => c.visible) && !tlAllCols.value);
    const tlToggleAllCols = v => tlAllColsDef.value.forEach(c => { c.visible = v; });

    return {
      tlTab, tlTableData, tlTierNames,
      tlFilter, tlPagination,
      tlRestrictionOpts, tlRtpOpts, tlSyncRtpLevel,
      tlDialogVisible, tlDialogMode, tlForm, tlOpenAdd, tlOpenEdit, tlDelete,
      tlViewVisible, tlViewTierName, tlViewFilter, tlViewData, tlViewPagination, tlViewSelected, tlOpenView,
      tlBatchDlg, tlOpenBatch,
      ElMessage,
      TlSearch:    ElementPlusIconsVue.Search,
      TlRefresh:   ElementPlusIconsVue.Refresh,
      TlPlus:      ElementPlusIconsVue.Plus,
      TlOperation: ElementPlusIconsVue.Operation,
    };
  }
});

/* ════════════════════════════════════════════
   游戏管理 / 游戏列表
════════════════════════════════════════════ */
const GmList = defineComponent({
  name: 'GmList',
  template: '#gm-list-tpl',
  setup() {
    const MANUFACTURERS = [
      '98club', '9Wickets', 'BG-SLOTS', 'BG-LIVE',
      'CQ9-SLOTS-PROVIDER', 'CQ9-SLOTS', 'EVOLIVE-LIVE', 'EVOLIVE-RNG', 'EZUGI-LIVE',
      'FC-SLOTS', 'FCNEW-SLOTS', 'FC-FISHING',
      'HB-POKER', 'INOUT-SLOTS', 'INOUTNEW-SLOTS',
      'JDB-SLOTS', 'JDBNEW-SLOTS', 'JDB-FISHING', 'JILI', 'JL-SLOTS', 'JLNEW-SLOTS', 'JL-POKER', 'JL-FISHING',
      'PANDANEW-SLOTS', 'PGNEW-SLOTS', 'PGS-SLOTS', 'PG_SOFT', 'PGSINGLE-SLOTS',
      'PP-LIVE', 'PPNEW-SLOTS', 'QM-POKER', 'RGNEW-SLOTS', 'SABA-SPORTS', 'SimplePlay',
      'SPB-SLOTS', 'SPB-SLOTS-PROVIDER', 'SPB-MINI', 'SPB-MINI-PROVIDER',
      'SPRIBENEW-SLOTS', 'TADANEW-SLOTS', 'TBNEW-SLOTS', 'TOPBET-POKER',
      'WGNEW-SLOTS', 'WIFY-LIVE', 'YB-LIVE',
    ];

    const EDIT_TABS = [
      { key: 'basic',   label: '基本信息' },
      { key: 'display', label: '显示规则' },
      { key: 'params',  label: '玩法参数' },
    ];

    const expanded = ref(false);
    const selection = ref([]);

    const defaultFilters = () => ({
      manufacturer: '', nameCn: '', nameCustom: '',
      gameStatus: '', maintainStatus: '', isHot: '', isNew: '', isJackpot: '',
      quickFilters: [],
    });
    const filters = reactive(defaultFilters());

    /* 列配置 —— 覆盖真后台全部 22 个字段；合并展示不丢字段，长字段默认隐藏可在「列设置」开启 */
    const columnOptions = reactive([
      { prop: 'id',             label: '主键id',      width: 80,  align: 'center', visible: true,  required: true },
      { prop: 'manufacturer',   label: '游戏厂商',    width: 130, visible: true,  required: true },
      { prop: 'icon',           label: '图标',        width: 70,  align: 'center', visible: true,  slot: true },
      { prop: 'nameInfo',       label: '游戏名称',    width: 170, visible: true,  slot: true, tooltip: false }, // 中文 + 自定义
      { prop: 'code',           label: '游戏编码',    width: 120, visible: true },
      { prop: 'gameStatus',     label: '游戏状态',    width: 90,  align: 'center', visible: true,  slot: true },
      { prop: 'maintainStatus', label: '维护状态',    width: 90,  align: 'center', visible: true,  slot: true },
      { prop: 'sort',           label: '排序',        width: 80,  align: 'center', visible: true },
      { prop: 'flags',          label: '标签/排序',   width: 200, visible: true,  slot: true, tooltip: false }, // 热门/最新/推荐/jackpot 标签 + 各自排序号
      { prop: 'rtp',            label: '赔率%',       width: 90,  align: 'right',  visible: true },
      { prop: 'maxWin',         label: '最高中奖金额', width: 140, align: 'right',  visible: true },
      { prop: 'timeInfo',       label: '时间',        width: 180, visible: true,  slot: true, tooltip: false }, // 添加时间 + 最后更新时间（两行）
    ]);
    const visibleColumns = computed(() => columnOptions.filter(c => c.visible));
    const allColsVisible = computed(() => columnOptions.every(c => c.visible));
    const someColsVisible = computed(() => columnOptions.some(c => c.visible) && !allColsVisible.value);
    const toggleAllCols = (val) => columnOptions.forEach(c => { if (!c.required) c.visible = val; });

    /* 模拟数据（基于线上 4003 条样本）—— 含真后台全部字段 */
    const mockData = [
      { id: 1,  manufacturer: '98club', icon: '', nameCn: 'Win Go',  nameCustom: 'Win Go', code: 'winGo', gameStatus: 'enabled', maintainStatus: 'ok', sort: 1, hotSort: 0,  isHot: 'no',  isNew: 'yes', newSort: 1, isRecommend: 'yes', recommendSort: 2, isJackpot: 'no',  jackpotSort: 1, rtp: '97.9',  maxWin: 895622222, addTime: '12/03/2024 10:21:08', updateTime: '08/06/2026 19:42:11' },
      { id: 2,  manufacturer: '98club', icon: '', nameCn: 'K3',      nameCustom: 'K3',     code: 'k3',    gameStatus: 'enabled', maintainStatus: 'ok', sort: 2, hotSort: 0,  isHot: 'yes', isNew: 'no',  newSort: 0, isRecommend: 'no',  recommendSort: 0, isJackpot: 'no',  jackpotSort: 0, rtp: '97.5',  maxWin: 500000000, addTime: '12/03/2024 10:22:15', updateTime: '02/06/2026 11:03:50' },
      { id: 3,  manufacturer: '98club', icon: '', nameCn: '5D',      nameCustom: '5D',     code: '5D',    gameStatus: 'enabled', maintainStatus: 'ok', sort: 3, hotSort: 0,  isHot: 'no',  isNew: 'no',  newSort: 0, isRecommend: 'no',  recommendSort: 0, isJackpot: 'yes', jackpotSort: 2, rtp: '96.8',  maxWin: 100000000, addTime: '12/03/2024 10:23:01', updateTime: '21/05/2026 09:15:22' },
      { id: 4,  manufacturer: '98club', icon: '', nameCn: 'Racing',  nameCustom: 'Racing', code: 'racing', gameStatus: 'enabled', maintainStatus: 'ok', sort: 4, hotSort: 0, isHot: 'no',  isNew: 'no',  newSort: 0, isRecommend: 'no',  recommendSort: 0, isJackpot: 'no',  jackpotSort: 0, rtp: '97.0',  maxWin: 80000000,  addTime: '12/03/2024 10:24:30', updateTime: '21/05/2026 09:16:40' },
      { id: 5,  manufacturer: '98club', icon: '', nameCn: 'Trx WinGo', nameCustom: 'Trx WinGo', code: 'trxWinGo', gameStatus: 'enabled', maintainStatus: 'ok', sort: 5, hotSort: 0, isHot: 'yes', isNew: 'yes', newSort: 3, isRecommend: 'yes', recommendSort: 5, isJackpot: 'no', jackpotSort: 0, rtp: '97.9', maxWin: 1000000000, addTime: '15/04/2024 14:02:11', updateTime: '08/06/2026 19:42:11' },
      { id: 18, manufacturer: 'CQ9-SLOTS', icon: '', nameCn: 'Fortune Gods', nameCustom: 'Fortune Gods', code: 'CQ9_fortune_gods', gameStatus: 'enabled', maintainStatus: 'ok', sort: 18, hotSort: 1, isHot: 'yes', isNew: 'no', newSort: 0, isRecommend: 'no', recommendSort: 0, isJackpot: 'no', jackpotSort: 0, rtp: '96.5', maxWin: 50000000, addTime: '20/06/2024 08:30:00', updateTime: '30/05/2026 16:48:09' },
      { id: 23, manufacturer: 'JDB-SLOTS', icon: '', nameCn: '王者捕鱼', nameCustom: 'King Fishing', code: 'JDB_king_fish', gameStatus: 'enabled', maintainStatus: 'maintain', sort: 23, hotSort: 0, isHot: 'no', isNew: 'no', newSort: 0, isRecommend: 'no', recommendSort: 0, isJackpot: 'yes', jackpotSort: 3, rtp: '96.0', maxWin: 10000000, addTime: '02/07/2024 13:11:45', updateTime: '11/06/2026 08:05:33' },
      { id: 31, manufacturer: 'PG_SOFT', icon: '', nameCn: 'Mahjong Ways 2', nameCustom: 'Mahjong Ways 2', code: 'PGS_mahjong2', gameStatus: 'enabled', maintainStatus: 'ok', sort: 31, hotSort: 2, isHot: 'yes', isNew: 'no', newSort: 0, isRecommend: 'yes', recommendSort: 1, isJackpot: 'no', jackpotSort: 0, rtp: '96.95', maxWin: 5000000, addTime: '18/08/2024 19:55:20', updateTime: '07/06/2026 22:14:07' },
      { id: 47, manufacturer: 'EVOLIVE-LIVE', icon: '', nameCn: 'Lightning Roulette', nameCustom: 'Lightning Roulette', code: 'EVO_lightning_roulette', gameStatus: 'enabled', maintainStatus: 'ok', sort: 47, hotSort: 3, isHot: 'yes', isNew: 'yes', newSort: 4, isRecommend: 'yes', recommendSort: 3, isJackpot: 'no', jackpotSort: 0, rtp: '97.30', maxWin: 250000000, addTime: '05/09/2024 11:40:00', updateTime: '09/06/2026 15:20:51' },
      { id: 52, manufacturer: 'SABA-SPORTS', icon: '', nameCn: 'IPL 2026', nameCustom: 'IPL 2026', code: 'SABA_ipl_2026', gameStatus: 'disabled', maintainStatus: 'maintain', sort: 52, hotSort: 0, isHot: 'no', isNew: 'no', newSort: 0, isRecommend: 'no', recommendSort: 0, isJackpot: 'no', jackpotSort: 0, rtp: '95.0', maxWin: 0, addTime: '10/01/2026 09:00:00', updateTime: '05/06/2026 10:30:00' },
    ];

    const tableData = ref([...mockData]);
    const pagination = reactive({ page: 1, size: 20, total: 4003 });

    const onSelectionChange = (rows) => { selection.value = rows; };

    const search = () => {
      ElMessage.success('查询条件已应用');
    };
    const reset = () => {
      Object.assign(filters, defaultFilters());
      pagination.page = 1;
      ElMessage.info('筛选条件已重置');
    };
    const exportData = () => ElMessage.success('导出任务已提交');
    const refreshCache = () => ElMessage.success('游戏列表缓存已刷新');

    /* 二次确认弹窗 */
    const confirmDlg = reactive({ visible: false, title: '', message: '', detail: '', onConfirm: null });
    const askConfirm = ({ title, message, detail, onConfirm }) => {
      confirmDlg.title = title;
      confirmDlg.message = message;
      confirmDlg.detail = detail || '';
      confirmDlg.onConfirm = onConfirm;
      confirmDlg.visible = true;
    };
    const doConfirm = () => {
      confirmDlg.onConfirm?.();
      confirmDlg.visible = false;
    };

    const batchEnable = () => askConfirm({
      title: '批量启用',
      message: `确认批量启用 ${selection.value.length} 个游戏吗？`,
      detail: '启用后玩家立即可见，请确认无误。',
      onConfirm: () => {
        selection.value.forEach(r => { r.gameStatus = 'enabled'; });
        ElMessage.success(`已启用 ${selection.value.length} 个游戏`);
      },
    });
    const batchDisable = () => askConfirm({
      title: '批量禁用',
      message: `确认批量禁用 ${selection.value.length} 个游戏吗？`,
      detail: '禁用后玩家立即无法访问该游戏。',
      onConfirm: () => {
        selection.value.forEach(r => { r.gameStatus = 'disabled'; });
        ElMessage.success(`已禁用 ${selection.value.length} 个游戏`);
      },
    });

    /* 编辑/新增弹窗 */
    const editDlg = reactive({
      visible: false,
      mode: 'add',
      tab: 'basic',
      form: {},
    });
    const newFormData = () => ({
      manufacturer: '', nameCn: '', nameCustom: '', icon: '', code: '',
      gameStatus: 'enabled', maintainStatus: 'ok', sort: 0, hotSort: 0,
      isHot: 'no', recommendSort: 0, isRecommend: 'no',
      isNew: 'no', newSort: 0, isJackpot: 'no', jackpotSort: 0,
      rtp: '', maxWin: '',
    });
    const openAdd = () => {
      editDlg.mode = 'add';
      editDlg.tab = 'basic';
      editDlg.form = newFormData();
      editDlg.visible = true;
    };
    const openEdit = (row) => {
      editDlg.mode = 'edit';
      editDlg.tab = 'basic';
      editDlg.form = { ...newFormData(), ...row, isRecommend: row.isRecommend || 'no' };
      editDlg.visible = true;
    };
    const confirmEdit = () => {
      ElMessage.success(editDlg.mode === 'add' ? '游戏新增成功' : '游戏修改成功');
      editDlg.visible = false;
    };
    const doDelete = (row) => askConfirm({
      title: '删除游戏',
      message: `确认删除游戏「${row.nameCn}」吗？`,
      detail: '删除后不可恢复，请确认是否继续。',
      onConfirm: () => {
        const i = tableData.value.findIndex(r => r.id === row.id);
        if (i !== -1) tableData.value.splice(i, 1);
        pagination.total -= 1;
        ElMessage.success('已删除');
      },
    });

    /* 玩法配置弹窗 */
    const playwayDlg = reactive({ visible: false, gameName: '', data: [] });
    const openPlayway = (row) => {
      playwayDlg.gameName = row.nameCn;
      playwayDlg.data = [
        { name: row.nameCn + ' 1 minute',  time: 1,  bet: '1|10|100|1000', multi: '1|5|10|20|50|100', enabled: true, sort: 1, rtp: 0.94, totalBet: 500,    totalWin: 0 },
        { name: row.nameCn + ' 3 minute',  time: 3,  bet: '1|10|100|1000', multi: '1|5|10|20|50|100', enabled: true, sort: 2, rtp: 0.95, totalBet: 500,    totalWin: 0 },
        { name: row.nameCn + ' 5 minute',  time: 5,  bet: '1|10|100|1000', multi: '1|5|10|20|50|100', enabled: true, sort: 3, rtp: 0.95, totalBet: 500,    totalWin: 0 },
        { name: row.nameCn + ' 10 minute', time: 10, bet: '1|10|100|1000', multi: '1|5|10|20|50|100', enabled: true, sort: 4, rtp: 0.95, totalBet: 500,    totalWin: 0 },
        { name: row.nameCn + ' 30 second', time: 30, bet: '1|10|100|1000', multi: '1|5|10|20|50|100', enabled: true, sort: 0, rtp: 0.95, totalBet: 2578.95, totalWin: 2450 },
      ];
      playwayDlg.visible = true;
    };

    /* 新增/编辑玩法弹窗 */
    const playwayFormDefault = () => ({
      name: '', time: '', status: 'enabled',
      bet1: '', bet2: '', bet3: '', bet4: '',
      multi1: '', multi2: '', multi3: '', multi4: '', multi5: '', multi6: '',
      rtp: '', sort: '', intro: '',
    });
    const playwayEditDlg = reactive({ visible: false, mode: 'add', form: playwayFormDefault() });
    const openPlaywayAdd = () => {
      playwayEditDlg.mode = 'add';
      playwayEditDlg.form = playwayFormDefault();
      playwayEditDlg.visible = true;
    };
    const SAMPLE_PLAYWAY_INTRO =
      '<p>1 minutes 1 issue, 55 seconds to order, 5 seconds waiting for the draw. It opens all day. The total number of trade is 1440 issues.</p>' +
      '<p>If you spend 100 to trade, after deducting service fee 2%, contract amount: 98</p>' +
      '<p><strong>1. Select Green:</strong></p><p>If the result shows 1,3,7,9 you will get (98*2)=196; if the result shows 5, you will get (98*1.5)=147</p>' +
      '<p><strong>2. Select Red:</strong></p><p>If the result shows 2,4,6,8 you will get (98*2)=196; if the result shows 0, you will get (98*1.5)=147</p>' +
      '<p><strong>3. Select Violet:</strong></p><p>If the result shows 0 or 5, you will get (98*4.5)=441</p>' +
      '<p><strong>4. Select Number:</strong></p><p>If the result is the same as the number you selected, you will get (98*9)=882</p>' +
      '<p><strong>5. Select Big:</strong></p><p>If the result shows 5,6,7,8,9 you will get (98*2)=196</p>' +
      '<p><strong>6. Select Small:</strong></p><p>If the result shows 0,1,2,3,4 you will get (98*2)=196</p>';
    const openPlaywayEdit = (row) => {
      playwayEditDlg.mode = 'edit';
      const bets = (row.bet || '').split('|');
      const multis = (row.multi || '').split('|');
      playwayEditDlg.form = {
        name: row.name, time: row.time, status: row.enabled ? 'enabled' : 'disabled',
        bet1: bets[0] || '', bet2: bets[1] || '', bet3: bets[2] || '', bet4: bets[3] || '',
        multi1: multis[0] || '', multi2: multis[1] || '', multi3: multis[2] || '',
        multi4: multis[3] || '', multi5: multis[4] || '', multi6: multis[5] || '',
        rtp: row.rtp, sort: row.sort, intro: SAMPLE_PLAYWAY_INTRO,
      };
      playwayEditDlg.visible = true;
    };
    const savePlayway = () => {
      ElMessage.success(playwayEditDlg.mode === 'add' ? '玩法已新增' : '玩法已保存');
      playwayEditDlg.visible = false;
    };

    /* 玩法介绍富文本（wangEditor v5，原生 API 接入 el-dialog） */
    let pwEditor = null;
    const initPlaywayEditor = () => {
      if (!window.wangEditor) return;
      destroyPlaywayEditor();
      const { createEditor, createToolbar } = window.wangEditor;
      pwEditor = createEditor({
        selector: '#pwEditorContent',
        html: playwayEditDlg.form.intro || '<p><br></p>',
        config: {
          placeholder: '请输入内容...',
          onChange(editor) { playwayEditDlg.form.intro = editor.getHtml(); },
        },
        mode: 'default',
      });
      createToolbar({
        editor: pwEditor,
        selector: '#pwEditorToolbar',
        mode: 'default',
        config: {
          toolbarKeys: [
            'headerSelect', 'bold', 'fontSize', 'fontFamily', 'italic', 'underline', 'through',
            'indent', 'lineHeight', 'color', 'bgColor', 'insertLink', 'bulletedList', 'todo',
            'justifyLeft', 'blockquote', 'emotion', 'insertImage',
            'insertVideo', 'insertTable', 'codeBlock', 'divider', 'undo', 'redo', 'fullScreen',
          ],
        },
      });
    };
    function destroyPlaywayEditor() {
      if (pwEditor) { pwEditor.destroy(); pwEditor = null; }
    }

    /* 赔率配置弹窗 */
    const oddsDlg = reactive({ visible: false, gameName: '', data: [], selection: [] });
    const openOdds = (row) => {
      oddsDlg.gameName = row.nameCn;
      oddsDlg.data = [
        { type: '和值', bet: '3', result: '3', odds: 207.36, initialOdds: 207.36 },
        { type: '和值', bet: '4', result: '4', odds: 69.12,  initialOdds: 69.12 },
        { type: '和值', bet: '5', result: '5', odds: 34.56,  initialOdds: 34.56 },
        { type: '和值', bet: '6', result: '6', odds: 20.74,  initialOdds: 20.74 },
        { type: '颜色', bet: 'green',  result: 'green',        odds: 3,   initialOdds: 2.15 },
        { type: '颜色', bet: 'violet', result: 'green-violet', odds: 5,   initialOdds: 4.8 },
        { type: '数字', bet: '0-9',    result: '0-9',          odds: 10,  initialOdds: 10 },
        { type: '大小', bet: 'big',    result: 'big',          odds: 2.5, initialOdds: 2 },
      ];
      oddsDlg.selection = [];
      oddsDlg.visible = true;
    };
    const onOddsSelect = (rows) => { oddsDlg.selection = rows; };

    /* 新增/编辑游戏赔率弹窗 */
    const oddsFormDefault = () => ({ type: '', bet: '', result: '', odds: '', initialOdds: '' });
    const oddsEditDlg = reactive({ visible: false, mode: 'add', form: oddsFormDefault() });
    const openOddsAdd = () => { oddsEditDlg.mode = 'add'; oddsEditDlg.form = oddsFormDefault(); oddsEditDlg.visible = true; };
    const openOddsEdit = (row) => {
      oddsEditDlg.mode = 'edit';
      oddsEditDlg.form = { type: row.type, bet: row.bet, result: row.result, odds: row.odds, initialOdds: row.initialOdds };
      oddsEditDlg.visible = true;
    };
    const editSelectedOdds = () => {
      if (oddsDlg.selection.length !== 1) return ElMessage.warning('请选择一条记录进行修改');
      openOddsEdit(oddsDlg.selection[0]);
    };
    const deleteSelectedOdds = () => {
      if (!oddsDlg.selection.length) return ElMessage.warning('请选择要删除的记录');
      ElMessage.success('已删除 ' + oddsDlg.selection.length + ' 条赔率');
    };
    const saveOdds = () => {
      ElMessage.success(oddsEditDlg.mode === 'add' ? '赔率已新增' : '赔率已保存');
      oddsEditDlg.visible = false;
    };

    /* ── 游戏限制配置（原独立页面合并到此） ── */
    const RESTRICT_CATS = [
      { key: 'self', label: '自研', vendors: ['winGo', 'k3', '5D', 'racing', 'trxWinGo', 'Aviator diy', 'Money coming diy', 'Mines diy', 'kerala'] },
      { key: 'slot', label: '电子', vendors: [
        'BG-SLOTS', 'CQ9-SLOTS-PROVIDER', 'CQ9-SLOTS', 'FC-SLOTS', 'FCNEW-SLOTS',
        'INOUT-SLOTS', 'INOUTNEW-SLOTS', 'JDB-SLOTS', 'JDBNEW-SLOTS', 'JL-SLOTS',
        'JLNEW-SLOTS', 'PANDANEW-SLOTS', 'PGNEW-SLOTS', 'PGS-SLOTS', 'PG_SOFT',
        'PGSINGLE-SLOTS', 'PPNEW-SLOTS', 'RGNEW-SLOTS', 'SPB-SLOTS', 'SPB-SLOTS-PROVIDER',
        'SPRIBENEW-SLOTS', 'TADANEW-SLOTS', 'TBNEW-SLOTS', 'WGNEW-SLOTS',
      ] },
      { key: 'poker', label: '棋牌', vendors: ['HB-POKER', 'JL-POKER', 'QM-POKER', 'TOPBET-POKER'] },
      { key: 'sport', label: '体育', vendors: ['9Wickets', 'SABA-SPORTS'] },
      { key: 'live',  label: '真人', vendors: ['BG-LIVE', 'EVOLIVE-LIVE', 'EVOLIVE-RNG', 'EZUGI-LIVE', 'PP-LIVE', 'WIFY-LIVE', 'YB-LIVE'] },
      { key: 'fish',  label: '捕鱼', vendors: ['FC-FISHING', 'JDB-FISHING', 'JL-FISHING'] },
    ];
    const ALL_RESTRICT_VENDORS = RESTRICT_CATS.flatMap(c => c.vendors);
    const totalRestrictVendors = ALL_RESTRICT_VENDORS.length;

    const restrictConfig = reactive({
      enabled: true,
      cats: ['slot'],
      vendors: [...RESTRICT_CATS[1].vendors],
      updatedAt: '2026-04-28 12:28:21',
    });

    const restrictDlg = reactive({
      visible: false,
      activeCat: 'self',
      search: '',
      form: { enabled: true, cats: [], vendors: [] },
    });

    const openRestrictions = () => {
      restrictDlg.visible = true;
      restrictDlg.activeCat = 'self';
      restrictDlg.search = '';
      restrictDlg.form.enabled = restrictConfig.enabled;
      restrictDlg.form.cats = [...restrictConfig.cats];
      restrictDlg.form.vendors = [...restrictConfig.vendors];
    };
    const confirmRestrict = () => {
      restrictConfig.enabled = restrictDlg.form.enabled;
      restrictConfig.cats    = [...restrictDlg.form.cats];
      restrictConfig.vendors = [...restrictDlg.form.vendors];
      restrictConfig.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
      restrictDlg.visible = false;
      ElMessage.success('游戏限制配置已保存');
    };
    const toggleRestrictCat = (key) => {
      const cat = RESTRICT_CATS.find(c => c.key === key);
      if (!cat) return;
      const idx = restrictDlg.form.cats.indexOf(key);
      if (idx === -1) {
        restrictDlg.form.cats.push(key);
        cat.vendors.forEach(v => {
          if (!restrictDlg.form.vendors.includes(v)) restrictDlg.form.vendors.push(v);
        });
      } else {
        restrictDlg.form.cats.splice(idx, 1);
        restrictDlg.form.vendors = restrictDlg.form.vendors.filter(v => !cat.vendors.includes(v));
      }
    };
    const toggleRestrictVendor = (v) => {
      const i = restrictDlg.form.vendors.indexOf(v);
      if (i === -1) restrictDlg.form.vendors.push(v);
      else restrictDlg.form.vendors.splice(i, 1);
    };
    const countRestrictVendors = (catKey) => {
      const cat = RESTRICT_CATS.find(c => c.key === catKey);
      if (!cat) return 0;
      return cat.vendors.filter(v => restrictDlg.form.vendors.includes(v)).length;
    };
    const restrictActiveCat = computed(() => RESTRICT_CATS.find(c => c.key === restrictDlg.activeCat));
    const restrictActiveCatLabel = computed(() => `${restrictActiveCat.value?.label || ''} 厂商`);
    const filteredRestrictVendors = computed(() => {
      if (!restrictActiveCat.value) return [];
      const kw = restrictDlg.search.trim().toLowerCase();
      const list = restrictActiveCat.value.vendors;
      return kw ? list.filter(v => v.toLowerCase().includes(kw)) : list;
    });
    const restrictCatSelectAll = (val) => {
      const cat = restrictActiveCat.value;
      if (!cat) return;
      if (val) {
        cat.vendors.forEach(v => {
          if (!restrictDlg.form.vendors.includes(v)) restrictDlg.form.vendors.push(v);
        });
        if (!restrictDlg.form.cats.includes(cat.key)) restrictDlg.form.cats.push(cat.key);
      } else {
        restrictDlg.form.vendors = restrictDlg.form.vendors.filter(v => !cat.vendors.includes(v));
        restrictDlg.form.cats = restrictDlg.form.cats.filter(c => c !== cat.key);
      }
    };

    return {
      MANUFACTURERS, EDIT_TABS,
      filters, expanded, selection,
      columnOptions, visibleColumns, allColsVisible, someColsVisible, toggleAllCols,
      tableData, pagination, onSelectionChange,
      search, reset, exportData, refreshCache,
      batchEnable, batchDisable,
      editDlg, openAdd, openEdit, confirmEdit, doDelete,
      playwayDlg, openPlayway,
      playwayEditDlg, openPlaywayAdd, openPlaywayEdit, savePlayway,
      initPlaywayEditor, destroyPlaywayEditor,
      oddsDlg, openOdds, onOddsSelect,
      oddsEditDlg, openOddsAdd, openOddsEdit, editSelectedOdds, deleteSelectedOdds, saveOdds,
      confirmDlg, doConfirm,
      /* 游戏限制 */
      RESTRICT_CATS, totalRestrictVendors, restrictConfig, restrictDlg,
      openRestrictions, confirmRestrict,
      toggleRestrictCat, toggleRestrictVendor, countRestrictVendors,
      restrictActiveCatLabel, filteredRestrictVendors, restrictCatSelectAll,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Download: ElementPlusIconsVue.Download,
      Plus: ElementPlusIconsVue.Plus,
      RefreshRight: ElementPlusIconsVue.RefreshRight,
      Operation: ElementPlusIconsVue.Operation,
      Lock: ElementPlusIconsVue.Lock,
      InfoFilled: ElementPlusIconsVue.InfoFilled,
      Edit: ElementPlusIconsVue.Edit,
      Delete: ElementPlusIconsVue.Delete,
    };
  }
});

/* ════════════════════════════════════════════
   游戏管理 / 游戏分类
════════════════════════════════════════════ */
const GmClassify = defineComponent({
  name: 'GmClassify',
  template: '#gm-classify-tpl',
  setup() {
    const filters = reactive({ code: '', name: '', type: '', status: '' });

    /* 11 条全量数据（基于线上实测） */
    const tableData = ref([
      { id: 3,  code: 'populars',  name: 'Platform Recommendation', type: 'game',   status: 'enabled', sort: 1, icon: '', iconLoaded: false, updatedAt: '2025-12-08 08:15:21', updatedBy: 'baicai' },
      { id: 9,  code: 'kerala',    name: 'Kerala Lottery',          type: 'game',   status: 'enabled', sort: 2, icon: '', iconLoaded: false, updatedAt: '2025-11-29 14:07:37', updatedBy: 'jack' },
      { id: 2,  code: 'miniGames', name: 'Original',                type: 'game',   status: 'enabled', sort: 3, icon: '', iconLoaded: false, updatedAt: '2025-07-04 07:23:44', updatedBy: 'darvin' },
      { id: 4,  code: 'slots',     name: 'Slots',                   type: 'vendor', status: 'enabled', sort: 4, icon: '', iconLoaded: false, updatedAt: '2025-12-08 08:18:39', updatedBy: 'jack' },
      { id: 5,  code: 'liveCasino',name: 'Live Casino',             type: 'vendor', status: 'enabled', sort: 5, icon: '', iconLoaded: false, updatedAt: '2025-11-15 16:32:10', updatedBy: 'jack' },
      { id: 8,  code: 'sports',    name: 'Sports',                  type: 'vendor', status: 'enabled', sort: 5, icon: '', iconLoaded: false, updatedAt: '2025-11-27 08:14:53', updatedBy: 'jack' },
      { id: 7,  code: 'casino',    name: 'Casino',                  type: 'vendor', status: 'enabled', sort: 6, icon: '', iconLoaded: false, updatedAt: '2024-09-11 16:18:27', updatedBy: 'jack' },
      { id: 6,  code: 'fishing',   name: 'Fishing',                 type: 'vendor', status: 'enabled', sort: 7, icon: '', iconLoaded: false, updatedAt: '2025-10-20 11:22:08', updatedBy: 'jack' },
      { id: 10, code: 'jackpot',   name: 'Jackpot',                 type: 'game',   status: 'enabled', sort: 0,  icon: '', iconLoaded: false, updatedAt: '2026-01-18 15:10:17', updatedBy: 'jack' },
      { id: 1,  code: 'lottery',   name: 'Lottery',                 type: 'game',   status: 'enabled', sort: -1, icon: '', iconLoaded: false, updatedAt: '2025-11-22 18:20:35', updatedBy: 'jack' },
      { id: 13, code: 'oneCoin',   name: 'One Coin',                type: 'game',   status: 'enabled', sort: -9999999, icon: '', iconLoaded: false, updatedAt: '2026-05-14 15:11:48', updatedBy: 'jack' },
    ]);

    const search = () => ElMessage.success('查询条件已应用');
    const reset = () => {
      Object.assign(filters, { code: '', name: '', type: '', status: '' });
      ElMessage.info('已重置筛选条件');
    };
    const refreshCache = () => ElMessage.success('分类缓存已刷新');

    const moveTop = (row) => {
      const i = tableData.value.findIndex(r => r.id === row.id);
      if (i <= 0) return;
      tableData.value.splice(i, 1);
      tableData.value.unshift(row);
      ElMessage.success(`已将「${row.name}」置顶`);
    };
    const moveUp = (row) => {
      const i = tableData.value.findIndex(r => r.id === row.id);
      if (i <= 0) return;
      [tableData.value[i - 1], tableData.value[i]] = [tableData.value[i], tableData.value[i - 1]];
    };
    const moveDown = (row) => {
      const i = tableData.value.findIndex(r => r.id === row.id);
      if (i === -1 || i >= tableData.value.length - 1) return;
      [tableData.value[i + 1], tableData.value[i]] = [tableData.value[i], tableData.value[i + 1]];
    };

    /* 编辑/新增 */
    const editDlg = reactive({ visible: false, mode: 'add', form: {} });
    const newFormData = () => ({ code: '', name: '', type: 'game', status: 'enabled', sort: 0, icon: '' });
    const openAdd = () => {
      editDlg.mode = 'add';
      editDlg.form = newFormData();
      editDlg.visible = true;
    };
    const openEdit = (row) => {
      editDlg.mode = 'edit';
      editDlg.form = { ...row };
      editDlg.visible = true;
    };
    const confirmEdit = () => {
      if (editDlg.mode === 'add') {
        const newId = Math.max(...tableData.value.map(r => r.id), 0) + 1;
        tableData.value.push({
          ...editDlg.form, id: newId,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          updatedBy: 'admin', iconLoaded: false,
        });
        ElMessage.success('已新增分类');
      } else {
        const t = tableData.value.find(r => r.id === editDlg.form.id);
        if (t) Object.assign(t, editDlg.form, { updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19), updatedBy: 'admin' });
        ElMessage.success('已修改分类');
      }
      editDlg.visible = false;
    };

    /* 分类配置 / 已分类列表弹窗 —— 完整游戏字段（与游戏列表一致） */
    const C_MANUFACTURERS = ['98club', 'CQ9-SLOTS', 'JDB-SLOTS', 'PG', 'PG_SOFT', 'EVOLIVE-LIVE', 'SABA-SPORTS', 'JL-FISHING', 'FC-FISHING'];
    const GAME_POOL = [
      { id: 1,   manufacturer: '98club', icon: '', nameCn: 'Win Go',       nameCustom: 'Win Go',       code: 'winGo',        gameStatus: 'enabled',  maintainStatus: 'ok', sort: 1,  hotSort: 0,  isHot: 'no',  isNew: 'yes', newSort: 1, isRecommend: 'yes', recommendSort: 2, isJackpot: 'no',  jackpotSort: 1, rtp: '97.9', maxWin: 895622222, addTime: '12/03/2024 10:21:08', updateTime: '08/06/2026 19:42:11' },
      { id: 6,   manufacturer: '98club', icon: '', nameCn: '自研飞艇10s',   nameCustom: 'Aviator diy',  code: 'aviator10s',   gameStatus: 'enabled',  maintainStatus: 'ok', sort: 0,  hotSort: -1, isHot: 'yes', isNew: 'no',  newSort: 0, isRecommend: 'no',  recommendSort: 0, isJackpot: 'no',  jackpotSort: 0, rtp: '95.0', maxWin: 10000000,  addTime: '15/04/2024 14:02:11', updateTime: '08/06/2026 19:42:11' },
      { id: 8,   manufacturer: '98club', icon: '', nameCn: 'Money coming',  nameCustom: 'Money coming diy', code: 'moneyComing', gameStatus: 'enabled', maintainStatus: 'ok', sort: 0, hotSort: -1, isHot: 'yes', isNew: 'no', newSort: 0, isRecommend: 'no', recommendSort: 0, isJackpot: 'no', jackpotSort: 0, rtp: '96.0', maxWin: 20000000, addTime: '18/04/2024 09:11:00', updateTime: '07/06/2026 22:14:07' },
      { id: 100, manufacturer: '98club', icon: '', nameCn: '扫雷',          nameCustom: 'Mines diy',    code: '98club_Mines', gameStatus: 'enabled',  maintainStatus: 'ok', sort: 0,  hotSort: -1, isHot: 'yes', isNew: 'no',  newSort: 0, isRecommend: 'no',  recommendSort: 0, isJackpot: 'no',  jackpotSort: 0, rtp: '97.0', maxWin: 5000000,   addTime: '20/04/2024 12:00:00', updateTime: '07/06/2026 22:14:07' },
      { id: 747, manufacturer: 'PG',     icon: '', nameCn: 'Honey Trap of Diao Chan', nameCustom: 'Honey Trap of Diao Chan', code: 'PGS_1', gameStatus: 'enabled', maintainStatus: 'ok', sort: 0, hotSort: 0, isHot: 'no', isNew: 'no', newSort: 0, isRecommend: 'no', recommendSort: 0, isJackpot: 'no', jackpotSort: 0, rtp: '96.5', maxWin: 50000000, addTime: '02/07/2024 13:11:45', updateTime: '30/05/2026 16:48:09' },
      { id: 749, manufacturer: 'PG',     icon: '', nameCn: 'Rise of Apollo', nameCustom: 'Rise of Apollo', code: 'PGS_101', gameStatus: 'disabled', maintainStatus: 'ok', sort: 0, hotSort: 0, isHot: 'no', isNew: 'no', newSort: 0, isRecommend: 'no', recommendSort: 0, isJackpot: 'no', jackpotSort: 0, rtp: '96.8', maxWin: 50000000, addTime: '05/07/2024 10:00:00', updateTime: '30/05/2026 16:48:09' },
      { id: 750, manufacturer: 'PG',     icon: '', nameCn: 'Mermaid Riches', nameCustom: 'Mermaid Riches', code: 'PGS_102', gameStatus: 'disabled', maintainStatus: 'ok', sort: 0, hotSort: 0, isHot: 'no', isNew: 'no', newSort: 0, isRecommend: 'no', recommendSort: 0, isJackpot: 'no', jackpotSort: 0, rtp: '96.9', maxWin: 50000000, addTime: '06/07/2024 10:00:00', updateTime: '30/05/2026 16:48:09' },
      { id: 18,  manufacturer: 'CQ9-SLOTS', icon: '', nameCn: 'Fortune Gods', nameCustom: 'Fortune Gods', code: 'CQ9_fortune_gods', gameStatus: 'enabled', maintainStatus: 'ok', sort: 18, hotSort: 1, isHot: 'yes', isNew: 'no', newSort: 0, isRecommend: 'no', recommendSort: 0, isJackpot: 'no', jackpotSort: 0, rtp: '96.5', maxWin: 50000000, addTime: '20/06/2024 08:30:00', updateTime: '30/05/2026 16:48:09' },
    ];
    const cloneGames = (arr) => arr.map(g => ({ ...g }));
    const defaultConfigFilters = () => ({ manufacturer: '', nameCn: '', nameCustom: '', gameStatus: '', maintainStatus: '', isHot: '', isNew: '', isJackpot: '' });
    const configDlg = reactive({ visible: false, tab: 'assign', categoryName: '', categoryId: null, filters: defaultConfigFilters(), toAssign: [], assigned: [], pool: [] });
    const filteredAssignPool = computed(() => {
      const f = configDlg.filters;
      return configDlg.pool.filter(g =>
        (!f.manufacturer || g.manufacturer === f.manufacturer) &&
        (!f.nameCn || g.nameCn.toLowerCase().includes(f.nameCn.toLowerCase())) &&
        (!f.nameCustom || g.nameCustom.toLowerCase().includes(f.nameCustom.toLowerCase())) &&
        (!f.gameStatus || g.gameStatus === f.gameStatus) &&
        (!f.maintainStatus || g.maintainStatus === f.maintainStatus) &&
        (!f.isHot || g.isHot === f.isHot) &&
        (!f.isNew || g.isNew === f.isNew) &&
        (!f.isJackpot || g.isJackpot === f.isJackpot)
      );
    });
    const configSearch = () => ElMessage.success('查询条件已应用');
    const configReset = () => { Object.assign(configDlg.filters, defaultConfigFilters()); ElMessage.info('已重置筛选条件'); };
    const openConfig = (row) => {
      configDlg.categoryName = row.name;
      configDlg.categoryId = row.id;
      configDlg.tab = 'assign';
      Object.assign(configDlg.filters, defaultConfigFilters());
      configDlg.toAssign = [];
      configDlg.assigned = cloneGames(GAME_POOL.slice(0, 3));
      configDlg.pool = cloneGames(GAME_POOL.slice(3));
      configDlg.visible = true;
    };
    const openAssigned = (row) => { openConfig(row); configDlg.tab = 'assigned'; };
    const confirmAssign = () => {
      if (!configDlg.toAssign.length) return ElMessage.warning('请先勾选游戏');
      const rows = configDlg.toAssign.map(r => ({ ...r }));
      configDlg.assigned.push(...rows);
      configDlg.pool = configDlg.pool.filter(g => !rows.some(r => r.id === g.id));
      configDlg.toAssign = [];
      ElMessage.success(`已确认选中 ${rows.length} 个游戏`);
    };
    const removeAssigned = (row) => {
      const i = configDlg.assigned.findIndex(r => r.id === row.id);
      if (i !== -1) configDlg.assigned.splice(i, 1);
      configDlg.pool.push({ ...row });
      ElMessage.success(`已移除「${row.nameCn}」`);
    };

    /* 厂商配置 / 已配置厂商列表弹窗（仅小类类型=厂商） */
    const VENDOR_POOL = [
      { id: 1, name: '98club',   code: '98club',      status: 'enabled', maintainStatus: 'ok', sort: 3,  apiUrl: 'http://localhost' },
      { id: 2, name: '9Wickets', code: '9Wickets',    status: 'enabled', maintainStatus: 'ok', sort: 4,  apiUrl: 'https://apiinfo.cckk77.net/' },
      { id: 3, name: 'JILI',     code: 'JL-FISHING',  status: 'enabled', maintainStatus: 'ok', sort: -1, apiUrl: 'https://api.jl.com/' },
      { id: 4, name: 'FC',       code: 'FC-FISHING',  status: 'enabled', maintainStatus: 'ok', sort: 0,  apiUrl: 'https://api.fc.com/' },
      { id: 5, name: 'JDB',      code: 'JDB-FISHING', status: 'enabled', maintainStatus: 'ok', sort: 0,  apiUrl: 'https://api.jdb.com/' },
      { id: 6, name: 'PP-LIVE',  code: 'PP-LIVE',     status: 'enabled', maintainStatus: 'ok', sort: 1,  apiUrl: 'https://api.pp.com/' },
    ];
    const vendorDlg = reactive({ visible: false, tab: 'assign', categoryName: '', toAssign: [], assigned: [], pool: [] });
    const openVendorConfig = (row) => {
      vendorDlg.categoryName = row.name;
      vendorDlg.tab = 'assign';
      vendorDlg.toAssign = [];
      vendorDlg.assigned = VENDOR_POOL.slice(0, 2).map(v => ({ ...v }));
      vendorDlg.pool = VENDOR_POOL.slice(2).map(v => ({ ...v }));
      vendorDlg.visible = true;
    };
    const openVendorAssigned = (row) => { openVendorConfig(row); vendorDlg.tab = 'assigned'; };
    const confirmVendorAssign = () => {
      if (!vendorDlg.toAssign.length) return ElMessage.warning('请先勾选厂商');
      const rows = vendorDlg.toAssign.map(r => ({ ...r }));
      vendorDlg.assigned.push(...rows);
      vendorDlg.pool = vendorDlg.pool.filter(v => !rows.some(r => r.id === v.id));
      vendorDlg.toAssign = [];
      ElMessage.success(`已确认选中 ${rows.length} 个厂商`);
    };
    const removeVendorAssigned = (row) => {
      const i = vendorDlg.assigned.findIndex(r => r.id === row.id);
      if (i !== -1) vendorDlg.assigned.splice(i, 1);
      vendorDlg.pool.push({ ...row });
      ElMessage.success(`已移除厂商「${row.name}」`);
    };

    /* 二次确认 */
    const confirmDlg = reactive({ visible: false, title: '', message: '', detail: '', onConfirm: null });
    const askConfirm = ({ title, message, detail, onConfirm }) => {
      Object.assign(confirmDlg, { title, message, detail: detail || '', onConfirm, visible: true });
    };
    const doConfirm = () => { confirmDlg.onConfirm?.(); confirmDlg.visible = false; };
    const doDelete = (row) => askConfirm({
      title: '删除分类',
      message: `确认删除分类「${row.name}」吗？`,
      detail: '删除后该分类下游戏将失去关联，操作不可恢复。',
      onConfirm: () => {
        const i = tableData.value.findIndex(r => r.id === row.id);
        if (i !== -1) tableData.value.splice(i, 1);
        ElMessage.success('已删除');
      },
    });

    return {
      filters, tableData,
      search, reset, refreshCache,
      editDlg, openAdd, openEdit, confirmEdit,
      C_MANUFACTURERS,
      configDlg, filteredAssignPool, configSearch, configReset,
      openConfig, openAssigned, confirmAssign, removeAssigned,
      vendorDlg, openVendorConfig, openVendorAssigned, confirmVendorAssign, removeVendorAssigned,
      confirmDlg, doConfirm, doDelete,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Plus: ElementPlusIconsVue.Plus,
      ArrowDown: ElementPlusIconsVue.ArrowDown,
      RefreshRight: ElementPlusIconsVue.RefreshRight,
    };
  }
});

/* ════════════════════════════════════════════
   游戏管理 / 游戏厂商
════════════════════════════════════════════ */
const GmManufacturer = defineComponent({
  name: 'GmManufacturer',
  template: '#gm-manufacturer-tpl',
  setup() {
    const filters = reactive({ name: '', code: '', status: '', maintainStatus: '' });

    const tableData = ref([
      { id: 1,  name: '98club',     code: '98club',         status: 'enabled', maintainStatus: 'ok', sort: 3,  apiUrl: 'localhost',                      icon: '', iconLoaded: false, gameConfig: '' },
      { id: 2,  name: '9Wickets',   code: '9Wickets',       status: 'enabled', maintainStatus: 'ok', sort: 4,  apiUrl: 'https://apiinfo.cckk77.net/',    icon: '', iconLoaded: false, gameConfig: '{"cert":"wkV2","secret":"u3xq8K..."}' },
      { id: 6,  name: 'JILI',       code: 'JL-FISHING',     status: 'enabled', maintainStatus: 'ok', sort: -1, apiUrl: 'https://api.jili.com/',          icon: '', iconLoaded: false, gameConfig: '{"apiKey":"jl_sk_2026","brandId":"WBG"}' },
      { id: 7,  name: 'FC',         code: 'FC-FISHING',     status: 'enabled', maintainStatus: 'ok', sort: 0,  apiUrl: 'https://hk-api.fcgaming.com/',   icon: '', iconLoaded: false, gameConfig: '{"apiUrl":"https://hk-api.fcgaming.com","secret":"fc_xxx"}' },
      { id: 8,  name: 'PG_SOFT',    code: 'PGS-SLOTS',      status: 'enabled', maintainStatus: 'ok', sort: 1,  apiUrl: 'https://api.pgsoft.com/',        icon: '', iconLoaded: false, gameConfig: '{"merchantId":"WBG_IN","apiKey":"pg_2026"}' },
      { id: 9,  name: 'CQ9',        code: 'CQ9-SLOTS',      status: 'enabled', maintainStatus: 'maintain', sort: 2, apiUrl: 'https://api.cq9.com/',     icon: '', iconLoaded: false, gameConfig: '{"vendorId":"CQ9","secret":"cq9_xxx"}' },
      { id: 10, name: 'JDB',        code: 'JDB-SLOTS',      status: 'enabled', maintainStatus: 'ok', sort: 5,  apiUrl: 'https://api.jdb88.com/',         icon: '', iconLoaded: false, gameConfig: '{"vendor":"JDB","secret":"jdb_sk"}' },
      { id: 12, name: 'TopBet',     code: 'TOPBET-POKER',   status: 'enabled', maintainStatus: 'ok', sort: 6,  apiUrl: 'https://api.topbet.com/',        icon: '', iconLoaded: false, gameConfig: '{"agentId":"WBG_TOP","key":"tb_xxx"}' },
      { id: 13, name: 'SABA',       code: 'SABA-SPORTS',    status: 'enabled', maintainStatus: 'ok', sort: 7,  apiUrl: 'https://api.sabasports.com/',    icon: '', iconLoaded: false, gameConfig: '{"clientId":"WBG_SABA","secret":"saba_xxx","timezone":"Asia/Kolkata"}' },
      { id: 14, name: 'Evolution',  code: 'EVOLIVE-LIVE',   status: 'enabled', maintainStatus: 'ok', sort: 8,  apiUrl: 'https://api.evolutiongaming.com/', icon: '', iconLoaded: false, gameConfig: '{"casinoId":"WBG_EVO","apiToken":"evo_xxx"}' },
    ]);
    const pagination = reactive({ page: 1, size: 20, total: 46 });

    const getConfigKeyCount = (cfg) => {
      if (!cfg) return 0;
      try {
        const obj = typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
        return Object.keys(obj).length;
      } catch (e) { return 0; }
    };
    const formatJson = (cfg) => {
      if (!cfg) return '';
      try {
        const obj = typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
        return JSON.stringify(obj, null, 2);
      } catch (e) { return String(cfg); }
    };

    const search = () => ElMessage.success('查询条件已应用');
    const reset = () => {
      Object.assign(filters, { name: '', code: '', status: '', maintainStatus: '' });
      ElMessage.info('已重置筛选条件');
    };
    const refreshCache = () => ElMessage.success('厂商缓存已刷新');

    /* 厂商配置查看 */
    const configViewDlg = reactive({ visible: false, name: '', json: '' });
    const viewConfig = (row) => {
      configViewDlg.name = row.name;
      configViewDlg.json = row.gameConfig;
      configViewDlg.visible = true;
    };
    const copyJson = () => {
      const text = formatJson(configViewDlg.json);
      navigator.clipboard?.writeText(text).then(() => ElMessage.success('已复制到剪贴板'));
    };

    /* 编辑/新增弹窗 */
    const editDlg = reactive({ visible: false, mode: 'add', form: {} });
    const newFormData = () => ({ name: '', code: '', icon: '', status: 'enabled', maintainStatus: 'ok', sort: 0, apiUrl: '', gameConfig: '' });
    const openAdd = () => { editDlg.mode = 'add'; editDlg.form = newFormData(); editDlg.visible = true; };
    const openEdit = (row) => { editDlg.mode = 'edit'; editDlg.form = { ...row }; editDlg.visible = true; };
    const confirmEdit = () => {
      if (editDlg.form.gameConfig) {
        try { JSON.parse(editDlg.form.gameConfig); }
        catch (e) { ElMessage.error('厂商配置 JSON 格式不合法'); return; }
      }
      ElMessage.success(editDlg.mode === 'add' ? '已新增厂商' : '已修改厂商');
      editDlg.visible = false;
    };

    /* 二次确认 */
    const confirmDlg = reactive({ visible: false, title: '', message: '', detail: '', onConfirm: null });
    const askConfirm = ({ title, message, detail, onConfirm }) => {
      Object.assign(confirmDlg, { title, message, detail: detail || '', onConfirm, visible: true });
    };
    const doConfirm = () => { confirmDlg.onConfirm?.(); confirmDlg.visible = false; };

    const toggleMaintain = (row) => {
      const target = row.maintainStatus === 'maintain' ? 'ok' : 'maintain';
      askConfirm({
        title: target === 'maintain' ? '设为维护' : '解除维护',
        message: `确认${target === 'maintain' ? '将厂商' : '将'}「${row.name}」${target === 'maintain' ? '设为维护中' : '解除维护'}吗？`,
        detail: target === 'maintain' ? '维护期间该厂商所有游戏对玩家不可用。' : '解除后该厂商游戏恢复访问。',
        onConfirm: () => { row.maintainStatus = target; ElMessage.success('操作成功'); },
      });
    };
    const doDelete = (row) => askConfirm({
      title: '删除厂商',
      message: `确认删除厂商「${row.name}」吗？`,
      detail: '删除前请确认该厂商下没有任何关联游戏，否则会导致玩家端异常。',
      onConfirm: () => {
        const i = tableData.value.findIndex(r => r.id === row.id);
        if (i !== -1) tableData.value.splice(i, 1);
        pagination.total -= 1;
        ElMessage.success('已删除');
      },
    });

    return {
      filters, tableData, pagination,
      getConfigKeyCount, formatJson,
      search, reset, refreshCache,
      configViewDlg, viewConfig, copyJson,
      editDlg, openAdd, openEdit, confirmEdit,
      confirmDlg, doConfirm, toggleMaintain, doDelete,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Plus: ElementPlusIconsVue.Plus,
      RefreshRight: ElementPlusIconsVue.RefreshRight,
      DocumentCopy: ElementPlusIconsVue.DocumentCopy,
    };
  }
});

/* ════════════════════════════════════════════
   游戏管理 / 搜索关键词
════════════════════════════════════════════ */
const GmKeyword = defineComponent({
  name: 'GmKeyword',
  template: '#gm-keyword-tpl',
  setup() {
    const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const today = new Date();
    const ymdToday = fmtDate(today);
    const ymdNDaysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return fmtDate(d); };

    const filters = reactive({
      quickRange: '30d',
      dateRange: [ymdNDaysAgo(29), ymdToday],
      minHits: 0,
      maxHits: 99999,
    });

    const setQuickRange = (range) => {
      filters.quickRange = range;
      switch (range) {
        case 'today':     filters.dateRange = [ymdToday, ymdToday]; break;
        case 'yesterday': filters.dateRange = [ymdNDaysAgo(1), ymdNDaysAgo(1)]; break;
        case '7d':        filters.dateRange = [ymdNDaysAgo(6), ymdToday]; break;
        case '30d':       filters.dateRange = [ymdNDaysAgo(29), ymdToday]; break;
      }
      ElMessage.info(`已切换到「${range === 'today' ? '今日' : (range === 'yesterday' ? '昨日' : (range === '7d' ? '近 7 天' : '近 30 天'))}」`);
    };

    /* 近 30 天数据（基于线上实测） */
    const tableData = ref([
      { keyword: 'pappu',         hits: 2, games: [{ game: 'PAPPU',         hits: 2 }] },
      { keyword: 'panda',         hits: 1, games: [{ game: 'Panda Master',  hits: 1 }] },
      { keyword: 'andar',         hits: 1, games: [{ game: 'Andar Bahar',   hits: 1 }] },
      { keyword: 'Fortune Gods',  hits: 1, games: [{ game: 'Fortune Gods',  hits: 1 }] },
    ]);
    const pagination = reactive({ page: 1, size: 20 });

    const stats = computed(() => ({
      total: tableData.value.length,
      totalHits: tableData.value.reduce((s, r) => s + r.hits, 0),
      topKeyword: [...tableData.value].sort((a, b) => b.hits - a.hits)[0]?.keyword || '',
    }));

    const search = () => ElMessage.success('查询条件已应用');
    const reset = () => {
      filters.quickRange = '30d';
      filters.dateRange = [ymdNDaysAgo(29), ymdToday];
      filters.minHits = 0;
      filters.maxHits = 99999;
      ElMessage.info('已重置筛选条件');
    };
    const exportData = () => ElMessage.success('导出任务已提交');

    /* 跳转详情弹窗 */
    const detailDlg = reactive({ visible: false, keyword: '', list: [] });
    const openDetail = (row) => {
      detailDlg.keyword = row.keyword;
      detailDlg.list = row.games;
      detailDlg.visible = true;
    };
    const navigate = Vue.inject('navigate', null);
    const jumpGame = (game) => {
      ElMessage.info(`跳转到「${game}」详情`);
      if (navigate) navigate('gm-list');
      detailDlg.visible = false;
    };

    return {
      filters, setQuickRange,
      tableData, pagination, stats,
      search, reset, exportData,
      detailDlg, openDetail, jumpGame,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Download: ElementPlusIconsVue.Download,
      RefreshRight: ElementPlusIconsVue.RefreshRight,
    };
  }
});

/* ════════════════════════════════════════════
   三方游戏 / 爆大奖管理（配置 + 中奖记录 双 Tab）
════════════════════════════════════════════ */
const TgBigprize = defineComponent({
  name: 'TgBigprize',
  template: '#tg-bigprize-tpl',
  setup() {
    const tab = ref('config');

    /* ── 配置 Tab ── */
    const cfgView = ref('list');
    const cfgSelection = ref([]);
    const formatCap = (n) => n >= 100000 ? '不限' : n;

    /* 配置数据（基于线上 15 条样本） */
    const cfgData = ref([
      { id: 2,  multiMin: 1,  multiMax: 10, betMin: 1,   betMax: 10,     prize: 35,  totalCap: -1, dailyCap: 100, validDays: 15, enabled: true, sort: 1,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'purple', remark: '' },
      { id: 17, multiMin: 2,  multiMax: 10, betMin: 5,   betMax: 15,     prize: 35,  totalCap: -1, dailyCap: 8,   validDays: 10, enabled: true, sort: 2,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'purple', remark: '' },
      { id: 3,  multiMin: 20, multiMax: 34, betMin: 21,  betMax: 50,     prize: 5,   totalCap: -1, dailyCap: -1,  validDays: 8,  enabled: true, sort: 3,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'purple', remark: '' },
      { id: 4,  multiMin: 1,  multiMax: 40, betMin: 20,  betMax: 50,     prize: 15,  totalCap: -1, dailyCap: -1,  validDays: 10, enabled: true, sort: 4,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'jack',   remark: '' },
      { id: 5,  multiMin: 20, multiMax: 34, betMin: 101, betMax: 200,    prize: 25,  totalCap: -1, dailyCap: -1,  validDays: 1,  enabled: true, sort: 5,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'purple', remark: '' },
      { id: 6,  multiMin: 20, multiMax: 34, betMin: 201, betMax: 999999, prize: 50,  totalCap: -1, dailyCap: -1,  validDays: 2,  enabled: true, sort: 6,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin',  remark: '' },
      { id: 16, multiMin: 35, multiMax: 49, betMin: 5,   betMax: 20,     prize: 5,   totalCap: -1, dailyCap: -1,  validDays: 1,  enabled: true, sort: 7,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin',  remark: '' },
      { id: 18, multiMin: 35, multiMax: 49, betMin: 21,  betMax: 50,     prize: 10,  totalCap: -1, dailyCap: -1,  validDays: 1,  enabled: true, sort: 8,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin',  remark: '' },
      { id: 19, multiMin: 35, multiMax: 49, betMin: 51,  betMax: 100,    prize: 30,  totalCap: -1, dailyCap: -1,  validDays: 1,  enabled: true, sort: 9,  updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin',  remark: '' },
      { id: 20, multiMin: 35, multiMax: 49, betMin: 101, betMax: 200,    prize: 60,  totalCap: -1, dailyCap: -1,  validDays: 1,  enabled: true, sort: 10, updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin',  remark: '' },
      { id: 21, multiMin: 35, multiMax: 49, betMin: 201, betMax: 999999, prize: 100, totalCap: -1, dailyCap: -1,  validDays: 1,  enabled: true, sort: 11, updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin',  remark: '' },
      { id: 22, multiMin: 50, multiMax: 999999, betMin: 5,   betMax: 20,  prize: 30, totalCap: -1, dailyCap: -1, validDays: 1,  enabled: true, sort: 12, updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin', remark: '' },
      { id: 23, multiMin: 50, multiMax: 999999, betMin: 21,  betMax: 50,  prize: 80, totalCap: -1, dailyCap: -1, validDays: 1,  enabled: true, sort: 13, updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin', remark: '' },
      { id: 24, multiMin: 50, multiMax: 999999, betMin: 51,  betMax: 100, prize: 150, totalCap: -1, dailyCap: -1, validDays: 1, enabled: true, sort: 14, updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin', remark: '' },
      { id: 25, multiMin: 50, multiMax: 999999, betMin: 101, betMax: 999999, prize: 250, totalCap: -1, dailyCap: -1, validDays: 1, enabled: true, sort: 15, updatedAt: '2026-05-21 14:30:02', updatedBy: 'admin', remark: '' },
    ]);

    /* 矩阵索引 */
    const multiBuckets = computed(() => [...new Set(cfgData.value.map(r => `${r.multiMin}~${r.multiMax}`))]);
    const betBuckets   = computed(() => [...new Set(cfgData.value.map(r => `${r.betMin}~${formatCap(r.betMax)}`))]);
    const matrix = computed(() => {
      const m = {};
      cfgData.value.forEach(r => {
        const mk = `${r.multiMin}~${r.multiMax}`;
        const bk = `${r.betMin}~${formatCap(r.betMax)}`;
        if (!m[mk]) m[mk] = {};
        m[mk][bk] = r;
      });
      return m;
    });

    /* 编辑弹窗 */
    const cfgEditDlg = reactive({ visible: false, mode: 'add', form: {} });
    const newFormData = () => ({
      multiMin: 1, multiMax: 10, betMin: 1, betMax: 100, prize: 10,
      totalCap: 100, totalCapUnlimited: true, dailyCap: 1, dailyCapUnlimited: true,
      validDays: 1, enabled: true, sort: 0, remark: '',
    });
    const openAdd = () => { cfgEditDlg.mode = 'add'; cfgEditDlg.form = newFormData(); cfgEditDlg.visible = true; };
    const openEdit = (row) => {
      cfgEditDlg.mode = 'edit';
      cfgEditDlg.form = { ...row, totalCapUnlimited: row.totalCap === -1, dailyCapUnlimited: row.dailyCap === -1 };
      cfgEditDlg.visible = true;
    };
    const confirmEdit = () => {
      const f = cfgEditDlg.form;
      const r = {
        multiMin: f.multiMin, multiMax: f.multiMax, betMin: f.betMin, betMax: f.betMax,
        prize: f.prize, totalCap: f.totalCapUnlimited ? -1 : f.totalCap, dailyCap: f.dailyCapUnlimited ? -1 : f.dailyCap,
        validDays: f.validDays, enabled: f.enabled, sort: f.sort, remark: f.remark,
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updatedBy: 'cici',
      };
      if (cfgEditDlg.mode === 'add') {
        const newId = Math.max(...cfgData.value.map(x => x.id), 0) + 1;
        cfgData.value.push({ ...r, id: newId });
        ElMessage.success('已新增爆大奖规则');
      } else {
        const t = cfgData.value.find(x => x.id === cfgEditDlg.form.id);
        if (t) Object.assign(t, r);
        ElMessage.success('已修改爆大奖规则');
      }
      cfgEditDlg.visible = false;
    };

    /* 二次确认 */
    const confirmDlg = reactive({ visible: false, title: '', message: '', detail: '', onConfirm: null });
    const askConfirm = ({ title, message, detail, onConfirm }) => Object.assign(confirmDlg, { title, message, detail: detail || '', onConfirm, visible: true });
    const doConfirm = () => { confirmDlg.onConfirm?.(); confirmDlg.visible = false; };

    const toggleOne = (row) => askConfirm({
      title: row.enabled ? '禁用规则' : '启用规则',
      message: `确认${row.enabled ? '禁用' : '启用'}该规则吗？`,
      detail: `倍率 ${row.multiMin}~${row.multiMax}，金额 ${row.betMin}~${formatCap(row.betMax)}，奖金 ${row.prize}`,
      onConfirm: () => { row.enabled = !row.enabled; ElMessage.success('操作成功'); },
    });
    const batchEnable = () => askConfirm({
      title: '批量启用',
      message: `确认批量启用 ${cfgSelection.value.length} 条规则吗？`,
      onConfirm: () => { cfgSelection.value.forEach(r => { r.enabled = true; }); ElMessage.success('已批量启用'); },
    });
    const batchDisable = () => askConfirm({
      title: '批量禁用',
      message: `确认批量禁用 ${cfgSelection.value.length} 条规则吗？`,
      onConfirm: () => { cfgSelection.value.forEach(r => { r.enabled = false; }); ElMessage.success('已批量禁用'); },
    });
    const askAllOn = () => askConfirm({
      title: '全部启用',
      message: `确认启用全部 ${cfgData.value.length} 条规则吗？`,
      detail: '该操作将影响所有爆大奖配置，请谨慎确认。',
      onConfirm: () => { cfgData.value.forEach(r => { r.enabled = true; }); ElMessage.success('已全部启用'); },
    });
    const askAllOff = () => askConfirm({
      title: '全部禁用',
      message: `确认禁用全部 ${cfgData.value.length} 条规则吗？`,
      detail: '禁用后玩家将无法触发任何爆大奖奖励，影响业务，请谨慎确认。',
      onConfirm: () => { cfgData.value.forEach(r => { r.enabled = false; }); ElMessage.success('已全部禁用'); },
    });
    const doDelete = (row) => askConfirm({
      title: '删除规则',
      message: `确认删除该爆大奖规则吗？`,
      detail: `倍率 ${row.multiMin}~${row.multiMax}，金额 ${row.betMin}~${formatCap(row.betMax)}，删除后不可恢复。`,
      onConfirm: () => {
        const i = cfgData.value.findIndex(r => r.id === row.id);
        if (i !== -1) cfgData.value.splice(i, 1);
        ElMessage.success('已删除');
      },
    });

    /* ── 中奖记录 Tab ── */
    const recExpanded = ref(false);
    const REC_MANUFACTURERS = ['TBNEW', '9Wickets', 'INOUTNEW', 'JLNEW', 'PGNEW'];
    const REC_GAMES = ['Cricket', 'Chicken Road 2', 'Mahjong Ways 2', 'Fortune Gods'];

    const recFilters = reactive({
      createdRange: [], claimRange: [], playerId: '', orderNo: '',
      manufacturer: '', game: '', status: '', multiMin: 0, multiMax: 9999,
    });

    const recColumnOptions = reactive([
      { prop: 'playerId',    label: '玩家ID',     width: 90,  align: 'left',   visible: true,  required: true },
      { prop: 'orderNo',     label: '订单号',     width: 240, visible: true,  required: true },
      { prop: 'gameName',    label: '游戏名称',   width: 130, visible: true },
      { prop: 'manufacturer',label: '游戏厂商',   width: 110, visible: true },
      { prop: 'betAmount',   label: '投注额',     width: 80,  align: 'right', visible: true },
      { prop: 'effectiveBet',label: '有效投注',   width: 90,  align: 'right', visible: true },
      { prop: 'prizeAmount', label: '派奖金额',   width: 100, align: 'right', visible: true },
      { prop: 'profit',      label: '盈亏',       width: 90,  align: 'right', visible: true, slot: true },
      { prop: 'status',      label: '领取状态',   width: 100, align: 'center', visible: true, slot: true },
      { prop: 'multi',       label: '投注倍数',   width: 90,  align: 'right', visible: false },
      { prop: 'settleAt',    label: '结算时间',   width: 165, visible: false },
      { prop: 'claimAt',     label: '领取时间',   width: 165, visible: false },
      { prop: 'expireAt',    label: '失效时间',   width: 165, visible: false },
      { prop: 'createdAt',   label: '创建时间',   width: 165, visible: false },
    ]);
    const visibleRecColumns = computed(() => recColumnOptions.filter(c => c.visible));
    const allRecColsVisible = computed(() => recColumnOptions.every(c => c.visible));
    const someRecColsVisible = computed(() => recColumnOptions.some(c => c.visible) && !allRecColsVisible.value);
    const toggleAllRecCols = (val) => recColumnOptions.forEach(c => { if (!c.required) c.visible = val; });

    const recStatusType = (s) => s === 'claimed' ? 'success' : (s === 'expired' ? 'info' : 'warning');
    const recStatusLabel = (s) => s === 'claimed' ? '已领取' : (s === 'expired' ? '已过期' : '未领取');

    /* 中奖数据（基于线上 76 条样本） */
    const recData = ref([
      { playerId: 48165, orderNo: 'JLNEW1_329169_2434367142_2', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 10, effectiveBet: 10, prizeAmount: 26.2, profit: 16.2, multi: 2.62, status: 'unclaimed', settleAt: '2026-05-21 13:39:02', claimAt: '', expireAt: '2026-06-05 13:55', createdAt: '2026-05-21 13:55:00' },
      { playerId: 48165, orderNo: 'JLNEW0_329171_2434370822_2', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 10, effectiveBet: 10, prizeAmount: 30.6, profit: 20.6, multi: 3.06, status: 'unclaimed', settleAt: '2026-05-21 13:39:52', claimAt: '', expireAt: '2026-06-05 13:55', createdAt: '2026-05-21 13:55:00' },
      { playerId: 48165, orderNo: 'JLNEW1_329171_2434370840_1', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 10, effectiveBet: 10, prizeAmount: 20.9, profit: 10.9, multi: 2.09, status: 'unclaimed', settleAt: '2026-05-21 13:39:52', claimAt: '', expireAt: '2026-06-05 13:55', createdAt: '2026-05-21 13:55:00' },
      { playerId: 48165, orderNo: 'JLNEW0_329169_2434367125_1', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 10, effectiveBet: 10, prizeAmount: 21,   profit: 11,   multi: 2.1,  status: 'unclaimed', settleAt: '2026-05-21 13:39:02', claimAt: '', expireAt: '2026-06-05 13:55', createdAt: '2026-05-21 13:55:00' },
      { playerId: 48165, orderNo: 'JLNEW0_329180_2434383311_1', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 14.06, effectiveBet: 11.24, prizeAmount: 25.3, profit: 11.24, multi: 2.25, status: 'unclaimed', settleAt: '2026-05-21 13:42:21', claimAt: '', expireAt: '2026-05-31 13:55', createdAt: '2026-05-21 13:55:00' },
      { playerId: 48165, orderNo: 'JLNEW0_329158_2434348746_1', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 13.47, effectiveBet: 12.66, prizeAmount: 26.13, profit: 12.66, multi: 2.06, status: 'unclaimed', settleAt: '2026-05-21 13:34:43', claimAt: '', expireAt: '2026-05-31 13:50', createdAt: '2026-05-21 13:50:00' },
      { playerId: 48165, orderNo: 'JLNEW0_329162_2434355376_1', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 14.47, effectiveBet: 11.86, prizeAmount: 26.33, profit: 11.86, multi: 2.22, status: 'unclaimed', settleAt: '2026-05-21 13:36:28', claimAt: '', expireAt: '2026-05-31 13:50', createdAt: '2026-05-21 13:50:00' },
      { playerId: 48165, orderNo: 'JLNEW1_329156_2434345231_3', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 10,    effectiveBet: 10,    prizeAmount: 30.5,  profit: 20.5,  multi: 3.05, status: 'unclaimed', settleAt: '2026-05-21 13:34:13', claimAt: '', expireAt: '2026-06-05 13:50', createdAt: '2026-05-21 13:50:00' },
    ]);
    const recPagination = reactive({ page: 1, size: 20, total: 76 });
    const recStats = computed(() => {
      const total = recData.value.reduce((s, r) => s + r.prizeAmount, 0);
      const claimed = recData.value.filter(r => r.status === 'claimed').reduce((s, r) => s + r.prizeAmount, 0);
      return { total: Math.round(total * 100) / 100, claimed: Math.round(claimed * 100) / 100, unclaimed: Math.round((total - claimed) * 100) / 100, count: recPagination.total };
    });
    const recSearch = () => ElMessage.success('查询条件已应用');
    const recReset = () => {
      Object.assign(recFilters, { createdRange: [], claimRange: [], playerId: '', orderNo: '', manufacturer: '', game: '', status: '', multiMin: 0, multiMax: 9999 });
      ElMessage.info('已重置筛选条件');
    };
    const recExport = () => ElMessage.success('导出任务已提交');

    /* 任务列表弹窗 */
    const recTaskDlg = reactive({ visible: false, data: [
      { id: 758, filename: '爆大奖中奖数据(1条).xlsx',  total: 1,  done: 1,  status: 'done', createdBy: 'michael',  createdAt: '2024-10-31 16:46:26' },
      { id: 632, filename: '爆大奖中奖数据(11条).xlsx', total: 11, done: 11, status: 'done', createdBy: 'suolan',   createdAt: '2024-08-20 14:28:03' },
      { id: 538, filename: '爆大奖中奖数据(11条).xlsx', total: 11, done: 11, status: 'done', createdBy: 'admin',    createdAt: '2024-08-13 15:15:28' },
      { id: 460, filename: '爆大奖中奖数据(10条).xlsx', total: 10, done: 10, status: 'done', createdBy: 'admin',    createdAt: '2024-08-11 11:18:32' },
      { id: 435, filename: '爆大奖中奖数据(10条).xlsx', total: 10, done: 10, status: 'done', createdBy: 'kaitechen',createdAt: '2024-08-10 20:17:01' },
    ] });

    return {
      tab,
      cfgView, cfgSelection, cfgData, formatCap,
      multiBuckets, betBuckets, matrix,
      cfgEditDlg, openAdd, openEdit, confirmEdit,
      toggleOne, batchEnable, batchDisable, askAllOn, askAllOff, doDelete,
      confirmDlg, doConfirm,
      recExpanded, REC_MANUFACTURERS, REC_GAMES, recFilters,
      recColumnOptions, visibleRecColumns, allRecColsVisible, someRecColsVisible, toggleAllRecCols,
      recStatusType, recStatusLabel, recData, recPagination, recStats,
      recSearch, recReset, recExport, recTaskDlg,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Download: ElementPlusIconsVue.Download,
      Plus: ElementPlusIconsVue.Plus,
      RefreshRight: ElementPlusIconsVue.RefreshRight,
      Operation: ElementPlusIconsVue.Operation,
      Document: ElementPlusIconsVue.Document,
    };
  }
});

/* ════════════════════════════════════════════
   三方游戏 / 余额回收
════════════════════════════════════════════ */
const TgWithdraw = defineComponent({
  name: 'TgWithdraw',
  template: '#tg-withdraw-tpl',
  setup() {
    const tab = ref('now');

    /* ── 即时回收 ── */
    const nowFilters = reactive({ playerId: '' });
    const nowQueried = ref(false);
    const nowSelection = ref([]);
    const nowData = ref([]);

    const queryBalance = () => {
      if (!nowFilters.playerId) {
        ElMessage.warning('请输入玩家ID');
        return;
      }
      /* mock 数据：基于线上玩家 48165 */
      nowData.value = [
        { playerId: nowFilters.playerId, vendorCode: 'ZF986ZT',     vendorName: 'Game',   balance: 0 },
        { playerId: nowFilters.playerId, vendorCode: 'TopBet',      vendorName: 'TopBet', balance: 0 },
        { playerId: nowFilters.playerId, vendorCode: 'PGSingle',    vendorName: 'PGS',    balance: 0 },
        { playerId: nowFilters.playerId, vendorCode: 'ZF986Single', vendorName: 'Sports', balance: 156.78 },
      ];
      nowQueried.value = true;
      ElMessage.success('查询完成');
    };
    const resetBalance = () => {
      nowFilters.playerId = '';
      nowData.value = [];
      nowQueried.value = false;
      nowSelection.value = [];
    };

    const nowTotalBalance = computed(() => nowData.value.reduce((s, r) => s + r.balance, 0).toFixed(2));
    const nowRecyclable = computed(() => nowData.value.filter(r => r.balance > 0).reduce((s, r) => s + r.balance, 0).toFixed(2));

    /* 二次确认 */
    const confirmDlg = reactive({ visible: false, title: '', message: '', detail: '', onConfirm: null });
    const askConfirm = ({ title, message, detail, onConfirm }) => Object.assign(confirmDlg, { title, message, detail: detail || '', onConfirm, visible: true });
    const doConfirm = () => { confirmDlg.onConfirm?.(); confirmDlg.visible = false; };

    const askSingleRecycle = (row) => askConfirm({
      title: '取回余额',
      message: `确认从「${row.vendorName}」取回余额吗？`,
      detail: `玩家 ${row.playerId}，金额 ₹${row.balance}，取回后将进入玩家主钱包。`,
      onConfirm: () => {
        row.balance = 0;
        ElMessage.success(`已取回「${row.vendorName}」余额`);
      },
    });
    const askBatchRecycle = () => {
      const total = nowSelection.value.reduce((s, r) => s + r.balance, 0).toFixed(2);
      askConfirm({
        title: '批量回收',
        message: `确认批量回收 ${nowSelection.value.length} 个三方厂商余额吗？`,
        detail: `合计 ₹${total}，回收后将进入玩家主钱包，操作不可撤销。`,
        onConfirm: () => {
          nowSelection.value.forEach(r => { r.balance = 0; });
          ElMessage.success('批量回收完成');
        },
      });
    };
    const askAllRecycle = () => {
      const total = nowRecyclable.value;
      const count = nowData.value.filter(r => r.balance > 0).length;
      askConfirm({
        title: '一键回收全部',
        message: `确认回收玩家 ${nowFilters.playerId} 在所有三方厂商的余额吗？`,
        detail: `共 ${count} 个厂商，合计 ₹${total}，操作不可撤销。`,
        onConfirm: () => {
          nowData.value.forEach(r => { r.balance = 0; });
          ElMessage.success('全部回收完成');
        },
      });
    };

    /* 批量导入弹窗 */
    const batchImportDlg = reactive({ visible: false });
    const downloadTpl = () => ElMessage.success('模板已下载');
    const askBatchImport = () => {
      askConfirm({
        title: '确认导入',
        message: '确认开始批量导入回收任务吗？',
        detail: '导入后系统将自动调用各厂商接口取回余额，处理进度可在「回收记录」Tab 查看。',
        onConfirm: () => {
          batchImportDlg.visible = false;
          ElMessage.success('批量导入任务已提交');
        },
      });
    };

    /* ── 回收记录 ── */
    const HIS_VENDORS = ['ZF986ZT', 'TopBet', 'PGSingle', 'ZF986Single', 'EVOLIVE', 'INOUTNEW', 'JLNEW'];
    const hisFilters = reactive({ dateRange: [], playerId: '', vendor: '', status: '' });
    const hisData = ref([
      { id: 9521, playerId: 48165, vendor: 'ZF986Single', amount: 156.78, status: 'success', errorMsg: '', operator: 'cici',    operatedAt: '2026-05-21 17:43:10' },
      { id: 9520, playerId: 32335, vendor: 'EVOLIVE',     amount: 2500,   status: 'success', errorMsg: '', operator: 'admin',   operatedAt: '2026-05-21 14:22:01' },
      { id: 9519, playerId: 99975951, vendor: 'TopBet',   amount: 800,    status: 'failed',  errorMsg: '调用ZF返回：需返回',  operator: 'admin',   operatedAt: '2026-05-21 11:08:55' },
      { id: 9518, playerId: 47964,   vendor: 'JLNEW',     amount: 50.5,   status: 'success', errorMsg: '', operator: 'system',  operatedAt: '2026-05-20 23:12:40' },
      { id: 9517, playerId: 46995,   vendor: 'INOUTNEW',  amount: 1280,   status: 'success', errorMsg: '', operator: 'baicai',  operatedAt: '2026-05-20 18:45:22' },
      { id: 9516, playerId: 30798,   vendor: 'ZF986ZT',   amount: 12.24,  status: 'failed',  errorMsg: '处理异常：账变记录订单不存在', operator: 'system', operatedAt: '2026-05-20 09:30:00' },
    ]);
    const hisPagination = reactive({ page: 1, size: 20, total: 6 });
    const hisStats = computed(() => ({
      totalAmount: hisData.value.filter(r => r.status === 'success').reduce((s, r) => s + r.amount, 0).toFixed(2),
      successCount: hisData.value.filter(r => r.status === 'success').length,
      failedCount: hisData.value.filter(r => r.status === 'failed').length,
    }));
    const hisSearch = () => ElMessage.success('查询条件已应用');
    const hisReset = () => {
      Object.assign(hisFilters, { dateRange: [], playerId: '', vendor: '', status: '' });
      ElMessage.info('已重置筛选条件');
    };
    const hisExport = () => ElMessage.success('导出任务已提交');

    return {
      tab,
      nowFilters, nowQueried, nowSelection, nowData,
      nowTotalBalance, nowRecyclable,
      queryBalance, resetBalance,
      askSingleRecycle, askBatchRecycle, askAllRecycle,
      batchImportDlg, downloadTpl, askBatchImport,
      HIS_VENDORS, hisFilters, hisData, hisPagination, hisStats,
      hisSearch, hisReset, hisExport,
      confirmDlg, doConfirm,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Download: ElementPlusIconsVue.Download,
      Upload: ElementPlusIconsVue.Upload,
      RefreshRight: ElementPlusIconsVue.RefreshRight,
    };
  }
});

/* ════════════════════════════════════════════
   三方游戏 / RTP 配置（主从布局）
════════════════════════════════════════════ */
const TgRtp = defineComponent({
  name: 'TgRtp',
  template: '#tg-rtp-tpl',
  setup() {
    /* 分类列表 */
    const categories = ref([
      { id: 1, name: 'VIP_HIGH',   rtpMin: 95, rtpMax: 98, enabled: true,  sort: 1, remark: '高 VIP 玩家专属高返水', playerCount: 12 },
      { id: 2, name: 'VIP_MID',    rtpMin: 92, rtpMax: 95, enabled: true,  sort: 2, remark: '中 VIP 玩家',           playerCount: 28 },
      { id: 3, name: 'VIP_LOW',    rtpMin: 88, rtpMax: 92, enabled: true,  sort: 3, remark: '初级 VIP',              playerCount: 56 },
      { id: 4, name: 'RISK_HIGH',  rtpMin: 75, rtpMax: 85, enabled: true,  sort: 4, remark: '高风险玩家降低 RTP',     playerCount: 8 },
      { id: 5, name: 'RISK_LOW',   rtpMin: 85, rtpMax: 92, enabled: false, sort: 5, remark: '已停用',                 playerCount: 0 },
    ]);
    const catSearch = ref('');
    const activeCatId = ref(1);
    const filteredCats = computed(() => {
      const kw = catSearch.value.trim().toLowerCase();
      return kw ? categories.value.filter(c => c.name.toLowerCase().includes(kw)) : categories.value;
    });
    const activeCat = computed(() => categories.value.find(c => c.id === activeCatId.value));

    /* 玩家映射：catId -> player list */
    const playerMap = reactive({
      1: [
        { playerId: 99975951, account: 'vipking',     vipLevel: 'VIP8', addedAt: '2026-05-15 10:22:14', addedBy: 'cici'   },
        { playerId: 99976202, account: 'goldroller',  vipLevel: 'VIP7', addedAt: '2026-05-14 16:08:50', addedBy: 'admin' },
        { playerId: 99976197, account: 'roulette88',  vipLevel: 'VIP7', addedAt: '2026-05-13 21:35:02', addedBy: 'admin' },
        { playerId: 99976203, account: 'highroller9', vipLevel: 'VIP6', addedAt: '2026-05-13 19:12:33', addedBy: 'jack'  },
      ],
      2: [
        { playerId: 48165, account: 'cricketfan48',   vipLevel: 'VIP5', addedAt: '2026-04-20 09:30:11', addedBy: 'admin' },
        { playerId: 47964, account: 'jungleking47',   vipLevel: 'VIP5', addedAt: '2026-04-18 15:42:08', addedBy: 'cici'  },
        { playerId: 46995, account: 'chickenroad46',  vipLevel: 'VIP4', addedAt: '2026-04-15 11:20:00', addedBy: 'admin' },
      ],
      3: [], 4: [], 5: [],
    });
    const activePlayers = computed(() => playerMap[activeCatId.value] || []);
    const playerSelection = ref([]);
    const playerFilter = reactive({ id: '', dateRange: [] });
    const playerPagination = reactive({ page: 1, size: 20 });

    const filterPlayers = () => ElMessage.success('已应用筛选');
    const resetPlayerFilter = () => { playerFilter.id = ''; playerFilter.dateRange = []; ElMessage.info('已重置'); };

    /* 二次确认 */
    const confirmDlg = reactive({ visible: false, title: '', message: '', detail: '', onConfirm: null });
    const askConfirm = ({ title, message, detail, onConfirm }) => Object.assign(confirmDlg, { title, message, detail: detail || '', onConfirm, visible: true });
    const doConfirm = () => { confirmDlg.onConfirm?.(); confirmDlg.visible = false; };

    /* 新增/编辑分类 */
    const catDlg = reactive({ visible: false, mode: 'add', form: {} });
    const newCatForm = () => ({ name: '', rtpMin: 90, rtpMax: 95, enabled: true, sort: 0, remark: '' });
    const openAddCat = () => { catDlg.mode = 'add'; catDlg.form = newCatForm(); catDlg.visible = true; };
    const openEditCat = (cat) => { catDlg.mode = 'edit'; catDlg.form = { ...cat }; catDlg.visible = true; };
    const confirmCat = () => {
      if (catDlg.form.rtpMin >= catDlg.form.rtpMax) {
        ElMessage.error('RTP 区间最小值必须小于最大值'); return;
      }
      if (catDlg.mode === 'add') {
        const newId = Math.max(...categories.value.map(c => c.id), 0) + 1;
        categories.value.push({ ...catDlg.form, id: newId, playerCount: 0 });
        playerMap[newId] = [];
        ElMessage.success('已新增分类');
      } else {
        const t = categories.value.find(c => c.id === catDlg.form.id);
        if (t) Object.assign(t, catDlg.form);
        ElMessage.success('已修改分类');
      }
      catDlg.visible = false;
    };
    const toggleCat = (cat) => askConfirm({
      title: cat.enabled ? '禁用分类' : '启用分类',
      message: `确认${cat.enabled ? '禁用' : '启用'}分类「${cat.name}」吗？`,
      detail: cat.enabled ? '禁用后该分类下玩家将不再应用此 RTP 区间。' : '启用后该分类下玩家立即生效。',
      onConfirm: () => { cat.enabled = !cat.enabled; ElMessage.success('操作成功'); },
    });
    const askDeleteCat = (cat) => askConfirm({
      title: '删除分类',
      message: `确认删除分类「${cat.name}」吗？`,
      detail: `该分类下还有 ${cat.playerCount} 个玩家，删除后玩家将恢复到默认 RTP。`,
      onConfirm: () => {
        const i = categories.value.findIndex(c => c.id === cat.id);
        if (i !== -1) categories.value.splice(i, 1);
        delete playerMap[cat.id];
        if (activeCatId.value === cat.id) activeCatId.value = categories.value[0]?.id || null;
        ElMessage.success('已删除');
      },
    });

    /* 添加玩家 */
    const PLAYER_POOL = [
      { playerId: 33056, account: 'roulettelive33', vipLevel: 'VIP3', rtp: 92.5 },
      { playerId: 32335, account: 'cricketcrash32', vipLevel: 'VIP4', rtp: 93.8 },
      { playerId: 99973339, account: 'newjoiner99',  vipLevel: 'VIP2', rtp: 90.0 },
      { playerId: 30649, account: 'slotsplayer30',   vipLevel: 'VIP3', rtp: 91.2 },
      { playerId: 33043, account: 'depositer33',     vipLevel: 'VIP2', rtp: 89.5 },
      { playerId: 30390, account: 'highdeposit30',   vipLevel: 'VIP5', rtp: 94.7 },
      { playerId: 20010, account: 'withdrawer20',    vipLevel: 'VIP4', rtp: 92.1 },
      { playerId: 30798, account: 'badluck30',       vipLevel: 'VIP1', rtp: 80.0 },
    ];
    const addPlayerDlg = reactive({ visible: false, search: '', toAdd: [] });
    const filteredCandidates = computed(() => {
      const kw = addPlayerDlg.search.trim().toLowerCase();
      const existing = activePlayers.value.map(p => p.playerId);
      const pool = PLAYER_POOL.filter(p => !existing.includes(p.playerId));
      return kw ? pool.filter(p => String(p.playerId).includes(kw) || p.account.toLowerCase().includes(kw)) : pool;
    });
    const openAddPlayer = () => { addPlayerDlg.search = ''; addPlayerDlg.toAdd = []; addPlayerDlg.visible = true; };
    const confirmAddPlayers = () => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      addPlayerDlg.toAdd.forEach(p => {
        playerMap[activeCatId.value].push({ playerId: p.playerId, account: p.account, vipLevel: p.vipLevel, addedAt: now, addedBy: 'cici' });
      });
      activeCat.value.playerCount = playerMap[activeCatId.value].length;
      ElMessage.success(`已添加 ${addPlayerDlg.toAdd.length} 个玩家到「${activeCat.value.name}」`);
      addPlayerDlg.visible = false;
    };

    /* 移除玩家 */
    const askRemovePlayer = (row) => askConfirm({
      title: '移除玩家',
      message: `确认从「${activeCat.value.name}」移除玩家 ${row.playerId} 吗？`,
      detail: '移除后该玩家将恢复到默认 RTP 配置。',
      onConfirm: () => {
        const list = playerMap[activeCatId.value];
        const i = list.findIndex(p => p.playerId === row.playerId);
        if (i !== -1) list.splice(i, 1);
        activeCat.value.playerCount = list.length;
        ElMessage.success('已移除');
      },
    });
    const askBatchRemove = () => askConfirm({
      title: '批量移除',
      message: `确认从「${activeCat.value.name}」批量移除 ${playerSelection.value.length} 个玩家吗？`,
      detail: '移除后这些玩家将恢复到默认 RTP 配置。',
      onConfirm: () => {
        const ids = new Set(playerSelection.value.map(p => p.playerId));
        playerMap[activeCatId.value] = playerMap[activeCatId.value].filter(p => !ids.has(p.playerId));
        activeCat.value.playerCount = playerMap[activeCatId.value].length;
        playerSelection.value = [];
        ElMessage.success('已批量移除');
      },
    });

    /* 批量导入 */
    const batchImportDlg = reactive({ visible: false });

    return {
      categories, catSearch, filteredCats, activeCatId, activeCat,
      activePlayers, playerSelection, playerFilter, playerPagination,
      filterPlayers, resetPlayerFilter,
      catDlg, openAddCat, openEditCat, confirmCat, toggleCat, askDeleteCat,
      addPlayerDlg, filteredCandidates, openAddPlayer, confirmAddPlayers,
      askRemovePlayer, askBatchRemove,
      batchImportDlg,
      confirmDlg, doConfirm,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Plus: ElementPlusIconsVue.Plus,
      Upload: ElementPlusIconsVue.Upload,
      Download: ElementPlusIconsVue.Download,
      Delete: ElementPlusIconsVue.Delete,
      MoreFilled: ElementPlusIconsVue.MoreFilled,
    };
  }
});

/* ════════════════════════════════════════════
   三方游戏 / 三方投注订单（4 合 1）
════════════════════════════════════════════ */
const TgOrders = defineComponent({
  name: 'TgOrders',
  template: '#tg-orders-tpl',
  setup() {
    const TYPE_TABS = [
      { key: 'all',   label: '全部' },
      { key: 'slot',  label: '电子' },
      { key: 'sport', label: '体育' },
      { key: 'live',  label: '真人' },
      { key: 'poker', label: '棋牌' },
    ];
    const orderType = ref('all');
    const expanded = ref(false);
    const currentTab = computed(() => TYPE_TABS.find(t => t.key === orderType.value));

    /* 各类型厂商 & 子游戏 */
    const TYPE_DATA = {
      slot:  { manufacturers: ['INOUTNEW', 'TBNEW', 'JLNEW', 'PGNEW', 'CQ9', 'PG_SOFT'], subGames: ['Chicken Road 2', 'Cricket', 'Mahjong Ways 2', 'Fortune Gods', 'Sweet Bonanza'] },
      sport: { manufacturers: ['9Wickets', 'SABA-SPORTS'],                                 subGames: ['CRICKET_CRASH NONE', 'IPL 2026', 'Football Live'] },
      live:  { manufacturers: ['EVOLIVE', 'EZUGI', 'BG-LIVE', 'PP-LIVE'],                  subGames: ['Immersive Roulette', 'Crazy Time', 'Lightning Roulette', 'Dragon Tiger'] },
      poker: { manufacturers: ['TopBet', 'HB-POKER', 'JL-POKER', 'QM-POKER'],              subGames: ['Keno80', 'Texas Hold\'em', 'Andar Bahar', 'Teen Patti'] },
    };
    const currentManufacturers = computed(() => orderType.value === 'all'
      ? [...new Set(Object.values(TYPE_DATA).flatMap(d => d.manufacturers))]
      : TYPE_DATA[orderType.value]?.manufacturers || []);
    const currentSubGames = computed(() => orderType.value === 'all'
      ? [...new Set(Object.values(TYPE_DATA).flatMap(d => d.subGames))]
      : TYPE_DATA[orderType.value]?.subGames || []);

    /* 列定义（动态：含/不含 game type 列） */
    const columnOptions = reactive([
      { prop: 'playerId',     label: '会员ID',    width: 90,  align: 'center', visible: true, required: true, slot: true },
      { prop: 'gameType',     label: '游戏类型',   width: 90,  align: 'center', visible: true },
      { prop: 'orderNo',      label: '订单号',     width: 240, visible: true, required: true },
      { prop: 'roundNo',      label: '游戏局号',   width: 200, visible: false },
      { prop: 'gameName',     label: '游戏名称',   width: 150, visible: true },
      { prop: 'manufacturer', label: '游戏厂商',   width: 110, visible: true },
      { prop: 'betAmount',    label: '投注金额',   width: 100, align: 'right', visible: true },
      { prop: 'effectiveBet', label: '有效投注',   width: 100, align: 'right', visible: true },
      { prop: 'prizeAmount',  label: '派奖金额',   width: 100, align: 'right', visible: true },
      { prop: 'profit',       label: '盈亏',       width: 90,  align: 'right', visible: true, slot: true },
      { prop: 'status',       label: '状态',       width: 90,  align: 'center', visible: true, slot: true },
      { prop: 'betAt',        label: '投注时间',   width: 165, visible: true },
      { prop: 'settleAt',     label: '结算时间',   width: 165, visible: false },
      { prop: 'pullAt',       label: '拉取时间',   width: 165, visible: false },
      { prop: 'parentId',     label: '上级ID',     width: 90,  align: 'center', visible: false },
    ]);
    const visibleColumns = computed(() => columnOptions.filter(c => c.visible));
    const allColsVisible = computed(() => columnOptions.every(c => c.visible));
    const someColsVisible = computed(() => columnOptions.some(c => c.visible) && !allColsVisible.value);
    const toggleAllCols = (val) => columnOptions.forEach(c => { if (!c.required) c.visible = val; });

    /* 数据：每种类型分别 mock 一些样本（基于线上实测） */
    const DATA_BY_TYPE = {
      slot: [
        { playerId: 48167, gameType: '电子', orderNo: 'JLNEW750c1e7a-c816-dab9-eba3be-1bd01eaccf', roundNo: '750c1e7a-c816-dab9-eba3be-1bd01eaccf', gameName: 'Chicken Road 2', manufacturer: 'INOUTNEW', betAmount: 10, effectiveBet: 10, prizeAmount: 0,  profit: -10, status: 'settled', betAt: '2026-05-21 14:14:38', settleAt: '2026-05-21 14:14:38', pullAt: '2026-05-21 14:17:06', parentId: '' },
        { playerId: 46995, gameType: '电子', orderNo: 'JLNEWf707c21b-3e36-6e92-3339c3-fabb8c7b30', roundNo: 'f707c21b-3e36-6e92-3339c3-fabb8c7b30', gameName: 'Chicken Road 2', manufacturer: 'INOUTNEW', betAmount: 10, effectiveBet: 10, prizeAmount: 0,  profit: -10, status: 'settled', betAt: '2026-05-21 14:13:16', settleAt: '2026-05-21 14:13:16', pullAt: '2026-05-21 15:36:34', parentId: '' },
        { playerId: 48165, gameType: '电子', orderNo: 'JLNEW0_329182_2434386352_1', roundNo: '0_329182_2434386352_1', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 10,    effectiveBet: 10,    prizeAmount: 0,    profit: -10,    status: 'settled', betAt: '2026-05-21 13:42:46', settleAt: '2026-05-21 13:42:46', pullAt: '2026-05-21 13:45:06', parentId: '' },
        { playerId: 48165, gameType: '电子', orderNo: 'JLNEW0_329181_2434385006_1', roundNo: '0_329181_2434385006_1', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 15,    effectiveBet: 15,    prizeAmount: 0,    profit: -15,    status: 'settled', betAt: '2026-05-21 13:42:35', settleAt: '2026-05-21 13:42:35', pullAt: '2026-05-21 13:44:36', parentId: '' },
        { playerId: 48165, gameType: '电子', orderNo: 'JLNEW0_329180_2434383311_1', roundNo: '0_329180_2434383311_1', gameName: 'Cricket', manufacturer: 'TBNEW', betAmount: 14.06, effectiveBet: 11.24, prizeAmount: 25.3, profit: 11.24,  status: 'settled', betAt: '2026-05-21 13:42:21', settleAt: '2026-05-21 13:42:21', pullAt: '2026-05-21 13:44:36', parentId: '' },
      ],
      sport: [
        { playerId: 32335, gameType: '体育', orderNo: '9Wickets-54746660-292015', roundNo: '', gameName: 'CRICKET_CRASH NONE', manufacturer: '9Wickets', betAmount: 600, effectiveBet: 600, prizeAmount: 0, profit: -600, status: 'settled', betAt: '2026-05-16 07:48:26', settleAt: '2026-05-16 07:48:50', pullAt: '2026-05-16 07:51:01', parentId: '' },
        { playerId: 32335, gameType: '体育', orderNo: '9Wickets-54746660-292014', roundNo: '', gameName: 'CRICKET_CRASH NONE', manufacturer: '9Wickets', betAmount: 600, effectiveBet: 600, prizeAmount: 0, profit: -600, status: 'settled', betAt: '2026-05-16 07:48:25', settleAt: '2026-05-16 07:48:50', pullAt: '2026-05-16 07:51:01', parentId: '' },
        { playerId: 32335, gameType: '体育', orderNo: '9Wickets-54746626-292002', roundNo: '', gameName: 'CRICKET_CRASH NONE', manufacturer: '9Wickets', betAmount: 600, effectiveBet: 600, prizeAmount: 0, profit: -600, status: 'settled', betAt: '2026-05-16 07:47:57', settleAt: '2026-05-16 07:48:23', pullAt: '2026-05-16 07:50:01', parentId: '' },
      ],
      live: [
        { playerId: 33056,    gameType: '真人', orderNo: 'AUTO_LIVE_7417419120246792130', roundNo: '030117684505239251000945', gameName: '',                   manufacturer: 'EVOLIVE', betAmount: 100,  effectiveBet: 100,  prizeAmount: 0, profit: -100,  status: 'settled', betAt: '2026-04-15 10:22:11', settleAt: '2026-04-15 10:22:30', pullAt: '2026-04-15 10:25:01', parentId: '' },
        { playerId: 99976202, gameType: '真人', orderNo: 'f4dfedec-5199-426f-a403-92042df804c0', roundNo: '18ad3cf09e23d4169cc7b34b-tya2ltzltzcqae5w', gameName: 'Immersive Roulette', manufacturer: 'EVOLIVE', betAmount: 7500, effectiveBet: 7500, prizeAmount: 15000, profit: 7500, status: 'settled', betAt: '2026-04-15 11:08:33', settleAt: '2026-04-15 11:08:50', pullAt: '2026-04-15 11:10:12', parentId: '' },
        { playerId: 99976197, gameType: '真人', orderNo: 'bc33a211-e8f1-485c-b6a4-a59fc06dbc52', roundNo: '18ad3cf09e23d4169cc7b34b-tya2lvn6tzcqae5x', gameName: 'Immersive Roulette', manufacturer: 'EVOLIVE', betAmount: 5000, effectiveBet: 5000, prizeAmount: 0,     profit: -5000, status: 'settled', betAt: '2026-04-15 11:09:14', settleAt: '2026-04-15 11:09:33', pullAt: '2026-04-15 11:12:05', parentId: '' },
        { playerId: 99976203, gameType: '真人', orderNo: '63201bfe-129e-4096-aa9a-5bd0bf3b238e', roundNo: '18ad3cf09e23d4169cc7b34b-tya2lvbqo4hqaf3j', gameName: 'Immersive Roulette', manufacturer: 'EVOLIVE', betAmount: 10000, effectiveBet: 10000, prizeAmount: 35000, profit: 25000, status: 'settled', betAt: '2026-04-15 11:09:50', settleAt: '2026-04-15 11:10:12', pullAt: '2026-04-15 11:13:24', parentId: '' },
      ],
      poker: [
        { playerId: 33056,    gameType: '棋牌', orderNo: 'AUTO_POKER_7417419120246792130', roundNo: '030117684505239251000945', gameName: '',       manufacturer: 'TopBet', betAmount: 100, effectiveBet: 100, prizeAmount: 0,   profit: -100, status: 'settled', betAt: '2026-04-10 22:10:00', settleAt: '2026-04-10 22:10:30', pullAt: '2026-04-10 22:13:01', parentId: '' },
        { playerId: 99975951, gameType: '棋牌', orderNo: '89048',                          roundNo: 'AGE598711100441209088KH',  gameName: 'Keno80', manufacturer: 'TopBet', betAmount: 200, effectiveBet: 200, prizeAmount: 250, profit: 50,   status: 'settled', betAt: '2026-04-12 18:30:11', settleAt: '2026-04-12 18:30:25', pullAt: '2026-04-12 18:32:02', parentId: '' },
        { playerId: 99975951, gameType: '棋牌', orderNo: '89047',                          roundNo: 'ORZ598708808455399616JG',  gameName: 'Keno80', manufacturer: 'TopBet', betAmount: 200, effectiveBet: 200, prizeAmount: 0,   profit: -200, status: 'settled', betAt: '2026-04-12 18:25:55', settleAt: '2026-04-12 18:26:10', pullAt: '2026-04-12 18:28:01', parentId: '' },
        { playerId: 99975951, gameType: '棋牌', orderNo: '89046',                          roundNo: 'STA598698145788045440CE',  gameName: 'Keno80', manufacturer: 'TopBet', betAmount: 200, effectiveBet: 200, prizeAmount: 360, profit: 160,  status: 'settled', betAt: '2026-04-12 18:21:33', settleAt: '2026-04-12 18:21:47', pullAt: '2026-04-12 18:24:01', parentId: '' },
        { playerId: 99975951, gameType: '棋牌', orderNo: '89045',                          roundNo: 'NVP598694435431229632TZ',  gameName: 'Keno80', manufacturer: 'TopBet', betAmount: 200, effectiveBet: 200, prizeAmount: 336, profit: 136,  status: 'settled', betAt: '2026-04-12 18:18:21', settleAt: '2026-04-12 18:18:39', pullAt: '2026-04-12 18:20:01', parentId: '' },
      ],
    };

    const STATS_BY_TYPE = {
      slot:  { totalBet: 5677.49, effective: 5486.41, prize: 6818.35, profit: 1140.86,  playerCount: 39, orderCount: 576 },
      sport: { totalBet: 65501,   effective: 65600.52, prize: 30840.48, profit: -34660.52, playerCount: 42, orderCount: 150 },
      live:  { totalBet: 37600,   effective: 37600,   prize: 60300,   profit: 22700,    playerCount: 15, orderCount: 68 },
      poker: { totalBet: 900,     effective: 900,     prize: 946,     profit: 46,       playerCount: 2,  orderCount: 5 },
    };

    const tableData = computed(() => {
      if (orderType.value === 'all') return Object.values(DATA_BY_TYPE).flat();
      return DATA_BY_TYPE[orderType.value] || [];
    });
    const stats = computed(() => {
      if (orderType.value === 'all') {
        return Object.values(STATS_BY_TYPE).reduce((acc, s) => ({
          totalBet: acc.totalBet + s.totalBet, effective: acc.effective + s.effective,
          prize: acc.prize + s.prize, profit: acc.profit + s.profit,
          playerCount: acc.playerCount + s.playerCount, orderCount: acc.orderCount + s.orderCount,
        }), { totalBet: 0, effective: 0, prize: 0, profit: 0, playerCount: 0, orderCount: 0 });
      }
      return STATS_BY_TYPE[orderType.value] || { totalBet: 0, effective: 0, prize: 0, profit: 0, playerCount: 0, orderCount: 0 };
    });
    const pagination = reactive({ page: 1, size: 20, total: 0 });

    /* 切换 Tab 时，列「游戏类型」仅在「全部」展示 */
    Vue.watchEffect(() => {
      const typeCol = columnOptions.find(c => c.prop === 'gameType');
      if (typeCol) typeCol.visible = orderType.value === 'all';
      const roundCol = columnOptions.find(c => c.prop === 'roundNo');
      if (roundCol) roundCol.visible = orderType.value !== 'sport';
      pagination.total = stats.value.orderCount;
    });

    const today00 = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,19).replace('T',' '); })();
    const today23 = (() => { const d = new Date(); d.setHours(23,59,59,0); return d.toISOString().slice(0,19).replace('T',' '); })();

    const defaultFilters = () => ({
      timeType: 'bet', timeRange: [today00, today23],
      playerId: '', manufacturer: '', subGame: '',
      orderNo: '', roundNo: '', betMin: 0, betMax: 9999999,
    });
    const filters = reactive(defaultFilters());

    const search = () => ElMessage.success('查询条件已应用');
    const reset = () => { Object.assign(filters, defaultFilters()); ElMessage.info('已重置筛选条件'); };
    const exportData = () => ElMessage.success('导出任务已提交');

    /* 任务列表 */
    const taskDlg = reactive({ visible: false, data: [
      { id: 1242, filename: '电子游戏订单_2026-05-21.xlsx', type: '电子', total: 576,  status: 'done',    createdBy: 'cici',  createdAt: '2026-05-21 18:00:23' },
      { id: 1241, filename: '体育投注订单_近30天.xlsx',     type: '体育', total: 150,  status: 'done',    createdBy: 'admin', createdAt: '2026-05-21 14:35:11' },
      { id: 1240, filename: '真人投注订单_近30天.xlsx',     type: '真人', total: 68,   status: 'done',    createdBy: 'cici',  createdAt: '2026-05-20 09:08:45' },
      { id: 1239, filename: '棋牌游戏订单_近30天.xlsx',     type: '棋牌', total: 5,    status: 'done',    createdBy: 'admin', createdAt: '2026-05-20 09:08:21' },
      { id: 1238, filename: '全部三方订单_2026-05.xlsx',     type: '全部', total: 1799, status: 'pending', createdBy: 'admin', createdAt: '2026-05-21 18:05:50' },
    ] });

    return {
      TYPE_TABS, orderType, expanded, currentTab,
      currentManufacturers, currentSubGames,
      columnOptions, visibleColumns, allColsVisible, someColsVisible, toggleAllCols,
      tableData, stats, pagination, filters,
      search, reset, exportData, taskDlg,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Download: ElementPlusIconsVue.Download,
      RefreshRight: ElementPlusIconsVue.RefreshRight,
      Operation: ElementPlusIconsVue.Operation,
      Document: ElementPlusIconsVue.Document,
    };
  }
});

/* ════════════════════════════════════════════
   三方游戏 / 异常交易
════════════════════════════════════════════ */
const TgVendorTx = defineComponent({
  name: 'TgVendorTx',
  template: '#tg-vendor-tx-tpl',
  setup() {
    const VENDORS = ['ZF986ZT', 'ZF986Single', 'TopBet', 'PGSingle', 'EVOLIVE', 'JLNEW', 'INOUTNEW'];
    const ERROR_CODES = ['unknown', 'SC_IN_TIMEOUT', 'SC_NETWORK_ERR', 'SC_ORDER_DUP'];

    const expanded = ref(false);
    const selection = ref([]);

    const defaultFilters = () => ({
      dateRange: [], playerId: '', status: '', txType: '',
      orderNo: '', vendorCode: '', errorCode: '', retryMin: 0, retryMax: 999,
    });
    const filters = reactive(defaultFilters());

    /* 列定义 */
    const columnOptions = reactive([
      { prop: 'playerId',    label: '玩家ID',     width: 100, align: 'center', visible: true, required: true },
      { prop: 'txType',      label: '交易分类',   width: 100, align: 'center', visible: true, slot: true },
      { prop: 'amount',      label: '金额',       width: 110, align: 'right',  visible: true },
      { prop: 'vendorCode',  label: '厂商编码',   width: 130, visible: true },
      { prop: 'orderNo',     label: '订单号',     width: 280, visible: true, required: true },
      { prop: 'status',      label: '处理状态',   width: 100, align: 'center', visible: true, slot: true },
      { prop: 'retryCount',  label: '处理次数',   width: 100, align: 'center', visible: true },
      { prop: 'errorCode',   label: '错误编码',   width: 140, visible: true },
      { prop: 'errorMsg',    label: '错误信息',   width: 100, align: 'center', visible: true, slot: true },
      { prop: 'lastTriedAt', label: '最后处理时间', width: 165, visible: false },
      { prop: 'remark',      label: '备注',       width: 140, visible: false },
    ]);
    const visibleColumns = computed(() => columnOptions.filter(c => c.visible));
    const allColsVisible = computed(() => columnOptions.every(c => c.visible));
    const someColsVisible = computed(() => columnOptions.some(c => c.visible) && !allColsVisible.value);
    const toggleAllCols = (val) => columnOptions.forEach(c => { if (!c.required) c.visible = val; });

    /* 异常交易数据（基于线上 8 条样本） */
    const tableData = ref([
      { playerId: 32628,    txType: 'withdraw', amount: 8138,     vendorCode: 'ZF986ZT',     orderNo: '7278ba3d-2be8-40a0-a8ac-663a5da6d1cb', status: 'done',    retryCount: 5, errorMsg: 'Connection timeout after 30s, retry succeeded', errorCode: 'unknown',        remark: '需返回',     lastTriedAt: '2026-05-21 14:30:11' },
      { playerId: 99973339, txType: 'deposit',  amount: 1145,     vendorCode: 'ZF986ZT',     orderNo: '5c92e785-bb29-42ab-a8d8-d66f9c2087f3', status: 'done',    retryCount: 6, errorMsg: '调用ZF返回：需返回',                                    errorCode: 'unknown',        remark: '需返回',     lastTriedAt: '2026-05-21 13:22:45' },
      { playerId: 30390,    txType: 'deposit',  amount: 17284.34, vendorCode: 'ZF986ZT',     orderNo: '7b0fa7e8-b0c2-4e24-8928-e3f0a22dc021', status: 'done',    retryCount: 5, errorMsg: '调用ZF返回：需返回',                                    errorCode: 'unknown',        remark: '需返回',     lastTriedAt: '2026-05-21 12:10:18' },
      { playerId: 30390,    txType: 'deposit',  amount: 33.43,    vendorCode: 'ZF986ZT',     orderNo: '709ea973-b352-44cb-a2d5-4d65fd6210a1', status: 'done',    retryCount: 3, errorMsg: '调用ZF返回：需返回',                                    errorCode: 'unknown',        remark: '需返回',     lastTriedAt: '2026-05-21 11:08:22' },
      { playerId: 30649,    txType: 'deposit',  amount: 106,      vendorCode: 'ZF986ZT',     orderNo: '8b270249-10a8-47b4-aa1d-d045c81f3279', status: 'done',    retryCount: 5, errorMsg: '调用ZF返回：需返回',                                    errorCode: 'SC_IN_TIMEOUT',  remark: '需返回',     lastTriedAt: '2026-05-21 10:55:39' },
      { playerId: 33043,    txType: 'deposit',  amount: 1148,     vendorCode: 'ZF986ZT',     orderNo: '555df2e7-eea7-4af8-948f-298c68c23ea9', status: 'done',    retryCount: 1, errorMsg: '调用ZF返回：需返回',                                    errorCode: 'unknown',        remark: '需返回',     lastTriedAt: '2026-05-21 09:42:11' },
      { playerId: 20010,    txType: 'withdraw', amount: 118.15,   vendorCode: 'ZF986Single', orderNo: 'f404f9b5-f848-4f0f-bf74-ac3422ab45c1', status: 'done',    retryCount: 1, errorMsg: '转钱到第三方失败',                                       errorCode: 'unknown',        remark: '第三方异常', lastTriedAt: '2026-05-21 08:30:55' },
      { playerId: 30798,    txType: 'deposit',  amount: 12.24,    vendorCode: 'ZF986ZT',     orderNo: '392177d7-c8ea-4677-9196-bcfb50982500', status: 'failed',  retryCount: 6, errorMsg: '调用ZF处理异常：账变记录订单不存在，无法继续处理',           errorCode: 'unknown',        remark: '处理异常',   lastTriedAt: '2026-05-21 17:50:39' },
      { playerId: 22480,    txType: 'deposit',  amount: 500,      vendorCode: 'JLNEW',       orderNo: '64bb1a85-d472-4828-9712-22bc8902dab2', status: 'failed',  retryCount: 3, errorMsg: 'JLNEW SDK 返回 ORDER_DUPLICATE，需人工介入查询',           errorCode: 'SC_ORDER_DUP',   remark: '',           lastTriedAt: '2026-05-21 16:25:10' },
      { playerId: 31022,    txType: 'withdraw', amount: 200,      vendorCode: 'INOUTNEW',    orderNo: '8a3c5d11-aab2-4711-93ef-c5b210fed0a1', status: 'pending', retryCount: 2, errorMsg: '等待第三方异步回调',                                     errorCode: 'unknown',        remark: '',           lastTriedAt: '2026-05-21 17:48:22' },
    ]);
    const pagination = reactive({ page: 1, size: 20, total: 10 });

    const retryableSelection = computed(() => selection.value.filter(r => r.status === 'failed'));

    const statusType = (s) => s === 'done' ? 'success' : (s === 'failed' ? 'danger' : 'warning');
    const statusLabel = (s) => s === 'done' ? '已处理' : (s === 'failed' ? '处理失败' : '处理中');

    const stats = computed(() => ({
      total: tableData.value.length,
      done: tableData.value.filter(r => r.status === 'done').length,
      failed: tableData.value.filter(r => r.status === 'failed').length,
      totalAmount: Math.round(tableData.value.reduce((s, r) => s + r.amount, 0) * 100) / 100,
    }));

    const search = () => ElMessage.success('查询条件已应用');
    const reset = () => { Object.assign(filters, defaultFilters()); ElMessage.info('已重置筛选条件'); };
    const exportData = () => ElMessage.success('导出任务已提交');

    /* 详情 */
    const detailDlg = reactive({ visible: false, row: {} });
    const openDetail = (row) => { detailDlg.row = row; detailDlg.visible = true; };

    /* 二次确认 */
    const confirmDlg = reactive({ visible: false, title: '', message: '', detail: '', onConfirm: null });
    const askConfirm = ({ title, message, detail, onConfirm }) => Object.assign(confirmDlg, { title, message, detail: detail || '', onConfirm, visible: true });
    const doConfirm = () => { confirmDlg.onConfirm?.(); confirmDlg.visible = false; };

    const askRetry = (row) => askConfirm({
      title: '手动处理异常交易',
      message: `确认重新处理订单 ${row.orderNo.slice(0, 12)}... 吗？`,
      detail: `玩家 ${row.playerId}，金额 ₹${row.amount}，已失败 ${row.retryCount} 次。系统将先校验账变订单存在性，再调用厂商接口。`,
      onConfirm: () => {
        row.status = 'done';
        row.retryCount += 1;
        row.lastTriedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
        ElMessage.success('已重新处理成功');
      },
    });
    const askBatchRetry = () => askConfirm({
      title: '批量处理',
      message: `确认批量处理 ${retryableSelection.value.length} 笔失败交易吗？`,
      detail: '系统将逐条校验并重试，处理结果可在交易详情中查看。',
      onConfirm: () => {
        retryableSelection.value.forEach(r => {
          r.status = 'done';
          r.retryCount += 1;
          r.lastTriedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
        });
        ElMessage.success('已批量处理');
        selection.value = [];
      },
    });

    return {
      VENDORS, ERROR_CODES,
      expanded, selection, retryableSelection, filters,
      columnOptions, visibleColumns, allColsVisible, someColsVisible, toggleAllCols,
      tableData, pagination, stats,
      statusType, statusLabel,
      search, reset, exportData,
      detailDlg, openDetail,
      askRetry, askBatchRetry,
      confirmDlg, doConfirm,
      Search: ElementPlusIconsVue.Search,
      Refresh: ElementPlusIconsVue.Refresh,
      Download: ElementPlusIconsVue.Download,
      RefreshRight: ElementPlusIconsVue.RefreshRight,
      Operation: ElementPlusIconsVue.Operation,
    };
  }
});

/* 占位（其他游戏管理 / 三方游戏页面，待实现） */

/* ========== 根组件 ========== */
const app = createApp({
  components: { MemberList, TierManage, VipManage, RebateSettings, RebateDetail, VipLog, CommissionConfig, HomepageSetting, CommissionRecord, AgentList, DailyData, DirectQuery, TeamQuery, QuizList, QuizBet, QuizArb, QuizFinance, QuizSettings,
    GmList, GmClassify, GmManufacturer, GmKeyword,
    TgBigprize, TgWithdraw, TgRtp, TgOrders, TgVendorTx,
  },
  setup() {
    const collapsed = ref(false);
    const activeMenu = ref('member-list');
    const activeTab = ref('member-list');
    const timezone = ref('UTC+08:00');
    const lang = ref('zh-CN');
    const darkMode = ref(false);

    const langLabelMap = { 'zh-CN':'简体中文', 'zh-TW':'繁體中文', 'en':'English', 'hi':'हिन्दी', 'th':'ไทย' };
    const langLabel = computed(() => langLabelMap[lang.value]);
    const onLangChange = (cmd) => {
      lang.value = cmd;
      ElMessage.success(`已切换到 ${langLabelMap[cmd]}`);
    };
    const toggleDark = () => {
      darkMode.value = !darkMode.value;
      document.documentElement.classList.toggle('dark', darkMode.value);
    };

    const pendingTasks = ref([
      { key: 'deposit-appeal',  label: '会员申诉充值未到账', count: 18,   tip: '会员申诉未到账的充值订单' },
      { key: 'withdraw-appeal', label: '会员申诉提现未到账', count: 2,    tip: '会员申诉未到账的提现订单' },
      { key: 'online-deposit',  label: '线上入款',           count: 0 },
      { key: 'member-withdraw', label: '会员出款',           count: 0,    tip: '会员提现待审核' },
      { key: 'promo-review',    label: '优惠审核',           count: 3202, tip: '待审核优惠申请' },
    ]);
    const totalPending = computed(() =>
      pendingTasks.value.reduce((s, t) => s + (t.count || 0), 0)
    );
    const goHandle = (t) => ElMessage.info(`跳转到「${t.label}」处理页`);

    const menuLabel = {
      'dashboard': '仪表盘',
      'member-list': '会员列表', 'member-level': '层级管理', 'member-login': '登录查询',
      'member-vip': 'VIP管理', 'vip-log': 'VIP操作日志',
      'member-relation': '关联玩家查询', 'member-tag': '会员标签',
      'activity-list': '活动列表',
      'activity-cats': '分类管理',
      'activity-claim': '领取与审核',
      'promo-detail': '优惠明细',
      'promo-audit': '优惠稽核配置',
      'rebate-settings': '返水设置',
      'rebate-detail': '返水明细',
      'audit-config': '稽核配置',
      'commission-config': '佣金配置',
      'member-online': '当前在线会员', 'member-balance': '账变记录', 'member-feedback': '玩家反馈',
      'finance-deposit': '充值记录', 'finance-withdraw': '提现记录', 'finance-adjust': '人工调整',
      'finance-audit': '稽核管理',
      'ops-message':     '消息管理',
      'ops-feedback':    '用户反馈',
      'game-list': '游戏列表', 'game-records': '投注记录',
      'agent-list': '代理列表', 'agent-commission': '佣金记录',
      'promo-list': '活动列表',
      'report-overview': '综合报表',
      'risk-list': '风险玩家',
      'site-config': '站点配置',
      'homepage-setting': '首页设置',
      'quiz-list': '预测列表', 'quiz-bet': '投注记录', 'quiz-arb': '仲裁管理',
      'quiz-finance': '平台收益', 'quiz-settings': '预测配置',
      'agent-list': '代理列表',
      'agent-daily': '每日数据',
      'agent-direct': '直属查询',
      'agent-team': '团队查询',
      'commission-record': '佣金记录',
      'system-user': '用户管理', 'system-role': '角色权限',
      'gm-list':         '游戏列表',
      'gm-classify':     '游戏分类',
      'gm-manufacturer': '游戏厂商',
      'gm-keyword':      '搜索关键词',
      'tg-bigprize':     '爆大奖管理',
      'tg-withdraw':     '余额回收',
      'tg-rtp':          'RTP 配置',
      'tg-orders':       '三方投注订单',
      'tg-vendor-tx':    '异常交易',
      'risk-related':    '关联查询',
      'risk-blacklist':  '黑名单',
      'risk-bonushunter':'刷子监控',
      'gray-list':       '灰度功能列表',
      'gray-sim':        '命中测试器',
      'gray-dash':       '数据看板',
      'gray-log':        '操作日志',
    };

    const tabs = ref([
      { name: 'member-list', label: '会员列表', closable: false },
    ]);

    const onMenuSelect = (idx) => {
      if (!menuLabel[idx]) return;
      activeMenu.value = idx;
      if (!tabs.value.find(t => t.name === idx)) {
        tabs.value.push({ name: idx, label: menuLabel[idx], closable: true });
      }
      activeTab.value = idx;
    };

    Vue.provide('navigate', onMenuSelect);
    const promoDetailNav = Vue.reactive({ activityId: '' });
    Vue.provide('promoDetailNav', promoDetailNav);

    const removeTab = (name) => {
      const i = tabs.value.findIndex(t => t.name === name);
      if (i === -1 || tabs.value[i].closable === false) return;
      tabs.value.splice(i, 1);
      if (activeTab.value === name) {
        const next = tabs.value[i] || tabs.value[i - 1];
        if (next) {
          activeTab.value = next.name;
          activeMenu.value = next.name;
        }
      }
    };

    const onTabChange = (name) => {
      activeMenu.value = name;
    };

    const currentTabLabel = computed(() => {
      const t = tabs.value.find(x => x.name === activeTab.value);
      return t ? t.label : '';
    });

    // 面包屑分组（随当前页动态变化）
    const groupLabelMap = {
      member: '会员管理', finance: '财务管理', game: '游戏管理', tripartite: '三方游戏',
      rebate: '活动福利', agent: '代理管理', ops: '运营管理', quiz: '预测系统', site: '站点设置',
      risk: '风控管理', gray: '灰度发布',
    };
    const tabGroupMap = {
      'member-list': 'member', 'member-level': 'member', 'member-vip': 'member', 'vip-log': 'member',
      'finance-audit': 'finance',
      'gm-list': 'game', 'gm-classify': 'game', 'gm-manufacturer': 'game', 'gm-keyword': 'game',
      'tg-bigprize': 'tripartite', 'tg-withdraw': 'tripartite', 'tg-rtp': 'tripartite',
      'tg-orders': 'tripartite', 'tg-vendor-tx': 'tripartite',
      'activity-list': 'rebate', 'activity-cats': 'rebate', 'activity-claim': 'rebate',
      'promo-detail': 'rebate', 'promo-audit': 'rebate', 'rebate-settings': 'rebate', 'rebate-detail': 'rebate',
      'agent-list': 'agent', 'agent-daily': 'agent', 'agent-direct': 'agent', 'agent-team': 'agent',
      'commission-config': 'agent', 'commission-record': 'agent',
      'ops-message': 'ops', 'ops-feedback': 'ops',
      'quiz-list': 'quiz', 'quiz-bet': 'quiz', 'quiz-arb': 'quiz', 'quiz-finance': 'quiz', 'quiz-settings': 'quiz',
      'homepage-setting': 'site',
      'risk-related': 'risk', 'risk-blacklist': 'risk', 'risk-bonushunter': 'risk',
      'gray-list': 'gray', 'gray-sim': 'gray', 'gray-dash': 'gray', 'gray-log': 'gray',
    };
    const currentGroupLabel = computed(() => groupLabelMap[tabGroupMap[activeTab.value]] || '');

    const icons = ElementPlusIconsVue;
    return {
      collapsed, activeMenu, activeTab, tabs,
      timezone, lang, langLabel, onLangChange, darkMode, toggleDark,
      pendingTasks, totalPending, goHandle,
      currentTabLabel, currentGroupLabel, onMenuSelect, removeTab, onTabChange,
      Bell: icons.Bell, QuestionFilled: icons.QuestionFilled,
      Moon: icons.Moon, Sunny: icons.Sunny,
    };
  }
});

// ══════════════════════════════════════
// 活动福利 · 活动列表
// ══════════════════════════════════════
const ActivityList = defineComponent({
  name: 'ActivityList',
  template: '#activity-list-tpl',
  setup() {
    const { ElMessage } = ElementPlus;
    const { ref, reactive, computed } = Vue;

    const navigate = Vue.inject('navigate', null);
    const promoDetailNav = Vue.inject('promoDetailNav', null);
    const goPromoDetail = (row) => {
      if (promoDetailNav) promoDetailNav.activityId = String(row.id);
      if (navigate) navigate('promo-detail');
    };

    const alTab = ref('list');
    const alExpanded = ref(false);
    const alStatsExpanded = ref(false);
    const alMultiMode = ref(true);
    const alDensity = ref('默认');
    const alPage = ref(1);
    const AL_PS = 10;

    const AL_STATUS_MAP = {
      draft:         '草稿',
      pending_effect:'待生效',
      active:        '进行中',
      ended:         '已结束',
      manual_end:    '手动结束',
      expired_close: '过期关闭',
    };
    const AL_STATUS_TAG = {
      draft:         'info',
      pending_effect:'warning',
      active:        'success',
      ended:         'info',
      manual_end:    'danger',
      expired_close: 'danger',
    };

    // ── 活动列表 Mock（每个状态一条）──
    const alMock = ref([
      {id:160413,name:'回归彩金',          cat:'新手',currency:'INR',type:'回归彩金',  members:'指定层级',timeRange:'长期：开始时间2026-04-22 15:05:09',showRange:'长期：开始时间2026-04-22 15:05:08',status:'draft',         operator:'ops01',opTime:'2026-05-15 14:07:51'},
      {id:100528,name:'邀请好友赢奖励',    cat:'邀请',currency:'INR',type:'邀请宝箱',  members:'全部会员',timeRange:'2026-05-20 00:00:00 ~ 2026-06-20 23:59:59',showRange:'2026-05-20 00:00:00 ~ 2026-06-20 23:59:59',status:'pending_effect',operator:'ops01',opTime:'2026-05-14 10:30:00'},
      {id:70545, name:'每日首存额外5%奖励',cat:'充值',currency:'INR',type:'自定义活动',members:'全部会员',timeRange:'长期：开始时间2026-01-01 00:00:00',showRange:'长期：开始时间2026-01-01 00:00:00',status:'active',         operator:'ops02', opTime:'2026-03-16 17:23:59'},
      {id:70500, name:'春节充值返利活动',   cat:'充值',currency:'INR',type:'自定义活动',members:'全部会员',timeRange:'2026-02-01 00:00:00 ~ 2026-02-15 23:59:59',showRange:'2026-02-01 00:00:00 ~ 2026-02-20 23:59:59',status:'ended',          operator:'ops03', opTime:'2026-02-15 23:59:59'},
    ]);

    const alFilter = reactive({ cat:'', type:'', searchField:'name', searchVal:'', status:'', currency:'' });
    const alFiltered = computed(() => alMock.value.filter(r => {
      if (alFilter.cat && r.cat !== alFilter.cat) return false;
      if (alFilter.type && r.type !== alFilter.type) return false;
      if (alFilter.searchVal) {
        const v = alFilter.searchVal.toLowerCase();
        if (alFilter.searchField === 'id') { if (String(r.id) !== alFilter.searchVal) return false; }
        else { if (!r.name.toLowerCase().includes(v)) return false; }
      }
      if (alFilter.status && r.status !== alFilter.status) return false;
      if (alFilter.currency && r.currency !== alFilter.currency) return false;
      return true;
    }));
    const alTotalPages = computed(() => Math.max(1, Math.ceil(alFiltered.value.length / AL_PS)));
    const alPageData = computed(() => alFiltered.value.slice((alPage.value-1)*AL_PS, alPage.value*AL_PS));
    const alResetFilter = () => { Object.assign(alFilter, {cat:'',type:'',searchField:'name',searchVal:'',status:'',currency:''}); alPage.value=1; };

    // ── 已关闭活动 Mock（手动结束 / 过期关闭 各一条）──
    const alClosedData = ref([
      {id:130412,name:'VIP生日专属活动',  cat:'vip', currency:'INR',type:'会员日',   members:'指定层级',timeRange:'长期：开始时间2026-04-07 11:02:32',showRange:'长期：开始时间2026-04-07 11:02:31',status:'manual_end',   operator:'ops02', opTime:'2026-05-10 09:15:00'},
      {id:100541,name:'推广安装奖励',     cat:'-',   currency:'INR',type:'自定义活动',members:'全部会员', timeRange:'2026-01-30 09:55:59 ~ 2026-03-01 09:55:59',showRange:'2026-01-30 09:55:59 ~ 2026-03-01 09:55:59',status:'expired_close',operator:'ops03', opTime:'2026-03-01 10:00:00'},
    ]);
    const alClosedPage = ref(1);
    const AL_CLOSED_PS = 20;
    const alClosedPageData = computed(() => alClosedData.value.slice((alClosedPage.value-1)*AL_CLOSED_PS, alClosedPage.value*AL_CLOSED_PS));

    // ── 优惠统计 Mock ──
    const alStatGranularity = ref('日');
    const alStatRange = ref([]);
    const alClosedFilter = reactive({ cat:'', type:'', searchField:'name', searchVal:'', status:'', currency:'' });
    const alStatFilter = reactive({ searchField:'name', searchVal:'', currency:'' });
    const alStatMock = ref([
      {id:160413,name:'回归彩金',currency:'INR',timeRange:'长期：开始时间2025-04-22 15:05:09',type:'回归彩金',claimed:0,claimedCount:'-',eligible:4,claimedAmt:0,totalAmt:1},
      {id:160412,name:'回归彩金',currency:'INR',timeRange:'2025-04-22 00:00:00 ~ 2025-04-22 23:59:59',type:'回归彩金',claimed:0,claimedCount:'-',eligible:4,claimedAmt:'-',totalAmt:'-'},
      {id:130413,name:'回归彩金',currency:'INR',timeRange:'2025-04-22 00:00:00 ~ 2025-04-22 23:59:59',type:'回归彩金',claimed:0,claimedCount:'-',eligible:4,claimedAmt:'-',totalAmt:'-'},
      {id:130412,name:'测试',currency:'INR',timeRange:'长期：开始时间2025-04-07 11:02:32',type:'会员日',claimed:1,claimedCount:'-',eligible:4,claimedAmt:2,totalAmt:4},
      {id:100528,name:'邀请好友赢奖励',currency:'INR',timeRange:'长期：开始时间2025-11-27 00:00:00',type:'邀请宝箱',claimed:0,claimedCount:'-',eligible:4,claimedAmt:'-',totalAmt:'-'},
    ]);

    // ── 分类管理 Mock ──
    const alCatFilter = ref('');
    const alCatMock = ref([
      {id:1,name:'新手',displayName:'नए सदस्य',desc:'New Member Rewards',icon:'🎁',count:7,enabled:true,operator:'ops02',opTime:'2025-03-16 15:18:13'},
      {id:2,name:'充值',displayName:'जमा करें',desc:'अभी जमा करें और बोनस पाएं',icon:'🎰',count:8,enabled:true,operator:'ops01',opTime:'2025-03-16 16:07:39'},
      {id:3,name:'邀请',displayName:'आमंत्रण',desc:'दोस्तों को आमंत्रित करें और पुरस्कार कमाएं',icon:'🎉',count:1,enabled:true,operator:'ops01',opTime:'2025-03-16 16:07:37'},
      {id:4,name:'打码',displayName:'बेटिंग',desc:'बेट लगाएं और पुरस्कार कमाएं',icon:'✅',count:4,enabled:true,operator:'ops02',opTime:'2025-03-16 14:57:56'},
      {id:5,name:'vip',displayName:'VIP',desc:'VIP विशेष लाभ पाएं',icon:'💳',count:2,enabled:true,operator:'ops02',opTime:'2025-03-16 14:57:51'},
      {id:6,name:'其他',displayName:'अन्य',desc:'अन्य प्रमोशन',icon:'🎊',count:3,enabled:false,operator:'ops03',opTime:'2025-03-10 09:00:00'},
    ]);
    const alCatFiltered = computed(() => {
      const kw = alCatFilter.value.toLowerCase();
      return alCatMock.value.filter(c => !kw || c.name.toLowerCase().includes(kw) || c.displayName.toLowerCase().includes(kw));
    });

    // ── 列设置：活动列表 ──
    const alCols = ref([
      {key:'sort',   label:'排序',         visible:true, required:true},
      {key:'id',     label:'活动ID',        visible:true, required:true},
      {key:'name',   label:'活动名称',       visible:true},
      {key:'cat',    label:'活动分类',       visible:true},
      {key:'currency',label:'币种',      visible:true},
      {key:'type',   label:'活动类型',       visible:true},
      {key:'members',label:'参与会员',       visible:true},
      {key:'timeRange',label:'活动开始/结束时间',visible:true},
      {key:'showRange',label:'展示时间',     visible:true},
      {key:'status', label:'状态',          visible:true},
      {key:'operator',label:'操作人',       visible:true},
      {key:'opTime', label:'操作时间',      visible:true},
      {key:'actions',label:'操作',          visible:true, required:true},
    ]);
    const alColVis = k => alCols.value.find(c=>c.key===k)?.visible ?? true;
    const alAllCols = computed(() => alCols.value.every(c=>c.visible));
    const alSomeCols = computed(() => alCols.value.some(c=>c.visible) && !alAllCols.value);
    const alToggleAllCols = v => alCols.value.forEach(c=>{ c.visible = v; });
    const alVisibleCount = computed(() => alCols.value.filter(c=>c.visible).length);

    // ── 列设置：优惠统计 ──
    const alStatCols = ref([
      {key:'id',         label:'活动ID',          visible:true, required:true},
      {key:'name',       label:'活动名称',          visible:true},
      {key:'currency',   label:'币种',          visible:true},
      {key:'timeRange',  label:'活动开始/结束时间',   visible:true},
      {key:'type',       label:'活动类型',          visible:true},
      {key:'claimed',    label:'已领取人数',         visible:true},
      {key:'claimedCount',label:'已领取张数',        visible:true},
      {key:'eligible',   label:'可参与人数',         visible:true},
      {key:'claimedAmt', label:'已领取金额',         visible:true},
      {key:'totalAmt',   label:'活动金额',           visible:true},
    ]);
    const alStColVis = k => alStatCols.value.find(c=>c.key===k)?.visible ?? true;
    const alStAllCols = computed(() => alStatCols.value.every(c=>c.visible));
    const alStSomeCols = computed(() => alStatCols.value.some(c=>c.visible) && !alStAllCols.value);
    const alStToggleAllCols = v => alStatCols.value.forEach(c=>{ c.visible = v; });

    // ── 新增活动弹窗 ──
    const alNewDlgVisible = ref(false);
    function alOpenNewDlg() { alNewDlgVisible.value = true; }
    function alCloseNewDlg() { alNewDlgVisible.value = false; }
    const alHandleMsg = (e) => { if (e.data === 'closeNewActivityDlg') alNewDlgVisible.value = false; };
    Vue.onMounted(() => window.addEventListener('message', alHandleMsg));
    Vue.onUnmounted(() => window.removeEventListener('message', alHandleMsg));

    // ── 列设置：分类管理 ──
    const alCatCols = ref([
      {key:'sort',       label:'排序',       visible:true, required:true},
      {key:'name',       label:'分类名称',    visible:true, required:true},
      {key:'displayName',label:'客户端展示名称',visible:true},
      {key:'icon',       label:'ICON',        visible:true},
      {key:'count',      label:'展示活动数量', visible:true},
      {key:'operator',   label:'操作人',      visible:true},
      {key:'opTime',     label:'操作时间',    visible:true},
      {key:'actions',    label:'操作',        visible:true, required:true},
    ]);
    const alCColVis = k => alCatCols.value.find(c=>c.key===k)?.visible ?? true;
    const alCAllCols = computed(() => alCatCols.value.every(c=>c.visible));
    const alCSomeCols = computed(() => alCatCols.value.some(c=>c.visible) && !alCAllCols.value);
    const alCToggleAllCols = v => alCatCols.value.forEach(c=>{ c.visible = v; });

    return {
      alNewDlgVisible, alOpenNewDlg, alCloseNewDlg,
      alTab, alExpanded, alStatsExpanded, alMultiMode, alDensity, alPage,
      AL_STATUS_MAP, AL_STATUS_TAG,
      alFilter, alFiltered, alPageData, alTotalPages, alResetFilter,
      alCols, alColVis, alAllCols, alSomeCols, alToggleAllCols, alVisibleCount,
      alClosedData, alClosedPage, alClosedPageData,
      alClosedFilter,
      alStatFilter, alStatMock,
      alStatCols, alStColVis, alStAllCols, alStSomeCols, alStToggleAllCols,
      alCatFilter, alCatFiltered,
      alCatCols, alCColVis, alCAllCols, alCSomeCols, alCToggleAllCols,
      goPromoDetail,
      ElMessage,
      Search:    ElementPlusIconsVue.Search,
      Refresh:   ElementPlusIconsVue.Refresh,
      Download:  ElementPlusIconsVue.Download,
      Operation: ElementPlusIconsVue.Operation,
      Grid:      ElementPlusIconsVue.Grid,
      Plus:      ElementPlusIconsVue.Plus,
    };
  }
});
app.component('activity-list', ActivityList);

// ══════════════════════════════════════
const PromoDetail = defineComponent({
  name: 'PromoDetail',
  template: '#promo-detail-tpl',
  setup() {
    const { ElMessage } = ElementPlus;
    const { ref, reactive, onMounted } = Vue;

    const promoDetailNav = Vue.inject('promoDetailNav', null);

    const pdGranularity = ref('日');
    const pdExpanded = ref(true);
    const pdFilter = reactive({
      dateRange: ['2026-05-01 00:00:00', '2026-05-31 23:59:59'],
      memberField: 'account', memberValue: '',
      source: '', sourceType: '',
      promoField: 'id', promoValue: '',
      status: '', orderNo: '', currency: '',
    });

    onMounted(() => {
      if (promoDetailNav?.activityId) {
        pdFilter.promoValue = promoDetailNav.activityId;
      }
    });

    const pdReset = () => {
      Object.assign(pdFilter, { memberValue:'', source:'', sourceType:'', promoValue:'', status:'', orderNo:'', currency:'' });
    };

    const pdMock = ref([
      { orderNo:'10000001958402', activityId:100527, currency:'INR', memberId:'54297735', account:'tel-dpi7xvsxhzpv', source:'活动', sourceType:'救援金', promoName:'每月存款救援金10%', claimType:'已手动领取', amount:'0.87', voucher:'-', claimedAt:'2026-05-14 10:37:47' },
      { orderNo:'10000001958397', activityId:100527, currency:'INR', memberId:'87702876', account:'akmadtanagob', source:'活动', sourceType:'救援金', promoName:'每月存款救援金10%', claimType:'已手动领取', amount:'2.98', voucher:'-', claimedAt:'2026-05-14 10:28:14' },
      { orderNo:'10000001958387', activityId:70536, currency:'INR', memberId:'87702876', account:'akmadtanagob', source:'活动', sourceType:'打码送', promoName:'打码赢大奖', claimType:'已手动领取', amount:'20.00', voucher:'-', claimedAt:'2026-05-14 10:28:10' },
      { orderNo:'10000001958388', activityId:70536, currency:'INR', memberId:'87702876', account:'akmadtanagob', source:'活动', sourceType:'打码送', promoName:'打码赢大奖', claimType:'已手动领取', amount:'0.00', voucher:'优惠券×4', claimedAt:'2026-05-14 10:28:10' },
      { orderNo:'10000001958424', activityId:70519, currency:'INR', memberId:'81657646', account:'yazz18', source:'活动', sourceType:'登入活动', promoName:'每日幸运转盘', claimType:'已立即派发', amount:'0.00', voucher:'电子钱包券×1', claimedAt:'2026-05-14 10:19:17' },
      { orderNo:'10000001989896', activityId:70519, currency:'INR', memberId:'56301177', account:'tel-mj15oulyjgye', source:'活动', sourceType:'登入活动', promoName:'每日幸运转盘', claimType:'已立即派发', amount:'0.00', voucher:'电子钱包券×1', claimedAt:'2026-05-14 10:18:10' },
      { orderNo:'10000001989895', activityId:70519, currency:'INR', memberId:'11095476', account:'gerymi', source:'活动', sourceType:'登入活动', promoName:'每日幸运转盘', claimType:'已立即派发', amount:'0.00', voucher:'电子钱包券×1', claimedAt:'2026-05-14 10:04:00' },
      { orderNo:'10000001958300', activityId:100502, currency:'INR', memberId:'23451122', account:'player001', source:'活动', sourceType:'存款奖励', promoName:'周末5%现金返还', claimType:'已立即派发', amount:'58.50', voucher:'-', claimedAt:'2026-05-10 09:15:00' },
      { orderNo:'10000001958301', activityId:100504, currency:'INR', memberId:'33218876', account:'invite_pro', source:'活动', sourceType:'邀请奖励', promoName:'推荐好友奖励计划', claimType:'已手动领取', amount:'100.00', voucher:'-', claimedAt:'2026-05-09 14:30:22' },
    ]);

    return {
      pdGranularity, pdExpanded, pdFilter, pdReset, pdMock,
      ElMessage,
      ArrowUp:    ElementPlusIconsVue.ArrowUp,
      ArrowDown:  ElementPlusIconsVue.ArrowDown,
      PdSearch:   ElementPlusIconsVue.Search,
      PdRefresh:  ElementPlusIconsVue.Refresh,
      PdDownload: ElementPlusIconsVue.Download,
    };
  }
});
app.component('promo-detail', PromoDetail);

// ══════════════════════════════════════
const ActivityCats = defineComponent({
  name: 'ActivityCats',
  template: '#activity-cats-tpl',
  setup() {
    const { ElMessage } = ElementPlus;
    const { ref, reactive, computed } = Vue;

    const acCatFilter = ref('');
    const acCatMock = ref([
      {id:1,name:'新手',displayName:'नए सदस्य',desc:'New Member Rewards',icon:'🎁',count:7,enabled:true,operator:'ops02',opTime:'2025-03-16 15:18:13'},
      {id:2,name:'充值',displayName:'जमा करें',desc:'अभी जमा करें और बोनस पाएं',icon:'🎰',count:8,enabled:true,operator:'ops01',opTime:'2025-03-16 16:07:39'},
      {id:3,name:'邀请',displayName:'आमंत्रण',desc:'दोस्तों को आमंत्रित करें और पुरस्कार कमाएं',icon:'🎉',count:1,enabled:true,operator:'ops01',opTime:'2025-03-16 16:07:37'},
      {id:4,name:'打码',displayName:'बेटिंग',desc:'बेट लगाएं और पुरस्कार कमाएं',icon:'✅',count:4,enabled:true,operator:'ops02',opTime:'2025-03-16 14:57:56'},
      {id:5,name:'vip',displayName:'VIP',desc:'VIP विशेष लाभ पाएं',icon:'💳',count:2,enabled:true,operator:'ops02',opTime:'2025-03-16 14:57:51'},
      {id:6,name:'其他',displayName:'अन्य',desc:'अन्य प्रमोशन',icon:'🎊',count:3,enabled:false,operator:'ops03',opTime:'2025-03-10 09:00:00'},
    ]);
    const acCatFiltered = computed(() => {
      const kw = acCatFilter.value.toLowerCase();
      return acCatMock.value.filter(c => !kw || c.name.toLowerCase().includes(kw) || c.displayName.toLowerCase().includes(kw));
    });

    const acCatCols = ref([
      {key:'sort',       label:'排序',         visible:true, required:true},
      {key:'name',       label:'分类名称',       visible:true, required:true},
      {key:'displayName',label:'客户端展示名称',  visible:true},
      {key:'icon',       label:'ICON',           visible:true},
      {key:'count',      label:'展示活动数量',    visible:true},
      {key:'enabled',    label:'启用/禁用',        visible:true},
      {key:'operator',   label:'操作人',          visible:true},
      {key:'opTime',     label:'操作时间',        visible:true},
      {key:'actions',    label:'操作',            visible:true, required:true},
    ]);
    const acColVis      = k => acCatCols.value.find(c=>c.key===k)?.visible ?? true;
    const acAllCols     = computed(() => acCatCols.value.every(c=>c.visible));
    const acSomeCols    = computed(() => acCatCols.value.some(c=>c.visible) && !acAllCols.value);
    const acToggleAllCols = v => acCatCols.value.forEach(c=>{ c.visible = v; });

    const acCatDlg = reactive({ visible:false, mode:'add', name:'', displayNameHi:'', icon:'' });
    const acOpenAdd  = () => { Object.assign(acCatDlg, {visible:true, mode:'add',  name:'', displayNameHi:'', icon:''}); };
    const acOpenEdit = (row) => { Object.assign(acCatDlg, {visible:true, mode:'edit', name:row.name, displayNameHi:row.displayName, icon:''}); };

    return {
      acCatFilter, acCatFiltered,
      acCatCols, acColVis, acAllCols, acSomeCols, acToggleAllCols,
      acCatDlg, acOpenAdd, acOpenEdit,
      ElMessage,
      Search:    ElementPlusIconsVue.Search,
      Refresh:   ElementPlusIconsVue.Refresh,
      Operation: ElementPlusIconsVue.Operation,
      Plus:      ElementPlusIconsVue.Plus,
      Upload:    ElementPlusIconsVue.Upload,
    };
  }
});
app.component('activity-cats', ActivityCats);

/* ========== 优惠稽核 ========== */
const PromoAudit = defineComponent({
  name: 'PromoAudit',
  template: '#promo-audit-tpl',
  setup() {
    const { ref, reactive, computed } = Vue;
    const ElMessage = ElementPlus.ElMessage;

    const paTab = ref('activity');
    const paEditing = ref(false);

    // ⚠️ MOCK 数据 - 正式版从「活动管理 → 活动列表」按活动类型动态拉取
    const paActivities = [
      '每日签到','推荐旋转','充值大礼包','投注大赛','红包雨',
      '每日救援金','Royal Member Day','VIP Club','惊喜礼包','人工优惠',
      '预测-玩家盈利','预测-庄家盈利',
    ];
    const paActiveAct = ref(paActivities[0]);

    // 同步配置
    const paSyncAll = ref(false);
    const paSyncMap = reactive(Object.fromEntries(paActivities.map(a => [a, false])));
    const paToggleSyncAll = (v) => { paActivities.forEach(a => { paSyncMap[a] = v; }); };

    // ⚠️ MOCK 数据 - 正式版从「游戏管理后台」动态拉取：
    //   - 游戏分类来自「游戏管理 → 游戏分类」
    //   - 厂商列表来自「游戏管理 → 游戏厂商」（按分类过滤已启用）
    //   - 游戏列表来自「游戏管理 → 游戏列表」（按厂商过滤）
    //   3 层结构：分类 → 厂商 → 游戏；勾选粒度为「游戏」
    const _g = (name, checked = true) => ({ name, checked });
    const _v = (name, games, expanded = false) => ({ name, expanded, games });

    const buildVendorBucket = () => ({
      sport: [
        _v('9Wickets', [_g('Cricket Live'), _g('Football Pre-match'), _g('Tennis In-play')], true),
        _v('BTI Sports', [_g('Live Betting'), _g('Pre-match'), _g('E-sports')]),
      ],
      live: [
        _v('Evolution Gaming', [_g('Lightning Roulette'), _g('Crazy Time'), _g('Mega Ball'), _g('Monopoly Live'), _g('Dream Catcher')], true),
        _v('Ezugi', [_g('Andar Bahar'), _g('Lightning Dice'), _g('Speed Roulette')]),
        _v('SA Gaming', [_g('Live Baccarat'), _g('Dragon Tiger', false)]),
        _v('AE Sexy', [_g('Sexy Baccarat'), _g('Sicbo')]),
      ],
      esports: [
        _v('TFGaming', [_g('CSGO'), _g('Dota 2'), _g('LoL')], true),
        _v('IM E-sports', [_g('Valorant'), _g('PUBG Mobile', false)]),
      ],
      slots: [
        _v('PG Soft', [_g('Mahjong Ways'), _g('Lucky Neko'), _g('Caishen Wins'), _g('Treasures of Aztec')], true),
        _v('Pragmatic Play', [_g('Sweet Bonanza'), _g('Gates of Olympus'), _g('Wild West Gold'), _g('Big Bass Bonanza')]),
        _v('JILI', [_g('Super Ace'), _g('Boxing King'), _g('Money Coming')]),
        _v('Hacksaw Gaming', [_g('Wanted Dead or a Wild', false), _g('Chaos Crew', false)]),
        _v('NetEnt', [_g('Starburst'), _g("Gonzo's Quest", false)]),
      ],
      chess: [
        _v('Teen Patti by JILI', [_g('Teen Patti'), _g('Rummy', false)], true),
        _v('Ludo King', [_g('Ludo Classic'), _g('Ludo Quick')]),
      ],
      fish: [
        _v('JDB Fishing', [_g('Fishing King'), _g('Dragon Fishing', false)], true),
        _v('JILI Fishing', [_g('Boom Legend')]),
      ],
      lottery: [
        _v('Lottery India', [_g('WinGo 1Min'), _g('WinGo 3Min'), _g('TRX Wingo'), _g('K3 Lotre'), _g('5D Lotre')], true),
        _v('Fast Parity', [_g('Fast Parity 30s'), _g('Fast Parity 1min')]),
      ],
      crash: [
        _v('Spribe', [_g('Aviator'), _g('Mines'), _g('Plinko'), _g('Hi-Lo'), _g('Goal', false)], true),
        _v('Smartsoft', [_g('JetX'), _g('JetX3', false)]),
        _v('BGaming', [_g('Crash Royale')]),
      ],
    });
    // 不同 Tab 的默认值差异（仅原型演示用）
    const vipBucket = buildVendorBucket();
    vipBucket.fish.forEach(v => v.games.forEach(g => g.checked = false));
    vipBucket.chess.forEach(v => v.games.forEach(g => g.checked = false));
    const rebateBucket = buildVendorBucket();
    rebateBucket.crash.forEach(v => v.games.forEach(g => g.checked = false));
    rebateBucket.fish.forEach(v => v.games.forEach(g => g.checked = false));

    const paVendorBuckets = reactive({
      activity: buildVendorBucket(),
      vip:      vipBucket,
      rebate:   rebateBucket,
    });

    const paGameTab = ref('sport');

    const paCurrentBucket = computed(() => paVendorBuckets[paTab.value] || paVendorBuckets.activity);

    // 单个厂商已选游戏数 / 总数
    const _vSel = (v) => v.games.filter(g => g.checked).length;
    const _vTotal = (v) => v.games.length;
    // 分类总数 = 该分类下所有厂商的游戏数累加
    const _cSel = (bucket, key) => (bucket[key] || []).reduce((s, v) => s + _vSel(v), 0);
    const _cTotal = (bucket, key) => (bucket[key] || []).reduce((s, v) => s + _vTotal(v), 0);

    const paGameCats = computed(() => {
      const b = paCurrentBucket.value;
      return [
        { key:'sport',   label:'体育',   sel: _cSel(b,'sport'),   total: _cTotal(b,'sport')   },
        { key:'live',    label:'真人',   sel: _cSel(b,'live'),    total: _cTotal(b,'live')    },
        { key:'esports', label:'电竞',   sel: _cSel(b,'esports'), total: _cTotal(b,'esports') },
        { key:'slots',   label:'老虎机', sel: _cSel(b,'slots'),   total: _cTotal(b,'slots')   },
        { key:'chess',   label:'棋牌',   sel: _cSel(b,'chess'),   total: _cTotal(b,'chess')   },
        { key:'fish',    label:'捕鱼',   sel: _cSel(b,'fish'),    total: _cTotal(b,'fish')    },
        { key:'lottery', label:'彩票',   sel: _cSel(b,'lottery'), total: _cTotal(b,'lottery') },
        { key:'crash',   label:'Crash',  sel: _cSel(b,'crash'),   total: _cTotal(b,'crash')   },
      ];
    });

    const paCurrentVendors = computed(() => paCurrentBucket.value[paGameTab.value] || []);

    // 厂商三态 checkbox
    const vendorChecked = (v) => v.games.length > 0 && v.games.every(g => g.checked);
    const vendorIndeterminate = (v) => {
      const cnt = _vSel(v);
      return cnt > 0 && cnt < v.games.length;
    };
    const vendorSel = _vSel;
    const vendorTotal = _vTotal;
    const toggleVendor = (v, val) => { v.games.forEach(g => { g.checked = val; }); };

    // 「全部平台」总开关：当前分类下所有厂商所有游戏
    const paAllPlatform = computed({
      get: () => paCurrentVendors.value.length > 0 && paCurrentVendors.value.every(v => v.games.every(g => g.checked)),
      set: (val) => { paCurrentVendors.value.forEach(v => v.games.forEach(g => { g.checked = val; })); },
    });
    const paAllIndeterminate = computed(() => {
      const all = paCurrentVendors.value.flatMap(v => v.games);
      const sel = all.filter(g => g.checked).length;
      return sel > 0 && sel < all.length;
    });
    const paToggleAll = (val) => { paCurrentVendors.value.forEach(v => v.games.forEach(g => { g.checked = val; })); };

    return {
      paTab, paEditing,
      paActivities, paActiveAct,
      paSyncAll, paSyncMap, paToggleSyncAll,
      paGameTab, paGameCats, paCurrentVendors,
      paAllPlatform, paAllIndeterminate, paToggleAll,
      vendorChecked, vendorIndeterminate, vendorSel, vendorTotal, toggleVendor,
      ElMessage,
    };
  }
});
app.component('promo-audit', PromoAudit);

/* ========== 财务管理 · 稽核管理 ========== */
const FinanceAudit = defineComponent({
  name: 'FinanceAudit',
  template: '#finance-audit-tpl',
  setup() {
    const { ref, reactive, computed } = Vue;
    const icons = ElementPlusIconsVue;
    const ElMessage = ElementPlus.ElMessage;
    const ElMessageBox = ElementPlus.ElMessageBox;

    /* ---- 常量 ---- */
    const TX_TYPES = [
      { value: '存款', label: '存款' },
      { value: '活动', label: '活动' },
      { value: '调账', label: '调账' },
      { value: '奖金', label: '奖金' },
      { value: '注册', label: '注册' },
      { value: '预测', label: '预测' },
    ];
    const ACTIVITY_MAP = {
      '存款': ['首充活动','二充活动','每日充值活动'],
      '活动': ['投注返水','每日签到','红包雨活动','邀请好友','春节特惠活动'],
      '调账': ['系统调账','人工调账','补偿调账'],
      '奖金': ['VIP奖金','推广奖金','任务奖金','VIP周俸禄'],
      '注册': ['新用户注册奖励','注册即送'],
      '预测': ['玩家投注盈利','庄家盈利'],
    };
    const PLATFORMS = ['真人','体育','电子','彩票','棋牌','捕鱼','电竞','Crash'];

    /* ---- 示例数据 ---- */
    const rows = ref([
      { id:101, memberId:'2013206764355200001', username:'user_2291', txType:'预测', activityName:'玩家投注盈利',
        currency:'INR', transactionAmount:'3,200.00', auditMultiplier:1, auditAmount:'3,200.00',
        completedAudit:'0.00', remainingAudit:'3,200.00', auditAdjustment:'0.00', remark:'预测《NBA 总决赛 MVP 是谁》中奖派彩，按玩家投注盈利稽核倍数生成',
        status:'未开始', releaseSettings:'输光自动解除 | 立刻解除', operator:'系统', operationType:'create',
        adjustmentDetail:null, createTime:'2026-03-31 14:30:00', updateTime:'2026-03-31 14:30:00',
        vipLevel:'VIP2', accountBalance:'6,400.00', auditProgress:0 },
      { id:102, memberId:'2013206764355200002', username:'user_120', txType:'预测', activityName:'庄家盈利',
        currency:'INR', transactionAmount:'2,400.00', auditMultiplier:1, auditAmount:'2,400.00',
        completedAudit:'1,200.00', remainingAudit:'1,200.00', auditAdjustment:'0.00', remark:'预测《NBA 总决赛 MVP 是谁》庄家结算盈利，按庄家盈利稽核倍数生成',
        status:'进行中', releaseSettings:'输光自动解除 | 立刻解除', operator:'系统', operationType:'create',
        adjustmentDetail:null, createTime:'2026-03-31 14:30:00', updateTime:'2026-03-31 15:02:00',
        vipLevel:'VIP4', accountBalance:'52,400.00', auditProgress:50 },
      { id:1, memberId:'2013206764355186690', username:'user001', txType:'活动', activityName:'投注返水',
        currency:'INR', transactionAmount:'1,000.00', auditMultiplier:3, auditAmount:'3,000.00',
        completedAudit:'0.00', remainingAudit:'3,000.00', auditAdjustment:'0.00', remark:'首次参与返水活动',
        status:'未开始', releaseSettings:'输光自动解除 | 立刻解除', operator:'系统', operationType:'create',
        adjustmentDetail:null, createTime:'2026-02-05 10:30:15', updateTime:'2026-02-05 10:30:15',
        vipLevel:'VIP3', accountBalance:'8,520.00', auditProgress:0 },
      { id:2, memberId:'2013206764355186691', username:'user002', txType:'存款', activityName:'首充活动',
        currency:'INR', transactionAmount:'5,000.00', auditMultiplier:5, auditAmount:'25,000.00',
        completedAudit:'12,500.00', remainingAudit:'12,500.00', auditAdjustment:'0.00', remark:'首充用户奖励',
        status:'进行中', releaseSettings:'输光自动解除 | 充值后解除', operator:'admin001', operationType:'create',
        adjustmentDetail:null, createTime:'2026-02-04 14:20:30', updateTime:'2026-02-05 09:15:42',
        vipLevel:'VIP5', accountBalance:'15,230.50', auditProgress:50 },
      { id:3, memberId:'2013206764355186692', username:'user003', txType:'活动', activityName:'每日签到',
        currency:'INR', transactionAmount:'500.00', auditMultiplier:1, auditAmount:'500.00',
        completedAudit:'500.00', remainingAudit:'0.00', auditAdjustment:'0.00', remark:'连续签到7天奖励',
        status:'已完成', releaseSettings:'输光自动解除 | 立刻解除', operator:'系统', operationType:'create',
        adjustmentDetail:null, createTime:'2026-02-03 08:00:00', updateTime:'2026-02-04 18:25:10',
        vipLevel:'VIP2', accountBalance:'2,100.00', auditProgress:100 },
      { id:4, memberId:'2013206764355186693', username:'user004', txType:'奖金', activityName:'VIP奖金',
        currency:'INR', transactionAmount:'10,000.00', auditMultiplier:8, auditAmount:'80,000.00',
        completedAudit:'35,200.00', remainingAudit:'44,800.00', auditAdjustment:'-5,000.00', remark:'VIP5升级奖励，人工调整减少5000稽核',
        status:'进行中', releaseSettings:'输光不自动解除', operator:'admin002', operationType:'adjust',
        adjustmentDetail:'稽核金额调整：减少5,000.00', createTime:'2026-02-01 16:45:20', updateTime:'2026-02-05 11:30:00',
        vipLevel:'VIP5', accountBalance:'45,600.00', auditProgress:44 },
      { id:5, memberId:'2013206764355186694', username:'user005', txType:'注册', activityName:'新用户注册奖励',
        currency:'INR', transactionAmount:'100.00', auditMultiplier:10, auditAmount:'1,000.00',
        completedAudit:'0.00', remainingAudit:'1,000.00', auditAdjustment:'0.00', remark:'',
        status:'未开始', releaseSettings:'输光自动解除 | 立刻解除', operator:'系统', operationType:'create',
        adjustmentDetail:null, createTime:'2026-02-05 12:10:05', updateTime:'2026-02-05 12:10:05',
        vipLevel:'VIP0', accountBalance:'100.00', auditProgress:0 },
      { id:6, memberId:'2013206764355186695', username:'user006', txType:'活动', activityName:'春节特惠活动',
        currency:'INR', transactionAmount:'2,000.00', auditMultiplier:'-', auditAmount:'5,000.00',
        completedAudit:'2,100.00', remainingAudit:'2,900.00', auditAdjustment:'+500.00', remark:'自定义活动名称，固定稽核金额5000，人工增加500稽核',
        status:'进行中', releaseSettings:'输光自动解除 | 充值后解除', operator:'admin003', operationType:'adjust',
        adjustmentDetail:'稽核金额调整：增加500.00', createTime:'2026-02-02 09:30:00', updateTime:'2026-02-05 10:00:00',
        vipLevel:'VIP4', accountBalance:'12,500.00', auditProgress:42 },
      { id:7, memberId:'2013206764355186696', username:'user007', txType:'调账', activityName:'人工调账',
        currency:'INR', transactionAmount:'3,500.00', auditMultiplier:2, auditAmount:'7,000.00',
        completedAudit:'7,000.00', remainingAudit:'0.00', auditAdjustment:'0.00', remark:'客户投诉补偿',
        status:'已完成', releaseSettings:'输光自动解除 | 充值后解除', operator:'admin001', operationType:'adjust',
        adjustmentDetail:'解除设置调整：输光不自动解除 → 输光自动解除', createTime:'2026-01-30 15:20:00', updateTime:'2026-02-03 14:50:30',
        vipLevel:'VIP3', accountBalance:'5,200.00', auditProgress:100 },
      { id:8, memberId:'2013206764355186697', username:'user008', txType:'存款', activityName:'每日充值活动',
        currency:'INR', transactionAmount:'800.00', auditMultiplier:4, auditAmount:'3,200.00',
        completedAudit:'1,600.00', remainingAudit:'1,600.00', auditAdjustment:'0.00', remark:'限定仅真人和体育平台',
        status:'进行中', releaseSettings:'输光自动解除 | 立刻解除', operator:'admin004', operationType:'adjust',
        adjustmentDetail:'平台限制调整：不限制 → 仅限以下平台（真人、体育）', createTime:'2026-02-05 08:15:20', updateTime:'2026-02-05 11:45:10',
        vipLevel:'VIP2', accountBalance:'3,800.00', auditProgress:50 },
      { id:9, memberId:'2013206764355186698', username:'user009', txType:'活动', activityName:'邀请好友',
        currency:'INR', transactionAmount:'1,500.00', auditMultiplier:6, auditAmount:'9,000.00',
        completedAudit:'4,200.00', remainingAudit:'4,800.00', auditAdjustment:'0.00', remark:'排除电竞和捕鱼平台',
        status:'进行中', releaseSettings:'输光自动解除 | 立刻解除', operator:'admin002', operationType:'adjust',
        adjustmentDetail:'平台限制调整：不限制 → 排除以下平台（电竞、捕鱼）', createTime:'2026-02-04 13:25:30', updateTime:'2026-02-05 09:20:15',
        vipLevel:'VIP3', accountBalance:'7,200.00', auditProgress:47 },
      { id:10, memberId:'2013206764355186699', username:'user010', txType:'奖金', activityName:'VIP周俸禄',
        currency:'INR', transactionAmount:'5,000.00', auditMultiplier:5, auditAmount:'25,000.00',
        completedAudit:'8,000.00', remainingAudit:'17,000.00', auditAdjustment:'+2,000.00', remark:'增加稽核金额并修改解除方式',
        status:'进行中', releaseSettings:'输光自动解除 | 立刻解除', operator:'admin003', operationType:'adjust',
        adjustmentDetail:'稽核金额调整：增加2,000.00；解除方式：充值后解除 → 立刻解除', createTime:'2026-02-03 10:40:00', updateTime:'2026-02-05 14:30:25',
        vipLevel:'VIP6', accountBalance:'28,500.00', auditProgress:32 },
    ]);

    /* ---- 筛选 ---- */
    const expanded = ref(false);
    const filters = reactive({
      accountType: 'memberId', accountInfo: '',
      status: '', txType: '',
      createRange: ['2026-02-05','2026-02-05'],
      updateRange: [],
    });
    const filtered = ref([...rows.value]);
    const search = () => {
      filtered.value = rows.value.filter(r => {
        if (filters.accountInfo) {
          const kw = filters.accountInfo.trim().toLowerCase();
          const v = String(r[filters.accountType === 'username' ? 'username' : 'memberId']).toLowerCase();
          if (!v.includes(kw)) return false;
        }
        if (filters.status && r.status !== filters.status) return false;
        if (filters.txType && r.txType !== filters.txType) return false;
        if (filters.createRange && filters.createRange.length === 2 && filters.createRange[0]) {
          const d = r.createTime.split(' ')[0];
          if (d < filters.createRange[0] || d > filters.createRange[1]) return false;
        }
        if (filters.updateRange && filters.updateRange.length === 2 && filters.updateRange[0]) {
          const d = r.updateTime.split(' ')[0];
          if (d < filters.updateRange[0] || d > filters.updateRange[1]) return false;
        }
        return true;
      });
      pager.page = 1;
    };
    const reset = () => {
      filters.accountType = 'memberId'; filters.accountInfo = '';
      filters.status = ''; filters.txType = '';
      filters.createRange = ['2026-02-05','2026-02-05'];
      filters.updateRange = [];
      filtered.value = [...rows.value];
      pager.page = 1;
    };

    /* ---- 分页 ---- */
    const pager = reactive({ page: 1, size: 20 });
    const pagedRows = computed(() => {
      const start = (pager.page - 1) * pager.size;
      return filtered.value.slice(start, start + pager.size);
    });

    /* ---- 列设置（规范 popover）---- */
    const columnOptions = reactive([
      { prop:'txType',    label:'交易类型',      visible:true },
      { prop:'name',      label:'名称',          visible:true },
      { prop:'currency',  label:'币种',          visible:true },
      { prop:'amount',    label:'交易金额',      visible:true },
      { prop:'multi',     label:'稽核倍数',      visible:true },
      { prop:'audit',     label:'稽核金额',      visible:true },
      { prop:'done',      label:'已稽核',        visible:true },
      { prop:'remain',    label:'未稽核',        visible:true },
      { prop:'adjust',    label:'稽核调整',      visible:true },
      { prop:'remark',    label:'备注',          visible:true },
      { prop:'status',    label:'状态',          visible:true },
      { prop:'release',   label:'解除设置',      visible:true },
      { prop:'operator',  label:'操作人',        visible:true },
      { prop:'opContent', label:'操作内容',      visible:true },
      { prop:'time',      label:'创建/更新时间', visible:true },
    ]);
    const isVisible = (prop) => columnOptions.find(c => c.prop === prop)?.visible;
    const allColsVisible = computed(() => columnOptions.every(c => c.visible));
    const someColsVisible = computed(() => {
      const v = columnOptions.filter(c => c.visible).length;
      return v > 0 && v < columnOptions.length;
    });
    const toggleAllCols = (val) => { columnOptions.forEach(c => { if (!c.required) c.visible = !!val; }); };

    /* ---- 工具 ---- */
    const statusTagType = (s) => s==='未开始' ? 'info' : s==='进行中' ? 'primary' : 'success';
    const adjustColor = (s) => {
      if (!s) return '#1f2937';
      if (s.startsWith('+')) return '#dc2626';
      if (s.startsWith('-')) return '#16a34a';
      return '#1f2937';
    };
    const copy = (txt) => {
      navigator.clipboard?.writeText(txt);
      ElMessage.success('已复制到剪贴板');
    };

    /* ---- 新增 ---- */
    const addDlg = reactive({
      visible: false,
      form: {
        accountInfo:'', balance:'', wager:'',
        txType:'', activityName:'', customName:'',
        txAmount: null, auditMethod:'amount', auditValue: null,
        autoRelease:'yes', releaseAmount: 100, releaseMode:'immediate',
        remark:'',
      },
    });
    const openAdd = () => {
      Object.assign(addDlg.form, {
        accountInfo:'', balance:'', wager:'', txType:'', activityName:'', customName:'',
        txAmount:null, auditMethod:'amount', auditValue:null,
        autoRelease:'yes', releaseAmount:100, releaseMode:'immediate', remark:'',
      });
      addDlg.visible = true;
    };
    const addSearchUser = () => {
      if (!addDlg.form.accountInfo) { ElMessage.warning('请输入账号信息'); return; }
      addDlg.form.balance = '10,000.00';
      addDlg.form.wager = '5,000.00';
      ElMessage.success('用户信息已自动带出');
    };
    const currentActivityOptions = computed(() => ACTIVITY_MAP[addDlg.form.txType] || []);
    const onTxTypeChange = () => { addDlg.form.activityName = ''; addDlg.form.customName = ''; };
    const submitAdd = () => {
      if (!addDlg.form.accountInfo) return ElMessage.warning('请填写账号信息');
      if (!addDlg.form.txType)      return ElMessage.warning('请选择交易类型');
      if (!addDlg.form.txAmount)    return ElMessage.warning('请输入交易金额');
      if (!addDlg.form.auditValue)  return ElMessage.warning('请输入稽核金额/倍数');
      ElMessage.success('新增稽核记录已提交');
      addDlg.visible = false;
    };

    /* ---- 稽核调整 ---- */
    const adjustDlg = reactive({
      visible:false, row:null,
      form:{ type:'increase', amount:null, reason:'' },
    });
    const openAdjust = (row) => {
      adjustDlg.row = row;
      adjustDlg.form = { type:'increase', amount:null, reason:'' };
      adjustDlg.visible = true;
    };
    const parseAmt = (s) => parseFloat(String(s).replace(/,/g, '')) || 0;
    const fmt = (n) => n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    const previewAdjusted = computed(() => {
      if (!adjustDlg.row) return '0.00';
      const orig = parseAmt(adjustDlg.row.auditAmount);
      const amt = adjustDlg.form.amount || 0;
      return fmt(adjustDlg.form.type==='increase' ? orig + amt : orig - amt);
    });
    const fillOriginal = () => {
      if (adjustDlg.row) adjustDlg.form.amount = parseAmt(adjustDlg.row.auditAmount);
    };
    const submitAdjust = () => {
      if (!adjustDlg.form.amount) return ElMessage.warning('请输入调整金额');
      if (adjustDlg.form.type==='decrease' && adjustDlg.form.amount > parseAmt(adjustDlg.row.auditAmount))
        return ElMessage.warning('减少金额不可超过原稽核金额');
      ElMessage.success(`已${adjustDlg.form.type==='increase'?'增加':'减少'} ${fmt(adjustDlg.form.amount)} 稽核`);
      adjustDlg.visible = false;
    };

    /* ---- 详情 ---- */
    const detailDlg = reactive({ visible:false, row:null });
    const openDetail = (row) => { detailDlg.row = row; detailDlg.visible = true; };

    /* ---- 全局设置 ---- */
    const buildPlatformBucket = () => ({
      sport:  [ { name:'9Wickets', checked:true } ],
      slots:  [
        { name:'PG Soft', checked:true }, { name:'Pragmatic Play', checked:true },
        { name:'Jili', checked:true }, { name:'Spribe', checked:true },
        { name:'Hacksaw Gaming', checked:true }, { name:'NetEnt', checked:true },
      ],
      crash:  [
        { name:'Aviator (Spribe)', checked:true }, { name:'JetX', checked:true },
        { name:'Crash Royale', checked:true },
      ],
      lottery:[ { name:'Lottery India', checked:true }, { name:'Fast Parity', checked:true } ],
      live:   [
        { name:'Evolution Gaming', checked:true }, { name:'Ezugi', checked:true },
        { name:'SA Gaming', checked:true }, { name:'AE Sexy', checked:true },
      ],
      fish:   [ { name:'JDB Fishing', checked:true } ],
      chess:  [
        { name:'Ludo', checked:true }, { name:'Teen Patti', checked:true },
        { name:'Rummy', checked:true }, { name:'Andar Bahar', checked:true },
        { name:'7 Up Down', checked:true },
      ],
    });
    const globalDlg = reactive({
      visible:false,
      form:{ autoRelease:'yes', releaseAmount:100, releaseMode:'deposit',
             platformLimit:'unlimited' },
      vendors: buildPlatformBucket(),
      gameTab: 'sport',
    });
    const globalGameCats = computed(() => {
      const b = globalDlg.vendors;
      return [
        { key:'sport',   label:'体育',   sel:b.sport.filter(v=>v.checked).length,   total:b.sport.length },
        { key:'slots',   label:'老虎机', sel:b.slots.filter(v=>v.checked).length,   total:b.slots.length },
        { key:'crash',   label:'Crash',  sel:b.crash.filter(v=>v.checked).length,   total:b.crash.length },
        { key:'lottery', label:'彩票',   sel:b.lottery.filter(v=>v.checked).length, total:b.lottery.length },
        { key:'live',    label:'真人',   sel:b.live.filter(v=>v.checked).length,    total:b.live.length },
        { key:'fish',    label:'捕鱼',   sel:b.fish.filter(v=>v.checked).length,    total:b.fish.length },
        { key:'chess',   label:'棋牌',   sel:b.chess.filter(v=>v.checked).length,   total:b.chess.length },
      ];
    });
    const globalCurrentVendors = computed(() => globalDlg.vendors[globalDlg.gameTab] || []);
    const globalAllPlatform = computed({
      get: () => globalCurrentVendors.value.every(v => v.checked),
      set: (val) => { globalCurrentVendors.value.forEach(v => { v.checked = val; }); },
    });
    const globalToggleAll = (val) => { globalCurrentVendors.value.forEach(v => { v.checked = val; }); };
    const openGlobal = () => { globalDlg.visible = true; };
    const saveGlobal = () => { ElMessage.success('全局设置已保存，从下一条新生成的稽核开始生效'); globalDlg.visible = false; };

    return {
      Search: icons.Search, Refresh: icons.Refresh, Plus: icons.Plus,
      Setting: icons.Setting, Operation: icons.Operation,
      RefreshRight: icons.RefreshRight, CopyDocument: icons.CopyDocument,
      ArrowUp: icons.ArrowUp, ArrowDown: icons.ArrowDown,
      TX_TYPES, PLATFORMS,
      expanded,
      filters, filtered, search, reset,
      pager, pagedRows,
      columnOptions, isVisible, allColsVisible, someColsVisible, toggleAllCols,
      statusTagType, adjustColor, copy,
      addDlg, openAdd, addSearchUser, currentActivityOptions, onTxTypeChange, submitAdd,
      adjustDlg, openAdjust, previewAdjusted, fillOriginal, submitAdjust,
      detailDlg, openDetail,
      globalDlg, openGlobal, saveGlobal,
      globalGameCats, globalCurrentVendors, globalAllPlatform, globalToggleAll,
    };
  },
});
app.component('finance-audit', FinanceAudit);

for (const [k, c] of Object.entries(ElementPlusIconsVue)) {
  app.component(k, c);
}
app.use(ElementPlus);
app.mount('#app');

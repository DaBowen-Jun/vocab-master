// 产品功能结构图（交互式）：作为交付物之一的页面原型
const MODULES = [
  {
    group: '核心学习模块',
    color: '#3366ff',
    items: [
      { name: '跟读', desc: '标准发音播放 → 录音跟读 → 相似度评分反馈' },
      { name: '拼写', desc: '听音拼写 / 看义拼写，即时判对错' },
      { name: '中英考试', desc: '中译英、英译中两种题型，测验检验掌握度' },
    ],
  },
  {
    group: '激励体系',
    color: '#f59e0b',
    items: [
      { name: '每日打卡', desc: '连续打卡天数可视化，断签重置' },
      { name: '里程碑成就', desc: '累计 500 词 / 连续 30 天等阶段目标解锁' },
      { name: '积分系统', desc: '任务与高分换积分，兑换奖励或称号' },
    ],
  },
  {
    group: '词汇掌握度追踪',
    color: '#22c55e',
    items: [
      { name: '熟练度计算', desc: '按耗时与正确率综合计算 0-100%' },
      { name: '双重呈现', desc: '百分比数字 + 进度条长度直观区分' },
      { name: '智能排序', desc: '学习列表按熟练度从低到高，优先薄弱词' },
    ],
  },
  {
    group: '词汇内容',
    color: '#6366f1',
    items: [
      { name: '高频词库', desc: '小学/初中/高中三学段，★标记高频等级' },
      { name: '用法卡片', desc: '每个词配备用法说明' },
      { name: '例句卡片', desc: '点击查看中英双语例句并朗读' },
    ],
  },
]

export function FeatureMap() {
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-1">产品功能结构图</h2>
      <p className="text-sm text-slate-500 mb-4">
        四大模块协同：学习产生数据 → 掌握度追踪 → 激励体系反哺学习动力。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <div key={m.group} className="card p-4 border-l-4" style={{ borderLeftColor: m.color }}>
            <div className="font-bold mb-2" style={{ color: m.color }}>
              {m.group}
            </div>
            <ul className="space-y-2">
              {m.items.map((it) => (
                <li key={it.name} className="flex gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                  <div>
                    <div className="text-sm font-semibold">{it.name}</div>
                    <div className="text-xs text-slate-500">{it.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card mt-4 p-4 bg-slate-50">
        <div className="text-sm font-bold mb-2">技术架构</div>
        <div className="text-xs text-slate-600 leading-relaxed">
          前端：React + TypeScript + Vite + Tailwind CSS + ECharts（熟练度 / 打卡可视化）<br />
          后端（可选）：Node.js / FastAPI + SQLite / PostgreSQL，提供词库与进度同步 API<br />
          发音：浏览器原生 Web Speech API（SpeechSynthesis 朗读 / SpeechRecognition 跟读评分）<br />
          状态：本地 localStorage 持久化（Demo）；可平滑替换为后端接口
        </div>
      </div>
    </div>
  )
}

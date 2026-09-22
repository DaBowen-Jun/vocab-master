import { store } from '../lib/store'
import { useProgress } from '../lib/useProgress'
import { STAGE_META, STAGE_ORDER, type Stage } from '../lib/types'
import { CAMP_IMAGES } from '../assets/camp'
import { LockIcon, CheckCircleIcon } from '../components/icons'

// 每个学段营地对应的原创角色与场景说明（角色全原创，无版权风险）
const CAMP_INFO: Record<Stage, { title: string; scene: string; pals: string[]; tip: string }> = {
  primary: {
    title: '小学 · 篝火营地',
    scene: '夜色里的篝火堆，原创小伙伴围坐夜话',
    pals: ['小狐狸「火火」', '兔兔「跳跳」', '熊熊「墩墩」', '圆头机器人「叮咚」'],
    tip: '背完小学词汇，就点亮第一片营地——火火它们会一直陪你闯关。',
  },
  junior: {
    title: '初中 · 观星营地',
    scene: '草地上架起望远镜，天灯升空，银河垂落',
    pals: ['猫头鹰「星仔」', '提灯小鹿「小满」'],
    tip: '中学词汇过关，解锁观星营地——星仔带你把单词一颗颗挂上夜空。',
  },
  senior: {
    title: '高中 · 毕业营地',
    scene: '抛起学士帽，烟花与萤火虫一同点亮夜空',
    pals: ['举帽学长「阿哲」', '举灯伙伴「小柚」'],
    tip: '高中词汇通关，毕业营地绽放——这是属于你的高光时刻。',
  },
}

export function Camp() {
  const p = useProgress()
  const unlockedCount = STAGE_ORDER.filter((s) => store.campState(s).unlocked).length

  return (
    <div className="space-y-4">
      <div className="card p-4 bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
        <div className="text-lg font-extrabold">成长营地</div>
        <div className="text-xs opacity-85 mt-0.5 leading-relaxed">
          每点亮一个学段，就解锁一片专属成长场景——里面的原创小伙伴会陪你继续闯关。
        </div>
        <div className="mt-2 text-xs opacity-90">
          已点亮 <span className="font-bold text-base">{unlockedCount}</span> / {STAGE_ORDER.length} 片营地
        </div>
      </div>

      {STAGE_ORDER.map((stage) => {
        const meta = STAGE_META[stage]
        const info = CAMP_INFO[stage]
        const cs = store.campState(stage)
        const img = CAMP_IMAGES[stage]
        return (
          <div
            key={stage}
            className="card overflow-hidden p-0"
          >
            <div className="relative w-full aspect-[3/2] bg-slate-100">
              <img
                src={img}
                alt={info.title}
                className="absolute inset-0 w-full h-full object-cover"
                style={cs.unlocked ? undefined : { filter: 'grayscale(1) brightness(0.5)' }}
                loading="lazy"
              />
              {/* 顶部学段徽标 */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow"
                  style={{ background: meta.color }}
                >
                  {meta.short}
                </span>
                <span className="text-white text-sm font-bold drop-shadow">{info.title}</span>
              </div>

              {/* 未解锁：锁 + 进度遮罩 */}
              {!cs.unlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <LockIcon className="w-9 h-9 text-white/90 drop-shadow" />
                  <div className="text-white text-xs font-semibold drop-shadow">
                    已练习 {cs.learned} / {cs.goal} 词点亮
                  </div>
                  <div className="w-2/3">
                    <div className="h-2 rounded-full bg-white/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${Math.round(cs.ratio * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-white/80 text-[11px] drop-shadow">再练 {Math.max(0, cs.goal - cs.learned)} 个本学段单词即可解锁</div>
                </div>
              )}

              {/* 已解锁：已点亮徽章 */}
              {cs.unlocked && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 text-emerald-600 text-[11px] font-bold px-2 py-1 rounded-full shadow">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  已点亮
                </div>
              )}
            </div>

            {/* 文案区 */}
            <div className="p-3">
              <div className="text-xs text-slate-400 mb-1">{info.scene}</div>
              {cs.unlocked ? (
                <>
                  <div className="text-xs text-slate-500 mb-2">
                    陪你闯关的伙伴：{info.pals.join('、')}
                  </div>
                  <div className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
                    {info.tip}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 leading-relaxed">{info.tip}</div>
              )}
            </div>
          </div>
        )
      })}

      <div className="text-center text-[11px] text-slate-300 px-4">
        营地场景由 AI 生成，角色均为原创设计，无版权风险。
      </div>
    </div>
  )
}

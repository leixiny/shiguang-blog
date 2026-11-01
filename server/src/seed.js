import bcrypt from 'bcryptjs'
import { db } from './db.js'

const now = () => new Date().toISOString()

// 种子数据：仅在空库时写入，方便演示与截图
export function seedIfEmpty() {
  seedUsersPosts()
  seedCommentsIfEmpty()
}

function seedUsersPosts() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
  if (userCount > 0) return

  db.prepare(
    'INSERT INTO users (username, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run('leixiny', 'leixinyi@stu.edu.cn', bcrypt.hashSync('demo123456', 10), '', now())

  const cats = [
    ['课程笔记', '课堂知识与课后整理'],
    ['项目复盘', '做过的项目，踩过的坑'],
    ['行业观察', '数字经济领域的见闻与思考'],
    ['工具技巧', '让效率翻倍的方法与工具'],
  ]
  const insertCat = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)')
  const catIds = {}
  for (const [name, desc] of cats) {
    const r = insertCat.run(name, desc)
    catIds[name] = Number(r.lastInsertRowid)
  }

  const posts = [
    {
      title: 'Power BI 数据看板复盘：31 个省份的消费差异是怎么做出来的',
      category: '项目复盘',
      tags: ['Power BI', '数据清洗', '可视化'],
      content: `## 为什么要做这个看板

课程作业要求解释「区域消费差异」，但原始数据分散在三个来源，口径完全不一致。
这件事让我明白：**数据分析 80% 的时间不在"分析"，而在把数据摆到同一张桌子上**。

## 我踩过的三个坑

1. **口径不一致**：三份数据的"消费支出"统计范围不同，直接合并会得出错误结论。最后统一到人均消费支出口径。
2. **命名差异**：同一个省份在三份数据里有三种写法（"内蒙古"/"内蒙古自治区"/"蒙"），用映射表统一。
3. **图表贪多**：第一版塞了 9 个图，老师只留了两条分析线——人均消费与消费结构。

## 最终结构

- 上半屏：人均消费地图，颜色深浅看差异
- 下半屏：消费结构堆叠条形图，联动筛选省份

## 结果

被选为课程展示案例，评分 A。最大的收获是：**看板不是图表堆砌，是给结论铺路**。`,
    },
    {
      title: '312 份问卷教会我的三件事',
      category: '课程笔记',
      tags: ['用户调研', '问卷设计', '需求排序'],
      content: `校园二手平台留存偏低，团队争论很久该先改哪一环。最后我们发了 312 份问卷、做了 12 场深访，把直觉换成了证据。

## 第一件：问"为什么"不如问"上次"

"你为什么不用这个功能"得到的都是客套话。改成"你上次想卖东西时是怎么做的"，回答立刻真实起来。

## 第二件：样本量救不了烂问卷

选项设计不好，回收 1000 份也没用。我们第一版问卷把"价格太贵"和"怕被骗"混在一个选项里，交叉分析时完全拆不开。

## 第三件：优先级要用影响面排序

把流失原因按「影响人数 × 可改进程度」排成矩阵，3 条优先级进入排期，首条上线后次月留存回升。

> 调研的价值不在报告厚度，在能不能变成排期里的一行。`,
    },
    {
      title: '数字经济方向的学习路线：从 SQL 到用户调研',
      category: '课程笔记',
      tags: ['学习路线', 'SQL', '指标体系'],
      content: `两年下来，我把数字经济专业的技能拆成了四层，按顺序补齐最省力。

## 第一层：数据基本功

- **SQL**：一切的开始，SELECT 到窗口函数够用
- **Excel 建模**：别小看它，透视表 + 函数能解决一半作业

## 第二层：分析与可视化

- **Python / pandas**：清洗合并，处理脏数据
- **Power BI / Tableau**：把结果讲给非技术的人听

## 第三层：业务思维

- **用户调研**：问卷与深访，搞清楚"为什么"
- **指标体系**：北极星指标、漏斗、留存

## 第四层：把东西做出来

- **Git 与部署**：做出能访问的东西，比 PPT 有说服力一万倍

> 顺序不能乱：先能查数，再会做图，然后懂业务，最后能落地。`,
    },
    {
      title: '用 Vibe Coding 一下午搭出自己的作品集网站',
      category: '工具技巧',
      tags: ['Vibe Coding', 'React', '静态部署'],
      content: `纸质简历承载不了作品细节，我用一个下午完成了单页作品集并部署上线，全过程没有手写一行样板代码。

## 流程

1. **内容先行**：先写完文案，再让代码适配内容，而不是反过来
2. **分块对话**：每次只描述一个区块的需求，AI 生成的代码可控性高得多
3. **即时验证**：构建 → 部署 → 手机打开，马上发现横向滚动问题

## 三个经验

- 提示词里给出**约束**（移动端优先、无横向滚动）比给出**答案**有效
- 版式不满意时，描述"感觉"不如贴一张参考截图
- 上线前用真手机测一遍，桌面浏览器会骗你

首屏 3 秒内可读完核心信息——这是我对这个站的唯一硬指标。`,
    },
  ]

  const authorId = db.prepare('SELECT id FROM users LIMIT 1').get().id
  const insertPost = db.prepare(`
    INSERT INTO posts (title, content, cover, category_id, tags, author_id, views, created_at, updated_at)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)
  `)
  // 上传日期错开，让"最新排序"有层次
  const dates = ['2026-10-30T10:00:00.000Z', '2026-10-29T10:00:00.000Z', '2026-10-28T10:00:00.000Z', '2026-10-27T10:00:00.000Z']
  const views = [86, 132, 64, 97]
  posts.forEach((p, i) => {
    insertPost.run(p.title, p.content, catIds[p.category], JSON.stringify(p.tags), authorId, views[i], dates[i], dates[i])
  })

  console.log('[seed] 已写入种子数据：1 个用户、4 个分类、4 篇文章')
}

function seedCommentsIfEmpty() {
  const commentCount = db.prepare('SELECT COUNT(*) AS c FROM comments').get().c
  if (commentCount > 0) return
  const firstUser = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get()
  if (!firstUser) return
  const posts = db.prepare('SELECT id FROM posts ORDER BY id LIMIT 3').all()
  if (posts.length < 3) return

  // 注册一个评论用户，让评论区更像真实互动
  let visitor = db.prepare('SELECT id FROM users WHERE username = ?').get('chen_study')
  let visitorId
  if (visitor) {
    visitorId = visitor.id
  } else {
    const r = db
      .prepare('INSERT INTO users (username, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('chen_study', 'chenstudy@stu.edu.cn', bcrypt.hashSync('demo123456', 10), '', now())
    visitorId = Number(r.lastInsertRowid)
  }

  const rows = [
    { post: posts[0].id, author: firstUser.id, content: '口径统一那段太真实了，我也在三份数据源里挣扎过，映射表确实是唯一的活路。', at: '2026-10-30T12:30:00.000Z' },
    { post: posts[0].id, author: visitorId, content: '请问地图用的什么图？我做的省份地图颜色一直糊成一片。', at: '2026-10-30T15:10:00.000Z' },
    { post: posts[1].id, author: visitorId, content: '"样本量救不了烂问卷"这句想印在 T 恤上。第一版问卷我们也是这样翻车的。', at: '2026-10-29T18:40:00.000Z' },
    { post: posts[1].id, author: firstUser.id, content: '回复 chen_study：影响面矩阵我整理了下学期分享，到时候发出来～', at: '2026-10-29T19:05:00.000Z' },
    { post: posts[2].id, author: visitorId, content: '第一层 SQL 刚入门，按这个顺序走感觉稳多了，收藏！', at: '2026-10-28T20:15:00.000Z' },
  ]
  const insert = db.prepare(
    'INSERT INTO comments (post_id, author_id, content, created_at) VALUES (?, ?, ?, ?)'
  )
  for (const r of rows) insert.run(r.post, r.author, r.content, r.at)
  console.log('[seed] 已写入种子评论：5 条')
}

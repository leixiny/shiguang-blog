# 拾光志 · 数字经济学习笔记 —— 数据库设计

> 按课程文档《全栈应用开发》的方法：先设计数据库，再写需求文档，再开发。
> 原方案为 MySQL，本机改用 SQLite（Node 内置 `node:sqlite`），表结构与字段设计保持一致思路。

## 用户表（users）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 主键 |
| username | TEXT UNIQUE NOT NULL | 用户名（3-20 字符） |
| email | TEXT UNIQUE NOT NULL | 邮箱 |
| password | TEXT NOT NULL | 密码（bcrypt 加密存储） |
| avatar | TEXT | 头像 URL（可空） |
| created_at | TEXT | 创建时间（ISO 字符串） |

## 分类表（categories）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 主键 |
| name | TEXT UNIQUE NOT NULL | 分类名称 |
| description | TEXT | 分类描述 |

内置四个数字经济方向的分类：课程笔记、项目复盘、行业观察、工具技巧。

## 文章表（posts）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 主键 |
| title | TEXT NOT NULL | 标题 |
| content | TEXT NOT NULL | 内容（Markdown 格式） |
| cover | TEXT | 封面图 URL（可空） |
| category_id | INTEGER | 分类 ID（外键关联 categories） |
| tags | TEXT | 标签（JSON 数组字符串） |
| author_id | INTEGER NOT NULL | 作者 ID（外键关联 users） |
| views | INTEGER DEFAULT 0 | 浏览次数 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

## 评论表（comments）

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 主键 |
| post_id | INTEGER NOT NULL | 文章 ID（外键关联 posts，级联删除） |
| author_id | INTEGER NOT NULL | 评论人 ID（外键关联 users） |
| content | TEXT NOT NULL | 评论内容（≤1000 字） |
| created_at | TEXT | 创建时间 |

## 关系说明

- users 1 ── N posts（author_id）
- categories 1 ── N posts（category_id）
- users 1 ── N comments（author_id）
- posts 1 ── N comments（post_id，文章删除时评论级联删除）
- 外键约束开启（`PRAGMA foreign_keys = ON`），删除分类前需先处理其文章。

## 种子数据

- 管理员账号：`leixiny` / 密码 `demo123456`（bcrypt 加密）
- 四个默认分类
- 四篇示例文章（数字经济主题，覆盖各分类）
- 五条示例评论（分布在前三篇文章下）

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import multer from 'multer';
import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3456;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const uploadDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(path.join(dataDir, 'seanyan.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    remark_name TEXT DEFAULT '',
    practice2_enabled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_data (
    user_id TEXT PRIMARY KEY,
    wrong_answers TEXT DEFAULT '[]',
    study_stats TEXT DEFAULT '{}',
    memory_status TEXT DEFAULT '{}',
    exam_history TEXT DEFAULT '[]',
    practice_progress TEXT DEFAULT '{}',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

try { db.exec("ALTER TABLE users ADD COLUMN remark_name TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN practice2_enabled INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE user_data ADD COLUMN practice_progress TEXT DEFAULT '{}'"); } catch {}

const stmts = {
  createUser: db.prepare('INSERT INTO users (id, student_id, name, password, role, remark_name, practice2_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  findUserByStudentId: db.prepare('SELECT * FROM users WHERE student_id = ?'),
  findUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  getAllUsers: db.prepare("SELECT id, student_id, name, role, remark_name, practice2_enabled, created_at FROM users WHERE role IN ('student', 'admin') ORDER BY created_at DESC"),
  updateUserPassword: db.prepare('UPDATE users SET password = ? WHERE student_id = ?'),
  updateUserProfile: db.prepare('UPDATE users SET name = ?, remark_name = ?, practice2_enabled = ? WHERE id = ?'),
  deleteUser: db.prepare("DELETE FROM users WHERE id = ? AND role != 'admin'"),
  deleteUserData: db.prepare('DELETE FROM user_data WHERE user_id = ?'),
  getUserData: db.prepare('SELECT * FROM user_data WHERE user_id = ?'),
  upsertUserData: db.prepare(`
    INSERT INTO user_data (user_id, wrong_answers, study_stats, memory_status, exam_history, practice_progress, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      wrong_answers = excluded.wrong_answers,
      study_stats = excluded.study_stats,
      memory_status = excluded.memory_status,
      exam_history = excluded.exam_history,
      practice_progress = excluded.practice_progress,
      updated_at = excluded.updated_at
  `),
};

function ensureAdmin() {
  const admin = stmts.findUserByStudentId.get('admin');
  if (!admin) {
    stmts.createUser.run('admin-default', 'admin', '管理员', ADMIN_PASSWORD, 'admin', '', 1, new Date().toISOString());
  } else {
    stmts.updateUserPassword.run(ADMIN_PASSWORD, 'admin');
  }
}
ensureAdmin();

function userResponse(user) {
  return {
    id: user.id,
    studentId: user.student_id,
    name: user.name,
    role: user.role,
    remarkName: user.remark_name || '',
    practice2Enabled: user.role === 'admin' || Boolean(user.practice2_enabled),
    createdAt: user.created_at,
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'server', time: new Date().toISOString() });
});

app.post('/api/register', (req, res) => {
  try {
    const { studentId, name, password } = req.body;
    if (!studentId || !name || !password) return res.status(400).json({ error: '学号、姓名和密码不能为空' });
    if (String(studentId).length < 2) return res.status(400).json({ error: '学号至少2个字符' });
    if (String(password).length < 4) return res.status(400).json({ error: '密码至少4个字符' });
    if (stmts.findUserByStudentId.get(studentId)) return res.status(409).json({ error: '该学号已被注册' });

    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    stmts.createUser.run(id, studentId, name, password, 'student', '', 0, new Date().toISOString());
    res.json({ success: true, user: userResponse(stmts.findUserByStudentId.get(studentId)) });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password) return res.status(400).json({ error: '学号和密码不能为空' });
    const user = stmts.findUserByStudentId.get(studentId);
    if (!user || user.password !== password) return res.status(401).json({ error: '学号或密码错误' });
    res.json({ success: true, user: userResponse(user) });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: '登录失败' });
  }
});

app.get('/api/users', (req, res) => {
  try {
    res.json({ users: stmts.getAllUsers.all().map(userResponse) });
  } catch (err) {
    console.error('[Users Error]', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

app.patch('/api/users/:id', (req, res) => {
  try {
    const user = stmts.findUserById.get(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const name = typeof req.body.name === 'string' && req.body.name.trim() ? req.body.name.trim() : user.name;
    const remarkName = typeof req.body.remarkName === 'string' ? req.body.remarkName.trim() : (user.remark_name || '');
    const practice2Enabled = typeof req.body.practice2Enabled === 'boolean'
      ? (req.body.practice2Enabled ? 1 : 0)
      : (user.practice2_enabled || 0);
    stmts.updateUserProfile.run(name, remarkName, practice2Enabled, req.params.id);
    res.json({ success: true, user: userResponse(stmts.findUserById.get(req.params.id)) });
  } catch (err) {
    console.error('[Update User Error]', err);
    res.status(500).json({ error: '更新用户失败' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const user = stmts.findUserById.get(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (user.role === 'admin') return res.status(403).json({ error: '不能删除管理员账号' });
    const tx = db.transaction(() => {
      stmts.deleteUserData.run(req.params.id);
      stmts.deleteUser.run(req.params.id);
    });
    tx();
    res.json({ success: true });
  } catch (err) {
    console.error('[Delete User Error]', err);
    res.status(500).json({ error: '删除用户失败' });
  }
});

app.get('/api/userdata/:userId', (req, res) => {
  try {
    const data = stmts.getUserData.get(req.params.userId);
    if (!data) {
      return res.json({ wrong_answers: '[]', study_stats: '{}', memory_status: '{}', exam_history: '[]', practice_progress: '{}' });
    }
    res.json({
      wrong_answers: data.wrong_answers,
      study_stats: data.study_stats,
      memory_status: data.memory_status,
      exam_history: data.exam_history,
      practice_progress: data.practice_progress,
    });
  } catch (err) {
    console.error('[UserData Error]', err);
    res.status(500).json({ error: '获取用户数据失败' });
  }
});

app.post('/api/userdata/:userId', (req, res) => {
  try {
    const { wrong_answers, study_stats, memory_status, exam_history, practice_progress } = req.body;
    stmts.upsertUserData.run(
      req.params.userId,
      JSON.stringify(wrong_answers || []),
      JSON.stringify(study_stats || {}),
      JSON.stringify(memory_status || {}),
      JSON.stringify(exam_history || []),
      JSON.stringify(practice_progress || {}),
      new Date().toISOString()
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[SaveUserData Error]', err);
    res.status(500).json({ error: '保存用户数据失败' });
  }
});

const typeMap = new Map([
  ['单选题', 'single'], ['选择题', 'single'], ['single', 'single'],
  ['填空题', 'fill'], ['fill', 'fill'],
  ['程序填空', 'codeFill'], ['codefill', 'codeFill'],
  ['程序改错', 'codeFix'], ['codefix', 'codeFix'],
]);

function splitQuestionBlocks(text) {
  const normalized = text
    .replace(/\r/g, '')
    .replace(/(题型|类型|分类|难度|题干|问题|题目|选项|代码|答案|解析|标签|type|category|difficulty|question|options|code|answer|explanation|tags)\s*[:：]/gi, '\n$1：')
    .trim();

  if (/(题型|type)\s*[:：]/i.test(normalized) && /(答案|answer)\s*[:：]/i.test(normalized)) {
    return normalized
      .split(/\n\s*#{3,}\s*\n|\n(?=(?:题型|type)\s*[:：])/i)
      .map((block) => block.trim())
      .filter((block) => block.length > 20);
  }

  return normalized
    .split(/\n(?=(?:#{2,}\s*)?(?:题目|Q|Question)\s*[:：]|\d+[.、]\s*)/i)
    .map((block) => block.trim())
    .filter((block) => block.length > 20);
}

function pickField(block, names) {
  for (const name of names) {
    const re = new RegExp(`${name}\\s*[:：]\\s*([\\s\\S]*?)(?=\\n(?:题型|分类|难度|题干|问题|选项|代码|答案|解析|标签)\\s*[:：]|$)`, 'i');
    const match = block.match(re);
    if (match) return match[1].trim();
  }
  return '';
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function parseQuestionBlock(block) {
  const typeRaw = pickField(block, ['题型', '类型', 'type']);
  const type = typeMap.get(typeRaw.trim()) || typeMap.get(typeRaw.trim().toLowerCase()) || 'single';
  const category = pickField(block, ['分类', '知识点', 'category']) || '未分类';
  const difficulty = pickField(block, ['难度', 'difficulty']) || 'easy';
  const question = pickField(block, ['题干', '问题', '题目', 'question']) || block.split('\n')[0].replace(/^\d+[.、]\s*/, '');
  const code = pickField(block, ['代码', 'code']) || null;
  const answer = pickField(block, ['答案', 'answer']);
  const explanation = pickField(block, ['解析', 'explanation']) || '暂无解析';
  const tagsRaw = pickField(block, ['标签', 'tags']);

  const optionsRaw = pickField(block, ['选项', 'options']);
  const optionLines = (optionsRaw || block)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[A-D][.、\s]/i.test(line));

  if (!question || !answer) return null;

  return {
    category,
    question,
    options: type === 'single' ? optionLines : undefined,
    answer,
    explanation,
    code,
    difficulty: difficulty.toLowerCase().includes('hard') || difficulty.includes('难') ? 'hard' : difficulty.toLowerCase().includes('medium') || difficulty.includes('中') ? 'medium' : 'easy',
    type,
    tags: tagsRaw ? tagsRaw.split(/[，,\s]+/).filter(Boolean) : [category],
  };
}

function questionsFilePath() {
  const distPath = path.join(__dirname, '..', 'dist', 'questions.json');
  const publicPath = path.join(__dirname, '..', 'public', 'questions.json');
  return fs.existsSync(distPath) ? distPath : publicPath;
}

const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/questions/import-word', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请上传 Word 文件' });
    const result = await mammoth.extractRawText({ path: req.file.path });
    fs.unlink(req.file.path, () => {});

    const filePath = questionsFilePath();
    const bank = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const questions = Array.isArray(bank.questions) ? bank.questions : [];
    const existingKeys = new Set(questions.map((q) => normalizeText(q.question || q.content)));
    let nextId = questions.reduce((max, q) => Math.max(max, Number(q.id) || 0), 0) + 1;

    const parsed = splitQuestionBlocks(result.value).map(parseQuestionBlock).filter(Boolean);
    const imported = [];
    const duplicates = [];

    for (const item of parsed) {
      const key = normalizeText(item.question);
      if (existingKeys.has(key)) {
        duplicates.push(item.question);
        continue;
      }
      existingKeys.add(key);
      imported.push({ id: nextId++, ...item });
    }

    const nextQuestions = [...questions, ...imported];
    const categories = [...new Set(nextQuestions.map((q) => q.category).filter(Boolean))];
    const nextBank = { total: nextQuestions.length, categories, questions: nextQuestions };
    const serialized = JSON.stringify(nextBank, null, 2);

    // Write to whichever path the server resolves (dist preferred in prod).
    fs.writeFileSync(filePath, serialized, 'utf-8');

    // Also write to the other location so a subsequent `npm run build` does
    // not silently erase the imported bank, and so dev (no dist) sees the
    // change without a manual copy.
    const publicPath = path.join(__dirname, '..', 'public', 'questions.json');
    const distPath = path.join(__dirname, '..', 'dist', 'questions.json');
    if (filePath === publicPath && fs.existsSync(path.dirname(distPath))) {
      try { fs.writeFileSync(distPath, serialized, 'utf-8'); } catch (e) { console.warn('[Import] dist write skipped:', e.message); }
    } else if (filePath === distPath) {
      try { fs.writeFileSync(publicPath, serialized, 'utf-8'); } catch (e) { console.warn('[Import] public write skipped:', e.message); }
    }

    res.json({ success: true, imported: imported.length, duplicates: duplicates.length, total: nextQuestions.length, duplicateSamples: duplicates.slice(0, 10) });
  } catch (err) {
    console.error('[Import Questions Error]', err);
    res.status(500).json({ error: '解析或导入题库失败' });
  }
});

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    if (!req.path.startsWith('/api/')) res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`[Server] SeanYan running on http://${HOST}:${PORT}`);
});

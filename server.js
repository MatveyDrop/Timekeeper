const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 3000;
// Подключение к базе данных SQLite
const db = new sqlite3.Database('./tasks.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
    }
});
// Создание таблиц
db.serialize(() => {
    db.run(
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    );
    db.run(
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            deadline TEXT,
            priority TEXT,
            status TEXT DEFAULT 'Pending',
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    );
});
// Middleware
app.use(cors());
app.use(bodyParser.json());
// Маршруты
// Регистрация пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run(
        INSERT INTO users (username, password) VALUES (?, ?),
        [username, password],
        function (err) {
            if (err) {
                res.status(400).json({ error: 'Имя пользователя занято.' });
            } else {
                res.status(201).json({ message: 'Пользователь зарегистрирован!', userId: this.lastID });
            }
        }
    );
});
// Авторизация пользователя
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(
        SELECT id FROM users WHERE username = ? AND password = ?,
        [username, password],
        (err, row) => {
            if (err || !row) {
                res.status(401).json({ error: 'Неверное имя пользователя или пароль.' });
            } else {
                res.json({ message: 'Авторизация успешна!', userId: row.id });
            }
        }
    );
});
// Получение всех задач пользователя
app.get('/tasks', (req, res) => {
    const userId = req.query.userId;
    db.all(
        SELECT * FROM tasks WHERE user_id = ?,
        [userId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Ошибка при получении задач.' });
            } else {
                res.json(rows);
            }
        }
    );
});
// Добавление новой задачи
app.post('/tasks', (req, res) => {
    const { userId, title, description, deadline, priority } = req.body;
    db.run(
        INSERT INTO tasks (user_id, title, description, deadline, priority) VALUES (?, ?, ?, ?, ?),
        [userId, title, description, deadline, priority],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Ошибка при добавлении задачи.' });
            } else {
                res.status(201).json({ message: 'Задача добавлена!', taskId: this.lastID });
            }
        }
    );
});
// Обновление статуса задачи
app.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { status } = req.body;
    db.run(
        UPDATE tasks SET status = ? WHERE id = ?,
        [status, taskId],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Ошибка при обновлении задачи.' });
            } else {
                res.json({ message: 'Задача обновлена!' });
            }
        }
    );
});
// Удаление задачи
app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    db.run(DELETE FROM tasks WHERE id = ?, [taskId], function (err) {
        if (err) {
            res.status(500).json({ error: 'Ошибка при удалении задачи.' });
        } else {
            res.json({ message: 'Задача удалена!' });
        }
    });
});
// Запуск сервера
app.listen(PORT, () => {
    console.log(Сервер запущен на http://localhost:${PORT});
});

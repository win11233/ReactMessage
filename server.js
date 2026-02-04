import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 1. Настраиваем базу данных
const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
});

// 2. Создаем таблицу, если её еще нет
await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    text TEXT
  )
`);

io.on('connection', async (socket) => {
    console.log('🔌 Пользователь подключился');

    // Отправляем историю при входе
    const history = await db.all('SELECT user, text FROM messages');
    socket.emit('chat_history', history);

    socket.on('message', async (data) => {
        // Сохраняем в базу
        await db.run('INSERT INTO messages (user, text) VALUES (?, ?)', [data.user, data.text]);
        // Рассылаем всем
        io.emit('message', data);
    });
});

server.listen(3001, () => {
    console.log('🦾 ЗЕВС С БАЗОЙ ДАННЫХ ЗАПУЩЕН НА ПОРТУ 3001');
});
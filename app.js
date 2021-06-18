import express, { response } from 'express';
import cors from 'cors';
import pg from 'pg';
import joi from 'joi';
import dayjs from 'dayjs';

const { Pool } = pg;

const connection = new Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp',
});

const app = express();
app.use(cors());
app.use(express.json());

/*--------------------------CATEGORIES--------------------------------*/

app.get('/categories', async (req, res) => {
    const response = await connection.query('SELECT * FROM categories');
    res.send(response.rows);
});

app.post('/categories', async (req, res) => {
    const category = req.body.name;
    if (category === '') {
        res.sendStatus(400);
    }

    const searchForCategory = await connection.query(
        'SELECT $1 FROM categories',
        [category]
    );
    const hasCategory = searchForCategory.rows.length !== 0;

    if (!hasCategory) {
        const response = await connection.query(
            'INSERT INTO categories (name) VALUES ($1)',
            [category]
        );
        res.sendStatus(201);
    } else {
        res.sendStatus(409);
    }
});

app.listen(4000, () => {
    console.log('rodando');
});

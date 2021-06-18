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

/*--------------------------GAMES--------------------------------*/

app.get('/games', async (req, res) => {
    const { name } = req.query;
    if (name === undefined) {
        const games = await connection.query('SELECT * FROM games');
        res.send(games.rows);
    } else {
        const games = await connection.query(
            'SELECT * FROM games WHERE name ILIKE $1',
            ['%' + name + '%']
        );
        res.send(games.rows);
    }
});

app.post('/games', async (req, res) => {
    const { name, stockTotal, pricePerDay, categoryId, image } = req.body;
    const verifyId = await connection.query(
        'SELECT * FROM categories WHERE id = $1',
        [categoryId]
    );
    const verifyName = await connection.query(
        'SELECT * FROM games WHERE name = $1',
        [name]
    );

    if (name === '') {
        res.sendStatus(400);
    } else if (stockTotal <= 0 || pricePerDay <= 0) {
        res.sendStatus(400);
    } else if (parseInt(verifyId.rows.length) === 0) {
        res.sendStatus(400);
    } else if (parseInt(verifyName.rows.length) != 0) {
        res.sendStatus(409);
    } else {
        try {
            const response = await connection.query(
                'INSERT INTO games (name, "stockTotal", "pricePerDay", "categoryId", image) VALUES ($1, $2, $3, $4, $5)',
                [name, stockTotal, pricePerDay, categoryId, image]
            );
            res.sendStatus(201);
        } catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }
});
/*--------------------------CUSTOMERS--------------------------------*/

app.get('/customers', async (req, res) => {
    const cpf = req.query.cpf;
    try {
        if (!cpf) {
            const cpfs = await connection.query('SELECT * FROM customers');
            res.send(cpfs.rows);
        } else {
            const cpfs = await connection.query(
                'SELECT * FROM customers WHERE cpf = $1',
                ['%' + cpf + '%']
            );
            res.send(cpfs.rows);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.get('/customers/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const searchForID = await connection.query(
            'SELECT * FROM customers WHERE id = $1',
            [id]
        );
        if (searchForID.rows.length === 0) {
            res.sendStatus(404);
        } else {
            res.send(searchForID.rows[0]);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.post('/customers', async (req, res) => {
    const validatingCustomer = req.body;
    delete validatingCustomer.id;
    try {
        const hasThisCPF = await connection.query(
            'SELECT * FROM customers WHERE cpf = $1',
            [validatingCustomer.cpf]
        );
        if (hasThisCPF.rows.length === 0) {
            const customerSchema = joi.object({
                name: joi.string().min(1).required(),
                phone: joi
                    .string()
                    .pattern(/^[0-9]+$/, 'numbers')
                    .min(10)
                    .max(11)
                    .required(),
                cpf: joi
                    .string()
                    .pattern(/^[0-9]+$/, 'numbers')
                    .min(11)
                    .max(11)
                    .required(),
                birthday: joi.date().required(),
            });
            const customer = customerSchema.validate(validatingCustomer);
            if ('error' in customer) {
                console.log(customer.error);
                res.sendStatus(400);
            } else {
                const { name, phone, cpf, birthday } = validatingCustomer;
                connection.query(
                    'INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)',
                    [name, phone, cpf, birthday]
                );
                res.sendStatus(201);
            }
        } else {
            res.sendStatus(409);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.put('/customers/:id', async (req, res) => {
    const validatingCustomer = req.body;
    delete validatingCustomer.id;
    const id = parseInt(req.params.id);
    try {
        const searchForID = await connection.query(
            'SELECT * FROM customers WHERE id = $1',
            [id]
        );
        if (searchForID.rows.length === 0) {
            res.sendStatus(404);
        } else {
            const customerSchema = joi.object({
                name: joi.string().min(1).required(),
                phone: joi
                    .string()
                    .pattern(/^[0-9]+$/, 'numbers')
                    .min(10)
                    .max(11)
                    .required(),
                cpf: joi
                    .string()
                    .pattern(/^[0-9]+$/, 'numbers')
                    .min(11)
                    .max(11)
                    .required(),
                birthday: joi.date().required(),
            });
            const customer = customerSchema.validate(validatingCustomer);
            if ('error' in customer) {
                console.log(customer.error);
                res.sendStatus(400);
            } else {
                const { name, phone, cpf, birthday } = validatingCustomer;
                connection.query(
                    'UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5',
                    [name, phone, cpf, birthday, id]
                );
                res.sendStatus(201);
            }
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.listen(4000, () => {
    console.log('rodando');
});

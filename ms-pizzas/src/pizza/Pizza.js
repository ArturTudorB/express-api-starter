// entities/Pizza.js
const db = require('../config/database');

class Pizza {

    static create({ name, description, imageUrl, price, ingredientIds = [] }) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                const sql = `INSERT INTO pizzas (name, description, imageUrl, price, created_at, updated_at)
                             VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`;
                const params = [name, description || null, imageUrl || null, price];

                db.run(sql, params, function (err) {
                    if (err) return reject(err);

                    const pizzaId = this.lastID;
                    console.log('Pizza créée avec ID:', pizzaId);
                    console.log('IngredientIds reçus:', ingredientIds);

                    if (ingredientIds.length > 0) {
                        const insertRelations = ingredientIds.map(ingredientId => {
                            return new Promise((res, rej) => {
                                db.run(
                                    'INSERT INTO pizza_ingredients (pizza_id, ingredient_id) VALUES (?, ?)',
                                    [pizzaId, ingredientId],
                                    (err) => {
                                        if (err) {
                                            console.error('Erreur insertion relation:', err);
                                            rej(err);
                                        } else {
                                            console.log(`Relation ajoutée: pizza ${pizzaId} -> ingredient ${ingredientId}`);
                                            res();
                                        }
                                    }
                                );
                            });
                        });

                        Promise.all(insertRelations)
                            .then(() => Pizza.findById(pizzaId))
                            .then(resolve)
                            .catch(reject);
                    } else {
                        Pizza.findById(pizzaId).then(resolve).catch(reject);
                    }
                });
            });
        });
    }

    static findAll() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM pizzas ORDER BY id DESC`;

            db.all(sql, [], (err, pizzaRows) => {
                if (err) return reject(err);

                // Récupérer les ingrédients pour chaque pizza
                const pizzasWithIngredients = pizzaRows.map(pizza => {
                    return new Promise((resolve) => {
                        const ingredientsSql = `
                            SELECT i.id, i.name
                            FROM ingredients i
                            JOIN pizza_ingredients pi ON i.id = pi.ingredient_id
                            WHERE pi.pizza_id = ?
                        `;

                        db.all(ingredientsSql, [pizza.id], (err, ingredients) => {
                            resolve({
                                ...pizza,
                                ingredients: err ? [] : ingredients
                            });
                        });
                    });
                });

                Promise.all(pizzasWithIngredients)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM pizzas WHERE id = ?`;

            db.get(sql, [id], (err, pizza) => {
                if (err) return reject(err);
                if (!pizza) return resolve(null);

                console.log('Pizza trouvée:', pizza);

                const ingredientsSql = `
                    SELECT i.id, i.name
                    FROM ingredients i
                             JOIN pizza_ingredients pi ON i.id = pi.ingredient_id
                    WHERE pi.pizza_id = ?
                `;

                console.log('Recherche ingrédients pour pizza ID:', id);

                db.all(ingredientsSql, [id], (err, ingredients) => {
                    if (err) {
                        console.error('Erreur lors de la recherche des ingrédients:', err);
                        return reject(err);
                    }

                    console.log('Ingrédients trouvés:', ingredients);

                    resolve({
                        ...pizza,
                        ingredients: ingredients || []
                    });
                });
            });
        });
    }

    static update(id, { name, description, imageUrl, price, ingredientIds }) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Mettre à jour la pizza
                const sql = `
                    UPDATE pizzas
                    SET name = COALESCE(?, name),
                        description = COALESCE(?, description),
                        imageUrl = COALESCE(?, imageUrl),
                        price = COALESCE(?, price),
                        updated_at = datetime('now')
                    WHERE id = ?
                `;
                const params = [name, description, imageUrl, price, id];

                db.run(sql, params, function (err) {
                    if (err) return reject(err);
                    if (this.changes === 0) return resolve(null);

                    // Si ingredientIds est fourni, mettre à jour les relations
                    if (ingredientIds !== undefined) {
                        // Supprimer les anciennes relations
                        db.run('DELETE FROM pizza_ingredients WHERE pizza_id = ?', [id], (err) => {
                            if (err) return reject(err);

                            // Ajouter les nouvelles relations
                            if (ingredientIds.length > 0) {
                                const insertRelations = ingredientIds.map(ingredientId => {
                                    return new Promise((res, rej) => {
                                        db.run(
                                            'INSERT INTO pizza_ingredients (pizza_id, ingredient_id) VALUES (?, ?)',
                                            [id, ingredientId],
                                            (err) => err ? rej(err) : res()
                                        );
                                    });
                                });

                                Promise.all(insertRelations)
                                    .then(() => Pizza.findById(id))
                                    .then(resolve)
                                    .catch(reject);
                            } else {
                                Pizza.findById(id).then(resolve).catch(reject);
                            }
                        });
                    } else {
                        Pizza.findById(id).then(resolve).catch(reject);
                    }
                });
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Supprimer d'abord les relations (CASCADE devrait le faire automatiquement)
                db.run('DELETE FROM pizza_ingredients WHERE pizza_id = ?', [id], (err) => {
                    if (err) return reject(err);

                    // Ensuite supprimer la pizza
                    db.run('DELETE FROM pizzas WHERE id = ?', [id], function (err) {
                        if (err) return reject(err);
                        resolve(this.changes);
                    });
                });
            });
        });
    }
}

module.exports = Pizza;
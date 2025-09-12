const express = require('express');
const { body, param } = require('express-validator');
const ingredientController = require('./ingretiendController');


const router = express.Router();

const createIngredientValidation = [
  body('name').isString().withMessage('Name must be a string').notEmpty(),
    ];

router.get('/', ingredientController.findAll);
router.post('/', createIngredientValidation, ingredientController.create);
router.get('/:id', param('id').isInt().withMessage('ID must be an integer'), ingredientController.findOne);
router.put('/:id', [param('id').isInt().withMessage('ID must be an integer'), ...createIngredientValidation], ingredientController.update);
router.delete('/:id', param('id').isInt().withMessage('ID must be an integer'), ingredientController.delete);

module.exports = router;
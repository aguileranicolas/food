const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const { getAllRecipes, getRecipe, postRecipe, getAllDiet, getApiRecipes, saveDietsInDataBase } = require('../controllers/api-controller')


const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
router.get('/', async (req, res) => {
  try {
    const recipesList = await getApiRecipes()
    await saveDietsInDataBase(recipesList)
    res.status(200).json({
      message: 'Se cargo la informacion a la base de datos'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: error.message
    })
  }
})

router.get('/recipes', async (req, res) => {
  try {
    const recipesList = await getAllRecipes()
    if (recipesList.length <= 0) {
      res.status(404).send({
        error: 'Ocurrio un error'
      })
    } else {
      res.status(200).json(recipesList)
    }

  } catch (error) {
    console.error(error)
    res.status(500).send({
      error: error.message
    })
  }
})

router.get('/recipes/:idReceta', async (req, res) => {
  try {
    const { idReceta } = req.params
    const recipe = await getRecipe(idReceta)
    if (!recipe) {
      res.status(404).send({
        error: `A recipe with the id was not found ${idReceta}`
      })
    } else {
      res.status(200).json(recipe)
    }

  } catch (error) {
    console.error(error)
    res.status(500).send({
      error: error.message
    })
  }
})

router.post('/recipes', async (req, res) => {
  try {
    const { name, image, summary, healthyLevel, steps, diets, vegetarian, vegan, glutenFree, created } = req.body
    const recipe = await postRecipe({ name, image, summary, healthyLevel, steps, diets, vegetarian, vegan, glutenFree, created })
    res.status(201).json(recipe)
  } catch (error) {
    console.error(error)
    res.status(404).json({
      error: error.message
    })
  }
})

router.get('/diets', async (req, res) => {

  try {
    const dietsList = await getAllDiet()
    if (!dietsList.length > 0) {
      res.status(404).send({
        error: 'No diets were found in the database'
      })
    } else {
      res.status(200).json(dietsList)
    }
  } catch (error) {
    console.error(error)
    res.status(500).send({
      error: error.message
    })
  }
})


module.exports = router;






// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

// router.get('/', (req, res) => {
//   const recipesList = fetchData()
//   res.status(200).json(recipesList)
// })



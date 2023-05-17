const axios = require('axios');
const { Recipe, Diet } = require('../db');
const { Op } = require('sequelize');
const { extractSteps, extracDiets } = require('../utils');

const apiKeys = [
  "4a58109b63424107a96c52897fd97495",
  "9917e02758d04a33b111a0407e49667a",
  "5e4e2347bfad477a9b858d3b8c510636",
  "24cda1982466431d9b5c404f0a9fa027",
  "b53daef63a2b4b6daf619c05619642b8",
  "d02bf89b5c274af3a7062e790b75a523",
  "9c4003f41ae342078a844309a7c86494"
  //agregar aqui más api keys de ser necesario.
];

let currentApiKeyIndex = 0;

async function getApiRecipes() {
  const currentApiKey = apiKeys[currentApiKeyIndex];
  const endpoint = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${currentApiKey}&addRecipeInformation=true&number=100`;

  try {
    console.log('currentApiKey', currentApiKey)
    const recipes = await axios.get(endpoint);
    saveRecipesInDatabase(recipes.data.results)
    return recipes.data.results
    // Success! Do something with the response
  } catch (error) {
    // Endpoint failed, try the next API key
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
    if (currentApiKeyIndex === 0) {
      console.log("Todas las claves de API han fallado. Volviendo al principio...");
    } else {
      console.log('Cambiando api...')
      return getApiRecipes();
    }
  }
}

const getAllRecipes = async () => {
  const databaseRecipes = await getDBRecipes()
  return databaseRecipes
}

const getDBRecipes = async () => {
  const recipes = await Recipe.findAll({
    include: [{
      model: Diet,
      attributes: ['name'],
      through: {
        attributes: []
      }
    }]
  })
  return recipes
}

const saveRecipesInDatabase = async (apiRecipes) => {
  //guardar las recetas que me llegan por parametro dentro de la base de datos
  try {
    const recipes = apiRecipes.map(recipe => ({
      name: recipe.title,
      image: recipe.image,
      summary: recipe.summary,
      healthyLevel: recipe.healthScore,
      stepByStep: extractSteps(recipe?.analyzedInstructions[0]?.steps)
    }));
    await Recipe.bulkCreate(recipes);
    console.log(`Se guardaron ${apiRecipes.length} nuevas recetas en la base de datos.`);
    return;

  } catch (error) {
    console.error(error);
    return;
  }

}

const saveDietsInDataBase = async (recipesList) => {
  try {
    const dietsDB = extracDiets(recipesList)
    const diets = dietsDB?.map((diet) => ({
      name: diet
    }))
    await Diet.bulkCreate(diets);
    console.log(`Se guardaron ${dietsDB.length} nuevas dietas en la base de datos.`);
    return;

  } catch (error) {
    console.error(error);
    return;
  }
}

const getRecipe = async (id) => {
  const recipe = await Recipe.findByPk(id, {
    include: [{
      model: Diet,
      attributes: ['id', 'name'],
      through: {
        attributes: []
      }
    }]
  })
  return recipe
}


const getRecipeByName = async (name) => {
  const recipe = await Recipe.findAll({
    where: {
      name: {
        [Op.iLike]: `%${name}%`,
      }
    }
  },
    {
      include: [{
        model: Diet,
        attributes: ['id', 'name'],
        through: {
          attributes: []
        }
      }]
    })
  return recipe
}



const postRecipe = async ({ name, image, summary, healthyLevel, steps, diets }) => {

  if (diets.length <= 0) {
    return null;
  }

  const allDiets = await Diet.findAll()
  const filteredDiets = []
  diets.forEach(diet => {
    filteredDiets.push(allDiets.find((d) => {
      d === diet
    }))
  });
  const [recipe] = await Recipe.findOrCreate({
    where: { name },
    defaults: {
      name: name,
      image: image,
      summary: summary,
      healthyLevel: healthyLevel,
      steps: steps,
    }
  });

  //await Promise.all(diets.map(diet => Recipe.addRecipe(diet)));
  await Promise.all(filteredDiets.map(diet => recipe.addDiet(diet)));
  return recipe;
};

const getAllDiet = async () => {
  const diets = await Diet.findAll({
    include: [{
      model: Recipe,
      attributes: ['id', 'name', 'image', 'summary', 'healthyLevel', 'steps'],
      through: {
        attributes: []
      }
    }]
  })
  return diets
}

module.exports = { getApiRecipes, getAllRecipes, getRecipe, getRecipeByName, postRecipe, getAllDiet, saveDietsInDataBase }

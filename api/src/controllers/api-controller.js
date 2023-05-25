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
  "9c4003f41ae342078a844309a7c86494",
  "f417fb4eeaf34bf09d0e1c436dba1c87",
  "54a7933980c94056b724354c90d53e24",
  "40829a11d1fe4566955f8a263691075b",
  "98a69fa78f084dfd87c45c755967cdd1",
  "3c2566f1de614a13bb9d70f8de9cec18",
  "fcd0c9ddd86d46b3bbcf490f8e525279",
  "a82cb635253c43ee871d3604f88f3d6e",
  "1589bf9be48f47c8b3a6dbeb38a41488",
  "2cab05a36ab546ae94f7cd65aa4ae7b0",
  "d8830423a3704784a79dd2c06f3e2b24"
  //agregar aqui más api keys de ser necesario.
];

let currentApiKeyIndex = 0;

async function getApiRecipes() {
  const currentApiKey = apiKeys[currentApiKeyIndex];
  const endpoint = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${currentApiKey}&addRecipeInformation=true&number=100`;

  try {
    console.log('currentApiKey', currentApiKey)
    const recipes = await axios.get(endpoint);
    //saveRecipesInDatabase(recipes.data.results)
    const apiRecipes = recipes?.data?.results?.map(recipe => {
      return {
        id: recipe.id,
        name: recipe.title,
        image: recipe.image,
        summary: recipe.summary,
        healthyLevel: recipe.healthScore,
        steps: extractSteps(recipe?.analyzedInstructions[0]?.steps),
        diets: recipe.diets,
        vegetarian: recipe.vegetarian,
        vegan: recipe.vegan,
        glutenFree: recipe.glutenFree,
        created: false
      }
    })
    return apiRecipes
  } catch (error) {
    // El punto final falló, intentar con la siguiente clave API
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
  const apiRecipes = await getApiRecipes()
  const databaseRecipes = await getDBRecipes()
  const totalRecipes = databaseRecipes?.concat(apiRecipes)
  return totalRecipes
}

const getDBRecipes = async () => {
  return await Recipe.findAll({
    include: {
      model: Diet,
      attributes: ['name'],
      through: { //comprobacion (mediante)
        attributes: [],
      },
    },
  })
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
  let recipe = {}
  if (id && id?.length > 10) {
    recipe = await Recipe.findByPk(id, {
      include: [{
        model: Diet,
        attributes: ['name'],
        through: {
          attributes: []
        }
      }]
    })
  } else {
    const currentApiKey = apiKeys[currentApiKeyIndex];
    const { data } = await axios.get(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${currentApiKey}`)
    recipe = {
      id: data.id,
      name: data.title,
      image: data.image,
      summary: data.summary,
      healthyLevel: data.healthScore,
      steps: extractSteps(data?.analyzedInstructions[0]?.steps),
      diets: data.diets,
      vegetarian: data.vegetarian,
      vegan: data.vegan,
      glutenFree: data.glutenFree,
      created: false
    }
  }
  return recipe
}

const postRecipe = async ({ name, image, summary, healthyLevel, steps, diets, vegetarian, vegan, glutenFree }) => {

  const recipe = await Recipe.create({
    name: name,
    image: image,
    summary: summary,
    healthyLevel: Number(healthyLevel),
    steps: steps,
    vegetarian: vegetarian,
    vegan: vegan,
    glutenFree: glutenFree,
    created: true
  });

  const dietsDb = await Diet.findAll({
    where: { name: diets },
  });

  recipe.addDiets(dietsDb);
};

const getAllDiet = async () => {
  const diets = await Diet.findAll({
    include: [{
      model: Recipe,
      attributes: ['id', 'name', 'image', 'summary', 'healthyLevel', 'steps', 'vegetarian', 'vegan', 'glutenFree', 'created'],
      through: {
        attributes: []
      }
    }]
  })
  return diets
}

module.exports = { getApiRecipes, getAllRecipes, getRecipe, postRecipe, getAllDiet, saveDietsInDataBase }

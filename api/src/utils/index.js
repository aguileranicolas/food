const extractSteps = (stepList) => { //array de strings
  const saveInDB = []
  stepList?.map((step) => {
    saveInDB.push(step.step)
  })
  return saveInDB
};

const extracDiets = (recipesList) => { // array de dietas
  let dietList = []
  recipesList?.map((recipe) => {
    recipe.diets.map(diet => {
      dietList.push(diet)
    })
  })
  const dietSet = new Set(dietList) //para que no se repitan las dietas
  dietList = []
  dietSet.forEach(diet => {
    dietList.push(diet)
  })
  return dietList
}
module.exports = { extractSteps, extracDiets }
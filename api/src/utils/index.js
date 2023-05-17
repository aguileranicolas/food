const extractSteps = (stepList) => {
  const saveInDB = []
  stepList?.map((step) => {
    saveInDB.push(step.step)
  })
  return saveInDB
};

const extracDiets = (recipesList) => {
  let dietList = []
  recipesList?.map((recipe) => {
    recipe.diets.map(diet => {
      dietList.push(diet)
    })
  })
  const dietSet = new Set(dietList)
  dietList = []
  dietSet.forEach(diet => {
    dietList.push(diet)
  })
  return dietList
}
module.exports = { extractSteps, extracDiets }
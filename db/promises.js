const echoTest = () => {
  // return Promise.reject(new Error('could not execute statement properly'))
  return Promise.resolve()
}

const openDatabase = () => {
  return Promise.reject(new Error('could not open database for some reason'))
}

console.log("Plugin integrity check ...");

const connect = () => { 
  echoTest()
    .catch((error) => {
      throw new Error("Integrity check FAILED ...")
    })
    .then(() => {
      console.log("Integrity check PASSED ...")
      console.log('Opening Database')
      return openDatabase()
    })
    .catch((error) => {
      console.log(error)
    })
}

connect()
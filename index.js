const { Resolver } = require('@parcel/plugin')
const path = require('path')
const querystring = require('querystring')

module.exports = new Resolver ({
  async resolve({ filePath, dependency, logger }) {
    const pkg = path.basename(filePath)
    const fileDir = path.dirname(filePath)
    const { moduleSpecifier, resolveFrom } = dependency
    const [ depFile, query ] = moduleSpecifier.split('?')
    const meta = querystring.parse(query || '') || {}
    const resolveDir = path.dirname(resolveFrom)


    // can only resolve relative to a Kram file and requires query string
    if ( meta.kram ) {
      logger.info({
        message: `Kram: resolving import of ${moduleSpecifier} from ${resolveDir}`,
        filePath,
        language: meta.lang
      })

      return {
        filePath: `${path.resolve(resolveDir, meta.kram)}`,
        meta,
        query: meta
      };
    }

    return null;

  }
});

const { Resolver } = require('@parcel/plugin')
const fs = require('fs').promises
const path = require('path')
const querystring = require('querystring')
const Kr = require('kram')

module.exports = new Resolver ({
  async resolve({ filePath, dependency, logger }) {
    const { moduleSpecifier, resolveFrom  } = dependency

    // can only resolve relative to a Kram file and requires query string
    if ( resolveFrom.match(/\.kr$/) ) {
      logger.info({
        message: `Kram: resolving import of ${moduleSpecifier} from ${resolveFrom}`,
        filePath
      })

      const file = await fs.readFile(resolveFrom)
      const content = file.toString()
      const { front, doc } = Kr.parse( content )
      const { platform } = front

      const absolutePath = path.resolve(resolveFrom, moduleSpecifier)
      const tail = absolutePath.replace(`${resolveFrom}/${platform}/`, '')
      const regex = /^([A-Za-z]\w*)\.(\w+)$/
      const matches = tail.match(regex)

      if ( matches ) {
          const [_, pkg, lang] = matches
          logger.info({
              message: `Kram: collating ${lang} code for ${platform}`,
              filePath
          })
          const code = doc.filter( t => t.type === "code" && t.lang === lang)
          const konfig = Kr.config(front, pkg)
          const generated = konfig.collate(code, lang)

          return {
              filePath: absolutePath,
              code: generated,
              lang
          };
      }
    }

    return null;

  }
});

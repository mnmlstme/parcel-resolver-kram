const { Resolver } = require('@parcel/plugin')
const fs = require('fs')
const path = require('path')
const Kr = require('kram')

const unstreamable = ['elm']

module.exports = new Resolver ({
  async resolve({ filePath, dependency, logger }) {
    const { resolveFrom  } = dependency

    // can only resolve relative to a Kram file
    if ( resolveFrom.match(/\.kr$/) ) {
      logger.info({
        message: `Kram: resolving import of ${filePath} from ${resolveFrom}`,
        filePath
      })

      const resolveDir = path.dirname(resolveFrom)

      const absolutePath = path.resolve(resolveDir, filePath)
      const regex = /[#](\w+)\.(\w+)$/
      const matches = absolutePath.match(regex)

      if ( matches ) {
          const [_, pkg, lang] = matches
          logger.info({
              message: `Kram: extracting ${pkg}.${lang} from ${resolveFrom}`,
              filePath
          })

          const kramFile = fs.readFileSync(resolveFrom)
          const content = kramFile.toString()
          const { front, doc } = Kr.parse( content )
          const code = doc.filter( t => t.type === "code" && t.lang === lang)
          const konfig = Kr.config(front, pkg)
          const generated = konfig.collate(code, lang)

          if ( unstreamable.includes(lang) ) {
              const hashkey = Kr.hashcode({front, doc}, lang).substr(-8)
              const tmpDir = path.join(resolveDir, '.kram', hashkey)
              const tmpFile = path.join(tmpDir, `${pkg}.${lang}`)
              fs.mkdirSync(tmpDir, {recursive: true})
              fs.writeFileSync(tmpFile, generated)

              return {
                  filePath: tmpFile,
                  code: generated,
                  lang
              }
          }

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

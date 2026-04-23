import fs from 'fs'
import path from 'path'

const projectDir = path.resolve(process.cwd(), 'src') // папка с кодом
const files = []

function collectFiles(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (fs.statSync(full).isDirectory()) {
      collectFiles(full)
    } else if (/\.(vue|ts|js)$/.test(entry)) {
      files.push(full)
    }
  }
}

collectFiles(projectDir)

const badUsages = []

const regexes = [
  // router.push("...") или router.replace("...")
  /router\.(push|replace)\(\s*['"`]/,
  // <router-link ... to="..." ...>  (в любом порядке атрибутов)
  /<router-link\b[^>]*\s+to\s*=\s*['"`][^'"]*['"`][^>]*>/i,
]

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8')
  for (const re of regexes) {
    if (re.test(code)) {
      badUsages.push({ file, re: re.toString() })
    }
  }
}

if (badUsages.length) {
  console.error(
    "❌ Найдены небезопасные обращения к router/to:\nИспользуйте router.push({ name: '...'}) вместо router.push('...')"
  )
  for (const { file, re } of badUsages) {
    console.error(`  ${file} → pattern ${re}`)
  }
  process.exit(1)
} else {
  console.log('✅ Проверка пройдена, небезопасных router.push/to не найдено')
}

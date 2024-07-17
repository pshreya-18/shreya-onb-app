
const cool = require('cool-ascii-faces')
const express = require('express')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const PORT = process.env.PORT || 5001

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/times', (req, res) => res.send(showTimes()))
  .get('/cool', (req, res) => res.send(cool()))
  .get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM test_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

function showTimes() {
  const times = process.env.TIMES || 5
  let result = ''
  for (i = 0; i < times; i++) {
    result += i + ' '
  }
  return result
}

function getHerokuSubdomain() {
  console.log('--- Getting Heroku Subdomain ---')
  console.log('### HEROKU_APP_NAME:', process.env.HEROKU_APP_NAME)
  console.log('### HEROKU_PR_NUMBER:', process.env.HEROKU_PR_NUMBER)
  console.log('### HEROKU_BRANCH:', process.env.HEROKU_BRANCH)

  if (!process.env.HEROKU_PR_NUMBER && !process.env.HEROKU_BRANCH) {
    console.error('Unable to resolve process.env.HEROKU_PR_NUMBER Heroku PR number or branch found')
    return
  }

  if (process.env.HEROKU_PR_NUMBER) {
    // pr-1234 => pr-1234
    return `pr-${process.env.HEROKU_PR_NUMBER}`
  }

  if (process.env.HEROKU_BRANCH) {
    // long-branch-name => br-long-branc
    // Take the first 10 characters
    const firstTenChars = process.env.HEROKU_BRANCH.substring(0, 10)

    // Removing trailing hyphen
    const withoutTrailingHyphen = firstTenChars.endsWith('-')
      ? firstTenChars.slice(0, -1)
      : firstTenChars

    // Concatenate with "br-"
    return `br-${withoutTrailingHyphen}`
  }

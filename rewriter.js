'use strict'

let GitHubApi = require('github')

let github = new GitHubApi({
  debug: false
})

const addSpaces = (input) => {
  let output = input.replace(/^((?:#)+(?!\W))/gm, '$1 ')
  return output
}

const cleanupReadme = (newContent, sha, filepath, branch, owner, repo) => {
  github.repos.fork({
    owner,
    repo
  }, function (err, res) {
    if (err) {
      console.log(err)
    }
    let forkOwner = res.data.owner.login
    let forkRepo = res.data.name

    console.log(forkOwner, forkRepo)

    github.repos.updateFile({
      owner: forkOwner,
      repo: forkRepo,
      path: filepath,
      message: 'Cleaned up h1-h5 tags',
      content: Buffer.from(newContent).toString('base64'),
      sha: sha
    }, (err, res) => {
      if (err) {
        console.log(err)
      }

      console.log(res)
      // console.log(`${forkOwner}:${forkRepo}`)

      github.pullRequests.create({
        owner: owner,
        repo: repo,
        title: 'Cleaned up heading tags in readme',
        base: branch,
        head: `${forkOwner}:${branch}`
      }, (err, res) => {
        if (err) {
          console.log(err)
        }
      })
    })
  })
}

const checkRepo = (owner, repo) => {
  github.authenticate({
    type: 'token',
    token: ''
  })

  github.repos.getReadme({
    owner,
    repo
  }, (err, res) => {
    if (err) {
      console.log(err)
    }

    let filePath = res.data.path

    let readmeText = Buffer.from(res.data.content, 'base64').toString()
    let readmeSHA = res.data.sha

    // console.log(readmeText)
    let editedReameText = addSpaces(readmeText)

    // console.log(editedReameText)
    let branch = res.data.html_url.split('blob/')[1].split('/')[0]

    if (editedReameText !== readmeText) {
      cleanupReadme(editedReameText, readmeSHA, filePath, branch, owner, repo)
      console.log('Found something different!')
    } else {
      // console.log('well that was anticlimatic... nothing changed')
    }
  })
}

checkRepo('719ben', 'liar')
checkRepo('719ben', 'Baudrate.py')

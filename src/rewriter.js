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
      console.log(`There was an error forking on ${owner}/${repo}`)
      return
    }
    let forkOwner = res.data.owner.login
    let forkRepo = res.data.name

    github.repos.updateFile({
      owner: forkOwner,
      repo: forkRepo,
      path: filepath,
      message: 'Cleaned up h1-h5 tags',
      content: Buffer.from(newContent).toString('base64'),
      sha: sha
    }, (err, res) => {
      if (err) {
        console.log(`There was an error updating a file on ${owner}/${repo}`)
        return
      }

      let requestBody = 'Hello,\nI am a bot that helps clean up GitHub Repo README header tags. A while ago GitHub changed their markdown render engine and all markdown # tags without a space now break. Let me know if you have any questions!\n[source code](https://github.com/719Ben/readme-bot)'

      github.pullRequests.create({
        owner: owner,
        repo: repo,
        title: 'Cleaned up heading tags in readme',
        body: requestBody,
        base: branch,
        head: `${forkOwner}:${branch}`
      }, (err, res) => {
        if (err) {
          console.log(`There was an error creating a pull request on ${owner}/${repo}`)
          return
        }
        console.log(`Created pull request on ${owner}/${repo}`)
      })
    })
  })
}

const checkRepo = (owner, repo) => {
  github.authenticate({
    type: 'token',
    token: process.argv[3]
  })

  github.repos.getReadme({
    owner,
    repo
  }, (err, res) => {
    if (err) {
      console.log(`No readme found for ${owner}/${repo}`)
      return
    }

    let filePath = res.data.path
    let readmeSHA = res.data.sha

    let readmeText = Buffer.from(res.data.content, 'base64').toString()
    let editedReameText = addSpaces(readmeText)

    let branch = res.data.html_url.split('blob/')[1].split('/')[0]

    if (editedReameText !== readmeText) {
      cleanupReadme(editedReameText, readmeSHA, filePath, branch, owner, repo)
      console.log(`Found something different on '${owner}/${repo}'`)
    } else {
      console.log(`well that was anticlimatic... nothing changed on '${owner}/${repo}'`)
    }
  })
}

let username = process.argv[2]

github.repos.getForUser({
  username
}, (err, res) => {
  if (err) {
    console.log(`there was an error getting the repos for ${username}`)
  }

  for (let repository of res.data) {
    console.log(`looking at ${repository.name}`)
    checkRepo(repository.owner.login, repository.name)
  }
})

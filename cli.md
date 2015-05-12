A small tool for exploring the function of the libraries APIs.

### git-repo-manager has-updates <repourl> <comittish>

  Tells you if the remote <repourl> is newer/different than <sha1>

### git-repo-manager clone-to <repourl> <dest>

  Clones the remote <repourl> to <dest>, using a intermediary local bare
  git repo to reduce network traffic

---

<repourl> is a valid URL that represents a git repository, optionally
with a #comittish added to the end. If no comittish is included, git's defaults are used.
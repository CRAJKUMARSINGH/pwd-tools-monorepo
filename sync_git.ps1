<#
.SYNOPSIS
    Fetch, fast-forward, and optionally push the current (or specified) branch.

.USAGE
    .\sync_git.ps1                        # fetch + pull --ff-only current branch
    .\sync_git.ps1 -Push                  # fetch + pull + push current branch
    .\sync_git.ps1 -Branch develop -Push  # fetch + pull + push 'develop'

.NOTES
    Refuses to run with uncommitted changes.
    Refuses to run when checked-out branch differs from -Branch.
    Never force-pushes. Never resets hard. Never auto-commits.
#>

param(
    [string]$Branch = "",
    [switch]$Push
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    & git @args
    if ($LASTEXITCODE -ne 0) {
        throw "git $($args -join ' ') failed (exit $LASTEXITCODE)"
    }
}

# Must be inside a git work-tree
Invoke-Git rev-parse --is-inside-work-tree | Out-Null

# Resolve branch
if (-not $Branch) {
    $Branch = (& git branch --show-current).Trim()
}
if (-not $Branch) {
    throw "Cannot determine current branch. Specify -Branch explicitly."
}

Write-Host ">> Branch : $Branch"

# Reject dirty working tree
$changes = & git status --porcelain
if ($changes) {
    Write-Host $changes
    throw "Uncommitted changes detected. Commit or stash them before syncing."
}

# Branch mismatch guard
$current = (& git branch --show-current).Trim()
if ($current -ne $Branch) {
    throw "Checked-out branch is '$current', not '$Branch'. Switch first."
}

# Fetch
Write-Host ">> Fetching origin..."
Invoke-Git fetch origin

# Show tracking status
Invoke-Git status -sb

# Fast-forward pull
Write-Host ">> Pulling --ff-only origin/$Branch..."
Invoke-Git pull --ff-only origin $Branch

# Optional push
if ($Push) {
    Write-Host ">> Pushing origin/$Branch..."
    Invoke-Git push origin $Branch
}

Write-Host ""
Write-Host "Git synchronization completed successfully."
Write-Host "HEAD: $((& git rev-parse HEAD).Trim())"

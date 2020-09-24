# aws-credentials-process-cache

Simple cache for credentials_process aws credentials generation technique


# Requirements

You need aws cli properly configured. Needs `sh` in order to execute the command, and `nodejs` to execute the script.

# How To

First of all clone this repo locally and execute `npm i -g .` from inside the repository folder.

For each credential you will like to cache you will have to add two profile entries in your `$HOME/.kube/config` file as follows:

```
[profile pro_tocache]
#This is just an example, use your own organization/personal command
credential_process = commandToGenerateCredentials arn:aws:iam::12343566789:role/role-to-assume

[profile pro]
#This will use aws-credentials-process-cache to proxy and cache your credentials for the provided profile (the one above)
credential_process = aws-credentials-process-cache pro_tocache
``` 

# How it works

This script executes the provided profile `credentials_process` and stores the result in a file at `$HOME/.aws_creds_cache`. On later invocations it checks the `Expiration` date and returns the current credential if still valid or invokes the command again.

# What is this useful for?

With this, you will be able to keep your credentials stored without any interaction which is useful for example, to use VSCode Kubernetes extension on AWS in case your organization has some kind of SSO process.

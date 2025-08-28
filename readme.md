This repo contains the code for [siddharthroy.com](https://siddharthroy.com)

![Screenshot](./screenshot.png)

## How to run

1. Install go-lang, make, and postgresql
2. Create a user and db for this project
3. Create .envrc file and fill in these fields
   ```
   export DB_DSN=
   export GOOGLE_CLIENT_ID=
   export ADMIN_EMAIL=
   ```
4. Exmple DSN
   ```
   postgres://siddharthroy:pass@localhost/mywebsite?sslmode=disable
   ```
5. Run `make migrate_up` to run the migrations
6. Run `makr run` to run the app

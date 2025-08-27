package main

type contextkey string

const isAuthenticatedContextKey = contextkey("isAuthenticatedContextKey")
const authenticatedUserIDContextKey = "authenticatedUserIdContextKey"
const userContextkey = contextkey("userContextKey")

package main

type contextkey string

const isAuthenticatedContextKey = contextkey("isAuthenticatedContextKey")
const authenticatedUserIDContextKey = contextkey("authenticatedUserIdContextKey")
const userContextkey = contextkey("userContextKey")

package main

type contextkey string

const isAuthenticatedContextKey = contextkey("isAuthenticatedContextKey")
const isAdminContextKey = contextkey("isAdmin")
const authenticatedUserIDContextKey = "authenticatedUserIdContextKey"
const userContextkey = contextkey("userContextKey")

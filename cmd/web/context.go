package main

type contextkey string

const isAuthenticatedContextKey = contextkey("isAuthenticatedContextKey")
const isAdminContextKey = contextkey("isAdmin")
const authenticatedUserIDContextKey = "authenticatedUserIdContextKey"
const isDarkMode = "isDarkMode"
const userContextkey = contextkey("userContextKey")
